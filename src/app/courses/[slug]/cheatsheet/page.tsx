import type { Metadata } from "next";
import { breadcrumbs, describe, jsonLd, pageMeta, SITE_NAME, SITE_URL } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getCheats, getCourse, getCourses } from "@/lib/db";
import CourseHeader from "@/components/CourseHeader";
import Prose from "@/components/Prose";
import PrintButton from "@/components/PrintButton";

export const dynamicParams = false;
export function generateStaticParams() {
  return getCourses().map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: PageProps<"/courses/[slug]/cheatsheet">): Promise<Metadata> {
  const c = getCourse((await params).slug);
  if (!c) return { title: "Cheat sheet" };
  return pageMeta({ title: `${c.title} Cheat Sheet`, description: `One-page ${c.title} cheat sheet for quick revision before an interview: key facts, syntax, comparisons and pitfalls.`, path: `/courses/${c.slug}/cheatsheet` });
}

export default async function CheatPage({ params }: PageProps<"/courses/[slug]/cheatsheet">) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  const cheats = getCheats(course.id);
  return (
    <>
      <CourseHeader course={course} tab="/cheatsheet" />
      <div className="row no-print" style={{ marginBottom: 12 }}>
        <span className="muted">Quick revision for interview day. Print it or save it as a PDF.</span>
        <span className="spacer" />
        <PrintButton />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 420px), 1fr))" }}>
        {cheats.map((s) => (
          <div key={s.id} className="card">
            <h3 style={{ marginTop: 0 }}>{s.title}</h3>
            <Prose html={s.body_html} />
          </div>
        ))}
      </div>
    </>
  );
}
