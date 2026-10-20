import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCourse, getCourses, getQuestionsForCourse } from "@/lib/db";
import CourseHeader from "@/components/CourseHeader";
import QuestionList from "@/components/QuestionList";

export const dynamicParams = false;
export function generateStaticParams() {
  return getCourses().map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: PageProps<"/courses/[slug]/interview">): Promise<Metadata> {
  const c = getCourse((await params).slug);
  return { title: c ? `${c.title} — interview questions & answers` : "Interview" };
}

export default async function CourseInterview({ params }: PageProps<"/courses/[slug]/interview">) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  return (
    <>
      <CourseHeader course={course} tab="/interview" />
      <QuestionList questions={getQuestionsForCourse(course.id)} />
    </>
  );
}
