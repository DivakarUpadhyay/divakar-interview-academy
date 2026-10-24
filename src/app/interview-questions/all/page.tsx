import type { Metadata } from "next";
import Link from "next/link";
import { getCourses, getQuestionIndex, getTracks } from "@/lib/db";
import { shortTitle } from "@/lib/menu";
import { pageMeta } from "@/lib/seo";
import { Ease, Priority } from "@/components/Badges";

export const metadata: Metadata = pageMeta({
  title: "All Interview Questions — Topic-wise List with Priority",
  description: "Every interview question on DevLadder listed topic by topic — fundamentals, .NET, SQL Server, cloud, frontend, automation and career — with must-know priority and how easy each one is to answer.",
  path: "/interview-questions/all",
});

export default function AllQuestions() {
  const tracks = getTracks();
  const courses = getCourses();
  const rows = getQuestionIndex();
  const byCourse = Map.groupBy(rows, (r) => r.course_slug);
  const must = rows.filter((r) => r.priority === "High").length;

  return (
    <>
      <div className="crumbs"><Link href="/interview-questions">Interview Questions</Link> › All questions</div>
      <h1>All Interview Questions — Topic-wise</h1>
      <p className="muted">
        {rows.length} questions in learning order. Inside each topic the <b>must-know</b> questions come first, then the rest from easy to
        hard. Click a question to open its course&apos;s Q&amp;A page with the short bullet-point answer.
      </p>
      <div className="qi-legend">
        <span className="badge High">★ Must know</span><span className="muted small">{must} questions — asked in almost every interview</span>
        <span className="badge ease-Easy">Easy to answer</span><span className="badge ease-Medium">Medium to answer</span><span className="badge ease-Hard">Hard to answer</span>
      </div>
      <div className="role-courses">
        {tracks.map((t) => <a key={t.slug} className="chip" href={`#${t.slug}`}>{t.menu}</a>)}
      </div>

      {tracks.map((t) => (
        <section key={t.slug} id={t.slug} className="tile-section">
          <h2>{t.title}</h2>
          {courses.filter((c) => c.track_slug === t.slug).map((c) => {
            const qs = byCourse.get(c.slug) ?? [];
            return (
              <div key={c.slug} className="qi-course">
                <h3>
                  <Link href={`/courses/${c.slug}/interview`}>{shortTitle(c)}</Link>
                  <span className="muted small">{qs.length} questions · {qs.filter((q) => q.priority === "High").length} must-know</span>
                </h3>
                <ol className="qi-list">
                  {qs.map((q) => (
                    <li key={q.id}>
                      <Link className="qi-q" href={`/courses/${c.slug}/interview`} dangerouslySetInnerHTML={{ __html: q.question_html }} />
                      <Priority p={q.priority} />
                      <Ease level={q.level} />
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
