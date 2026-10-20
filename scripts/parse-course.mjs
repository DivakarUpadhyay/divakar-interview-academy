// Parses one course Markdown file into { meta, overview, versions, lifecycle, tools, modules, questions, cheats }.
//
// File layout:
//   ---  front matter (key: value)  ---
//   # Overview | # Versions | # Lifecycle | # Tools           free Markdown
//   # Module: <title>   then  ## Lesson: [Grade|Priority] <title>
//   # Interview         then  ## [Level|Priority] <question>     answer follows
//   # Cheatsheet        then  ## <section title>
// Grade    = Basic | Intermediate | Advanced
// Level    = Beginner | Intermediate | Advanced | Scenario
// Priority = High | Medium | Low   (how often it comes up in interviews)
// Headings inside fenced code blocks are ignored.

export const GRADES = ["Basic", "Intermediate", "Advanced"];
export const LEVELS = ["Beginner", "Intermediate", "Advanced", "Scenario"];
export const PRIORITIES = ["High", "Medium", "Low"];

export function slugify(s) {
  return s.toLowerCase().replace(/c#/g, "csharp").replace(/\.net/g, "dotnet").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function tags(raw, allowed, file, lineNo) {
  const [a, b = "Medium"] = raw.split("|").map((s) => s.trim());
  if (!allowed.includes(a)) throw new Error(`${file}:${lineNo}: "${a}" must be one of ${allowed.join(", ")}`);
  if (!PRIORITIES.includes(b)) throw new Error(`${file}:${lineNo}: priority "${b}" must be High, Medium or Low`);
  return [a, b];
}

export function parseCourse(text, file = "course.md") {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const meta = {};
  let i = 0;
  if (lines[0].trim() === "---") {
    for (i = 1; i < lines.length && lines[i].trim() !== "---"; i++) {
      const m = lines[i].match(/^(\w+):\s*(.*)$/);
      if (m) meta[m[1]] = m[2].trim();
    }
    i++;
  }
  for (const k of ["slug", "title", "track", "order"]) if (!meta[k]) throw new Error(`${file}: missing front matter "${k}"`);

  const out = { file, meta, overview: "", versions: "", lifecycle: "", tools: "", modules: [], questions: [], cheats: [] };
  let section = null;
  let item = null;
  let free = null;
  let fence = null;

  const flush = () => {
    if (free) { out[section] = free.join("\n").trim(); free = null; }
    if (item) { item.finish(item.body.join("\n").trim()); item = null; }
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const f = line.match(/^\s*(```+|~~~+)/);
    if (f) {
      if (!fence) fence = f[1];
      else if (line.trim().replace(/[`~]/g, "") === "" && line.trim().length >= fence.length) fence = null;
    } else if (!fence) {
      const h1 = line.match(/^# (.+)$/);
      if (h1) {
        flush();
        const t = h1[1].trim();
        const mod = t.match(/^Module:\s*(.+)$/i);
        if (mod) { section = "module"; out.modules.push({ title: mod[1].trim(), lessons: [] }); continue; }
        const key = t.toLowerCase().replace(/[^a-z]/g, "");
        if (["overview", "versions", "lifecycle", "tools"].includes(key)) { section = key; free = []; continue; }
        if (key === "interview") { section = "interview"; continue; }
        if (key === "cheatsheet") { section = "cheatsheet"; continue; }
        throw new Error(`${file}:${i + 1}: unknown top-level heading "${t}"`);
      }
      const h2 = line.match(/^## (.+)$/);
      if (h2 && ["module", "interview", "cheatsheet"].includes(section)) {
        flush();
        const t = h2[1].trim();
        if (section === "module") {
          const l = t.match(/^Lesson:\s*\[([^\]]+)\]\s*(.+)$/i);
          if (!l) throw new Error(`${file}:${i + 1}: expected "## Lesson: [Grade|Priority] <title>"`);
          const [grade, priority] = tags(l[1], GRADES, file, i + 1);
          const mod = out.modules[out.modules.length - 1];
          item = { body: [], finish: (body) => mod.lessons.push({ title: l[2].trim(), grade, priority, body }) };
        } else if (section === "interview") {
          const q = t.match(/^\[([^\]]+)\]\s*(.+)$/);
          if (!q) throw new Error(`${file}:${i + 1}: expected "## [Level|Priority] question"`);
          const [level, priority] = tags(q[1], LEVELS, file, i + 1);
          item = { body: [], finish: (body) => out.questions.push({ level, priority, question: q[2].trim(), answer: body }) };
        } else {
          item = { body: [], finish: (body) => out.cheats.push({ title: t, body }) };
        }
        continue;
      }
    }
    if (item) item.body.push(line);
    else if (free) free.push(line);
    else if (line.trim() && section !== null) throw new Error(`${file}:${i + 1}: text outside a lesson/question/section`);
  }
  if (fence) throw new Error(`${file}: unclosed code fence`);
  flush();
  for (const q of out.questions) if (!q.answer) throw new Error(`${file}: question without answer: ${q.question}`);
  for (const m of out.modules) for (const l of m.lessons) if (!l.body) throw new Error(`${file}: empty lesson: ${l.title}`);
  return out;
}
