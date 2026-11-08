"""Builds the paid ".NET Interview Prep Pack" PDF from DevLadder's own content (data/academy.db):
must-know (High priority) questions for the core .NET full-stack topics, scenario questions, one-page cheat sheets,
a 30-day study plan and the interview-day checklist. Output: products/DevLadder-NET-Interview-Prep-Pack.pdf
(products/ is gitignored because the PDF is sold).

Usage: npm run db && python scripts/build_prep_pack.py
"""
import datetime
import html
import re
import sqlite3
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "products" / "DevLadder-NET-Interview-Prep-Pack.pdf"
SITE = "https://devladder.pages.dev"

# Core topics for a .NET full-stack interview, in study order: (course slug, chapter title).
TOPICS = [
    ("csharp", "C#"), ("oop", "Object-oriented programming"), ("solid", "SOLID principles"),
    ("design-patterns", "Design patterns"), ("linq", "LINQ"), ("dotnet-platform", "Modern .NET: hosting, config, DI"),
    ("aspnet-core-mvc", "ASP.NET Core MVC"), ("aspnet-core-webapi", "ASP.NET Core Web API"), ("efcore", "Entity Framework Core"),
    ("dapper", "Dapper"), ("sqlserver", "SQL Server and T-SQL"), ("azure", "Microsoft Azure"), ("docker", "Docker"),
    ("system-design", "System design"), ("microservices", "Microservices"),
    ("dotnet-fullstack-interview", ".NET full-stack interview round"), ("hr-behavioral", "HR and behavioural"),
]
CHEATS = ["csharp", "aspnet-core-webapi", "efcore", "linq", "sqlserver", "system-design"]

PLAN_30 = [
    ("Days 1-5", "C# and OOP", "Read the C# and OOP chapters. Say every answer out loud once; mark the ones you hesitate on."),
    ("Days 6-8", "SOLID, patterns and LINQ", "Write one small example per SOLID principle and per pattern you can explain from your own projects."),
    ("Days 9-13", "ASP.NET Core and modern .NET", "Draw the request pipeline from memory: middleware order, routing, model binding, filters, DI lifetimes."),
    ("Days 14-17", "Data: EF Core, Dapper, SQL Server", "Practise writing a join, a CTE and a window function by hand. Explain one slow query you have fixed."),
    ("Days 18-20", "Azure and Docker", "Be ready to describe how your last app was built, deployed and monitored."),
    ("Days 21-24", "System design and microservices", "Design one system end to end on paper: a URL shortener or an order service. Time yourself: 30 minutes."),
    ("Days 25-27", "Scenario questions", "Answer every scenario question in this pack using: situation, what you checked, what you changed, the result."),
    ("Days 28-29", "Mock interviews", "Run two timed mock interviews (devladder.pages.dev/practice or a real person). Fix the weakest topic."),
    ("Day 30", "Light revision", "Only the cheat sheets and your marked questions. Rest well; tired recall is worse than one more topic."),
]


def interview_day_plan():
    """Reuses the checklist from the site's Interview Day page so both stay identical."""
    src = (ROOT / "src/app/interview-day/page.tsx").read_text(encoding="utf-8")
    block = src[src.index("const PLAN"):src.index("];", src.index("const PLAN"))]
    out = []
    for m in re.finditer(r'when:\s*"([^"]+)",\s*items:\s*\[(.*?)\]', block, re.S):
        items = re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(2))
        out.append((m.group(1), [i.replace("\\'", "'") for i in items]))
    return out


