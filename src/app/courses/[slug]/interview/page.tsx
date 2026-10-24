import type { Metadata } from "next";
import { breadcrumbs, describe, jsonLd, pageMeta, SITE_NAME, SITE_URL } from "@/lib/seo";
import { notFound } from "next/navigation";
import { getCourse, getCourses, getQuestionsForCourse } from "@/lib/db";
import CourseHeader from "@/components/CourseHeader";
import QuestionList from "@/components/QuestionList";

const faq = (qs: { question: string; answer_html: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: qs.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: describe(q.answer_html, 1200) } })),
});

export const dynamicParams = false;
export function generateStaticParams() {
  return getCourses().map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: PageProps<"/courses/[slug]/interview">): Promise<Metadata> {
  const c = getCourse((await params).slug);
  if (!c) return { title: "Interview" };
  return pageMeta({ title: `${c.title} Interview Questions & Answers (${c.questions})`, description: `${c.questions} ${c.title} interview questions with clear answers — beginner, intermediate, advanced and scenario-based, with the must-know questions marked.`, path: `/courses/${c.slug}/interview` });
}

export default async function CourseInterview({ params }: PageProps<"/courses/[slug]/interview">) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  const questions = getQuestionsForCourse(course.id);
  return (
    <>
      <CourseHeader course={course} tab="/interview" />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([faq(questions), breadcrumbs([
        { name: "Courses", path: "/courses" }, { name: course.title, path: `/courses/${course.slug}` }, { name: "Interview questions", path: `/courses/${course.slug}/interview` }])])} />
      <QuestionList questions={questions} />
    </>
  );
}
