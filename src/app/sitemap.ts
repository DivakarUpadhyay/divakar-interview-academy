import type { MetadataRoute } from "next";
import { getAllLessonParams, getCourses } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { SITE_URL } from "@/lib/seo";
import { TOOLS } from "@/lib/tools";

export const dynamic = "force-static";

// Every public page: static sections, each course (+ overview, interview Q&A, cheat sheet), every lesson and every role bank.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string, priority: number, changeFrequency: "weekly" | "monthly" = "monthly") =>
    ({ url: `${SITE_URL}${path}`, lastModified: now, changeFrequency, priority });

  return [
    url("", 1, "weekly"),
    url("/roadmap", 0.9, "weekly"),
    url("/courses", 0.9, "weekly"),
    url("/interview-questions", 0.9, "weekly"),
    url("/interview-questions/all", 0.9, "weekly"),
    url("/interview", 0.7),
    url("/cheatsheets", 0.7),
    url("/practice", 0.6),
    url("/interview-day", 0.6),
    url("/demo", 0.5),
    url("/api-docs", 0.3),
    url("/tools", 0.9, "weekly"),
    ...TOOLS.map((t) => url(`/tools/${t.slug}`, 0.9, "weekly")),
    url("/mentoring", 0.7),
    url("/interview-prep-pack", 0.7),
    url("/hire", 0.5),
    url("/advertise", 0.4),
    url("/about", 0.4),
    url("/contact", 0.3),
    url("/privacy", 0.2),
    url("/terms", 0.2),
    url("/disclosure", 0.2),
    ...ROLES.map((r) => url(`/interview-questions/${r.slug}`, 0.8)),
    ...getCourses().flatMap((c) => [
      url(`/courses/${c.slug}`, 0.8),
      url(`/courses/${c.slug}/overview`, 0.6),
      url(`/courses/${c.slug}/interview`, 0.8),
      url(`/courses/${c.slug}/cheatsheet`, 0.6),
    ]),
    ...getAllLessonParams().map((p) => url(`/courses/${p.slug}/lessons/${p.lesson}`, 0.7)),
  ];
}
