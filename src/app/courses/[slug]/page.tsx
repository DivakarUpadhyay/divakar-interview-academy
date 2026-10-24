import type { Metadata } from "next";
import { breadcrumbs, describe, jsonLd, pageMeta, SITE_NAME, SITE_URL } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse, getCourses, getSyllabus } from "@/lib/db";
import CourseHeader from "@/components/CourseHeader";
import { Grade, Legend, Priority } from "@/components/Badges";
import { CourseProgress, DoneMark } from "@/components/LessonDone";

export const dynamicParams = false;
export function generateStaticParams() {
  return getCourses().map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const c = getCourse((await params).slug);
  if (!c) return { title: "Course" };
  return pageMeta({ title: `${c.title} — Tutorial & Syllabus`, description: `Learn ${c.title} step by step: ${c.summary}`, path: `/courses/${c.slug}` });
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  const modules = getSyllabus(course.id);
  const all = modules.flatMap((m) => m.lessons);
  const next = getCourses().find((c) => c.seq === course.seq + 1);
  return (
    <>
      <CourseHeader course={course} tab="" />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([{
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: describe(course.summary, 300),
        url: `${SITE_URL}/courses/${course.slug}`,
        provider: { "@type": "Organization", name: SITE_NAME, sameAs: SITE_URL },
        educationalLevel: "Beginner to Advanced",
        inLanguage: "en",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "INR", category: "Free" },
        hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: `PT${Math.max(1, Math.round(course.lessons * 0.25))}H` },
      }, breadcrumbs([{ name: "Courses", path: "/courses" }, { name: course.title, path: `/courses/${course.slug}` }])])} />
      <div className="row" style={{ marginBottom: 16 }}>
        <CourseProgress ids={all.map((l) => `${course.slug}/${l.slug}`)} />
        <span className="spacer" />
        {all[0] && <Link className="btn primary" href={`/courses/${course.slug}/lessons/${all[0].slug}`}>Start lesson 1</Link>}
        <Link className="btn" href={`/courses/${course.slug}/overview`}>Versions, lifecycle &amp; tools</Link>
        <Link className="btn" href={`/courses/${course.slug}/interview`}>Interview Q&amp;A</Link>
      </div>
      <Legend />
      <div style={{ marginTop: 16 }}>
        {modules.map((m) => (
          <div key={m.id} className="card module">
            <h3>Module {m.ord}: {m.title}</h3>
            <ul className="lesson-list">
              {m.lessons.map((l) => (
                <li key={l.id}>
                  <span className="num">{l.seq}.</span>
                  <Link href={`/courses/${course.slug}/lessons/${l.slug}`}>{l.title}</Link>
                  <DoneMark id={`${course.slug}/${l.slug}`} />
                  <span className="spacer" />
                  <Grade g={l.grade} /> <Priority p={l.priority} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {next && <p>Next course in the roadmap: <Link href={`/courses/${next.slug}`}>{next.seq}. {next.title} →</Link></p>}
    </>
  );
}
