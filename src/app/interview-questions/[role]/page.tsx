import type { Metadata } from "next";
import { breadcrumbs, describe, jsonLd, pageMeta, SITE_NAME, SITE_URL } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourses, getQuestionsForCourses } from "@/lib/db";
import { getRole, ROLES } from "@/lib/roles";
import { shortTitle } from "@/lib/menu";
import QuestionList from "@/components/QuestionList";

export const dynamicParams = false;
export function generateStaticParams() {
  return ROLES.map((r) => ({ role: r.slug }));
}
export async function generateMetadata({ params }: PageProps<"/interview-questions/[role]">): Promise<Metadata> {
  const r = getRole((await params).role);
  if (!r) return { title: "Interview questions" };
  return pageMeta({ title: `${r.title} Interview Questions & Answers`, description: `${r.title} interview preparation: ${r.summary} Must-know questions first, with short clear answers.`, path: `/interview-questions/${r.slug}` });
}

export default async function RolePage({ params }: PageProps<"/interview-questions/[role]">) {
  const role = getRole((await params).role);
  if (!role) notFound();
  const all = getCourses();
  const courses = role.courses.map((s) => all.find((c) => c.slug === s)).filter((c) => c !== undefined);
  const questions = getQuestionsForCourses(courses.map((c) => c.slug));
  const must = questions.filter((q) => q.priority === "High").length;
  return (
    <>
      <div className="crumbs"><Link href="/interview-questions">Interview Questions</Link> › {role.title}</div>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.filter((q) => q.priority === "High").slice(0, 60).map((q) => ({
          "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: describe(q.answer_html, 1200) } })),
      }, breadcrumbs([{ name: "Interview Questions", path: "/interview-questions" }, { name: role.title, path: `/interview-questions/${role.slug}` }])])} />
      <div className="role-head">
        <span className="icon" style={{ background: role.color }}>{role.icon}</span>
        <div>
          <h1>{role.title} — Interview Questions</h1>
          <div className="muted">{role.summary}</div>
        </div>
      </div>
      <div className="must-banner">
        <span className="badge High">★ Must know</span>
        <span><b>{must}</b> of {questions.length} questions are the ones interviewers ask most for this role. They are shown first; clear the
          Must-know filter to see everything.</span>
      </div>
      <div className="role-courses">
        <span className="muted small">Topics in study order:</span>
        {courses.map((c, i) => (
          <Link key={c.slug} className="badge course" href={`/courses/${c.slug}`}>{i + 1}. {shortTitle(c)}</Link>
        ))}
      </div>
      <QuestionList questions={questions} showCourse initialPriorities={["High"]}
        courses={courses.map((c) => ({ slug: c.slug, title: shortTitle(c) }))} />
    </>
  );
}
