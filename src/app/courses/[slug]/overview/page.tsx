import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourse, getCourses } from "@/lib/db";
import CourseHeader from "@/components/CourseHeader";
import Prose from "@/components/Prose";

export const dynamicParams = false;
export function generateStaticParams() {
  return getCourses().map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: PageProps<"/courses/[slug]/overview">): Promise<Metadata> {
  const c = getCourse((await params).slug);
  return { title: c ? `${c.title} — overview, versions, lifecycle, tools` : "Course" };
}

export default async function OverviewPage({ params }: PageProps<"/courses/[slug]/overview">) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  const sections = [
    ["What it is & where it is used", course.overview_html],
    ["Versions & history", course.versions_html],
    ["Lifecycle", course.lifecycle_html],
    ["Tools used to develop", course.tools_html],
  ].filter(([, html]) => html);
  return (
    <>
      <CourseHeader course={course} tab="/overview" />
      {sections.map(([title, html]) => (
        <details key={title} className="panel" open>
          <summary>{title}</summary>
          <div className="panel-body"><Prose html={html} /></div>
        </details>
      ))}
    </>
  );
}