def build_html(db):
    c = db.cursor()
    stats = c.execute("SELECT (SELECT COUNT(*) FROM courses), (SELECT COUNT(*) FROM questions)").fetchone()
    chapters, total_q, toc = [], 0, []
    for slug, title in TOPICS:
        cid = c.execute("SELECT id FROM courses WHERE slug=?", (slug,)).fetchone()[0]
        qs = c.execute("""SELECT level, question_html, answer_html FROM questions WHERE course_id=? AND priority='High'
            ORDER BY CASE level WHEN 'Beginner' THEN 1 WHEN 'Intermediate' THEN 2 WHEN 'Advanced' THEN 3 ELSE 4 END, ord""", (cid,)).fetchall()
        total_q += len(qs)
        anchor = f"ch-{slug}"
        toc.append(f'<li><a href="#{anchor}">{html.escape(title)}</a> <span class="n">{len(qs)} questions</span></li>')
        items = "".join(
            f'<div class="q"><div class="qh"><span class="lvl {lvl.lower()}">{lvl}</span> {qh}</div><div class="a">{ah}</div></div>'
            for lvl, qh, ah in qs)
        chapters.append(f'<section class="chapter" id="{anchor}"><h2>{html.escape(title)}</h2>'
                        f'<p class="sub">Must-know questions, easiest first. Full course: {SITE}/courses/{slug}</p>{items}</section>')

    cheat_html = []
    for slug in CHEATS:
        title = dict(TOPICS)[slug]
        cid = c.execute("SELECT id FROM courses WHERE slug=?", (slug,)).fetchone()[0]
        secs = c.execute("SELECT title, body_html FROM cheats WHERE course_id=? ORDER BY ord", (cid,)).fetchall()
        cheat_html.append(f'<section class="chapter cheat"><h2>Cheat sheet: {html.escape(title)}</h2>'
                          + "".join(f'<div class="cs"><h3>{html.escape(t)}</h3>{b}</div>' for t, b in secs) + "</section>")

    plan = "".join(f"<tr><td><b>{d}</b></td><td>{html.escape(t)}</td><td>{html.escape(x)}</td></tr>" for d, t, x in PLAN_30)
    day = "".join(f'<h3>{html.escape(w)}</h3><ul>{"".join(f"<li>{html.escape(i)}</li>" for i in items)}</ul>' for w, items in interview_day_plan())
    today = datetime.date.today().strftime("%B %Y")

    return f"""<!doctype html><html><head><meta charset="utf-8"><title>.NET Interview Prep Pack</title><style>
  @page {{ size: A4; margin: 18mm 16mm 20mm; }}
  body {{ font: 10.5pt/1.5 "Segoe UI", Arial, sans-serif; color: #161a23; }}
  h1 {{ font-size: 30pt; margin: 0; color: #1e3a6e; }}
  h2 {{ font-size: 17pt; color: #1e3a6e; border-bottom: 2px solid #3b5bdb; padding-bottom: 4px; margin: 0 0 6px; }}
  h3 {{ font-size: 11.5pt; margin: 12px 0 4px; color: #1e3a6e; }}
  a {{ color: #3b5bdb; text-decoration: none; }}
  .cover {{ height: 245mm; display: flex; flex-direction: column; justify-content: center; page-break-after: always; }}
  .logo {{ display: inline-flex; align-items: center; gap: 10px; font-size: 18pt; font-weight: 700; margin-bottom: 26px; }}
  .logo span {{ background: #3b5bdb; color: #fff; border-radius: 10px; padding: 6px 10px; }}
  .cover p.lead {{ font-size: 13pt; color: #3b4458; max-width: 150mm; }}
  .cover .meta {{ margin-top: 30px; color: #5b6475; }}
  .chapter {{ page-break-before: always; }}
  .sub {{ color: #5b6475; margin: 0 0 10px; font-size: 9.5pt; }}
  .toc li {{ margin: 4px 0; }} .toc .n {{ color: #5b6475; font-size: 9pt; }}
  .q {{ border: 1px solid #dfe3ec; border-radius: 8px; padding: 8px 11px; margin: 0 0 8px; page-break-inside: avoid; }}
  .qh {{ font-weight: 700; margin-bottom: 4px; }}
  .a p {{ margin: 3px 0; }} .a ul, .a ol, .cs ul, .cs ol {{ margin: 3px 0; padding-left: 18px; }}
  .lvl {{ font-size: 7.5pt; font-weight: 700; text-transform: uppercase; border-radius: 4px; padding: 1px 5px; margin-right: 4px; vertical-align: 1px; }}
  .beginner {{ background: #e3f7e8; color: #2b8a3e; }} .intermediate {{ background: #e7ecff; color: #3b5bdb; }}
  .advanced {{ background: #fff1db; color: #b35c00; }} .scenario {{ background: #ffe3e3; color: #c92a2a; }}
  pre {{ background: #0f172a; color: #e2e8f0; border-radius: 6px; padding: 7px 9px; font-size: 8.3pt; white-space: pre-wrap; word-break: break-word; page-break-inside: avoid; }}
  code {{ font-family: Consolas, "Cascadia Code", monospace; font-size: 9pt; }}
  :not(pre) > code {{ background: #f0f2f8; padding: 0 3px; border-radius: 3px; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 9.5pt; }} td, th {{ border: 1px solid #dfe3ec; padding: 5px 7px; vertical-align: top; text-align: left; }}
  .cheat .cs {{ page-break-inside: avoid; }}
  .code-lang, .copy-btn {{ display: none; }}  /* website-only code-block controls */
  .tip {{ background: #eef6ff; border-left: 4px solid #4dabf7; padding: 8px 12px; border-radius: 6px; }}
</style></head><body>
<section class="cover">
  <div class="logo"><span>DL</span> DevLadder</div>
  <h1>.NET Interview Prep Pack</h1>
  <p class="lead">{total_q} must-know questions with short answers you can say out loud, scenario questions, six one-page cheat sheets,
  a 30-day study plan and an interview-day checklist. Built from {stats[0]} DevLadder courses and {stats[1]} interview questions.</p>
  <p class="meta">By Divakar Upadhyay, full-stack .NET developer · {today} · {SITE}</p>
</section>
<section><h2>How to use this pack</h2>
  <p>Start with the 30-day plan. For each question, cover the answer, say yours out loud, then compare. Mark anything you
  hesitate on and come back to it. The level tags show difficulty: <span class="lvl beginner">Beginner</span>
  <span class="lvl intermediate">Intermediate</span> <span class="lvl advanced">Advanced</span> <span class="lvl scenario">Scenario</span>.</p>
  <p class="tip">Scenario questions are where most candidates lose marks. Answer them as a story: what happened, what you checked,
  what you changed, and the result with a number if you have one.</p>
  <h2 style="margin-top:18px">Contents</h2><ol class="toc">{"".join(toc)}
    <li>Cheat sheets: {", ".join(dict(TOPICS)[s] for s in CHEATS)}</li><li>30-day study plan</li><li>Interview-day checklist</li></ol>
</section>
{"".join(chapters)}
{"".join(cheat_html)}
<section class="chapter"><h2>30-day study plan</h2><p class="sub">About 60-90 minutes a day. Adjust the order to the job description.</p>
  <table><tr><th>When</th><th>Focus</th><th>What to do</th></tr>{plan}</table></section>
<section class="chapter"><h2>Interview-day checklist</h2>{day}
  <p class="tip" style="margin-top:14px">Want to practise with a real person? Book a mock interview at {SITE}/mentoring</p></section>
</body></html>"""


def main():
    db = sqlite3.connect(ROOT / "data" / "academy.db")
    page_html = build_html(db)
    OUT.parent.mkdir(exist_ok=True)
    (OUT.parent / "prep-pack.html").write_text(page_html, encoding="utf-8")
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page()
        pg.set_content(page_html, wait_until="load")
        pg.pdf(path=str(OUT), format="A4", print_background=True, display_header_footer=True,
               header_template="<span></span>",
               footer_template='<div style="font-size:8px;color:#5b6475;width:100%;padding:0 16mm;display:flex;justify-content:space-between">'
                               '<span>DevLadder .NET Interview Prep Pack · devladder.pages.dev</span><span class="pageNumber"></span></div>',
               margin={"top": "16mm", "bottom": "18mm", "left": "14mm", "right": "14mm"})
        br.close()
    print(f"{OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
