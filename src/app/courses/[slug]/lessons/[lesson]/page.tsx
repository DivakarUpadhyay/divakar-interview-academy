import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLessonParams, getCourse, getLesson, getSyllabus } from "@/lib/db";
import Prose from "@/components/Prose";
import { Grade, Priority } from "@/components/Badges";
import { DoneMark, LessonDoneToggle } from "@/components/LessonDone";

export const dynamicParams = false;
export function generateStaticParams() {
  return getAllLessonParams();
}
export async function generateMetadata({ params }: PageProps<"/courses/[slug]/lessons/[lesson]">): Promise<Metadata> {
  const { slug, lesson } = await params;
  const c = getCourse(slug);
  const l = c && getLesson(c.id, lesson);
  return { title: l && c ? `${l.title} — ${c.title}` : "Lesson" };
}

export default async function LessonPage({ params }: PageProps<"/courses/[slug]/lessons/[lesson]">) {
  const { slug, lesson: lessonSlug } = await params;
  const course = getCourse(slug);
  const lesson = course && getLesson(course.id, lessonSlug);
  if (!course || !lesson) notFound();
  const modules = getSyllabus(course.id);
  const all = modules.flatMap((m) => m.lessons);
  const prev = all.find((l) => l.seq === lesson.seq - 1);
  const next = all.find((l) => l.seq === lesson.seq + 1);
  return (
    <div className="layout-2">
      <aside className="sidebar sidebar-desktop">
        <Link href={`/courses/${course.slug}`}><b>{course.title}</b></Link>
        {modules.map((m) => (
          <div key={m.id}>
            <h4>{m.ord}. {m.title}</h4>
            {m.lessons.map((l) => (
              <Link key={l.id} href={`/courses/${course.slug}/lessons/${l.slug}`} className={l.id === lesson.id ? "active" : ""}>
                {l.seq}. {l.title} <DoneMark id={`${course.slug}/${l.slug}`} />
              </Link>
            ))}
          </div>
        ))}
        <h4>Then</h4>
        <Link href={`/courses/${course.slug}/interview`}>Interview Q&amp;A</Link>
        <Link href={`/courses/${course.slug}/cheatsheet`}>Cheat sheet</Link>
      </aside>
      <article>
        <div className="crumbs">
          <Link href="/roadmap">Roadmap</Link> › <Link href={`/courses/${course.slug}`}>{course.title}</Link> › Module: {lesson.module_title}
        </div>
        <h1>{lesson.seq}. {lesson.title}</h1>
        <div className="row">
          <Grade g={lesson.grade} />
          <Priority p={lesson.priority} />
          <span className="muted small">Lesson {lesson.seq} of {all.length}</span>
        </div>
        <Prose html={lesson.body_html} />
        <div className="row" style={{ marginTop: 24 }}><LessonDoneToggle id={`${course.slug}/${lesson.slug}`} /></div>
        <div className="pager">
          {prev ? (
            <Link className="card" href={`/courses/${course.slug}/lessons/${prev.slug}`}><span className="muted small">← Previous</span><br />{prev.title}</Link>
          ) : <span />}
          {next ? (
            <Link className="card next" href={`/courses/${course.slug}/lessons/${next.slug}`}><span className="muted small">Next →</span><br />{next.title}</Link>
          ) : (
            <Link className="card next" href={`/courses/${course.slug}/interview`}><span className="muted small">Course finished →</span><br />Practise the interview questions</Link>
          )}
        </div>
      </article>
    </div>
  );
}
