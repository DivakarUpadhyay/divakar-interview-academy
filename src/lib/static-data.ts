// Browser-side access to the data files built at deploy time (/data/*.json), so the whole site can be
// served as static files. Each file is fetched once per page load and then filtered in memory.
import type { Question, SearchDoc, SearchHit } from "@/lib/db";

const cache = new Map<string, Promise<unknown>>();
function load<T>(url: string): Promise<T> {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url}: ${r.status}`);
      return r.json();
    }).catch((e) => { cache.delete(url); throw e; }));
  }
  return cache.get(url) as Promise<T>;
}

export type QuestionFilter = { courses?: string[]; levels?: string[]; priorities?: string[]; q?: string };

/** Questions matching every given filter, in the default order (course, then High → Low priority). */
export async function findQuestions(f: QuestionFilter): Promise<Question[]> {
  const all = await load<Question[]>("/data/questions.json");
  const text = f.q?.trim().toLowerCase();
  return all.filter((q) =>
    (!f.courses?.length || f.courses.includes(q.course_slug)) &&
    (!f.levels?.length || f.levels.includes(q.level)) &&
    (!f.priorities?.length || f.priorities.includes(q.priority)) &&
    (!text || q.question.toLowerCase().includes(text) || q.answer_html.toLowerCase().includes(text)));
}

/** `count` random questions matching the filters, for mock interviews. */
export async function randomQuestions(f: QuestionFilter, count: number): Promise<Question[]> {
  const pool = [...await findQuestions(f)];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every word must appear (in the title or text); title hits rank higher. Returns up to `limit` hits with a marked snippet. */
export async function search(term: string, limit = 40): Promise<SearchHit[]> {
  const words = term.toLowerCase().match(/[\p{L}\p{N}#+.]+/gu)?.slice(0, 8) ?? [];
  if (!words.length) return [];
  const docs = await load<SearchDoc[]>("/data/search.json");
  const marker = new RegExp(words.map(reEsc).join("|"), "gi");
  const hits: { doc: SearchDoc; score: number }[] = [];
  for (const doc of docs) {
    const title = doc.title.toLowerCase();
    const body = doc.body.toLowerCase();
    let score = 0;
    for (const w of words) {
      const inTitle = title.includes(w);
      if (!inTitle && !body.includes(w)) { score = -1; break; }
      score += (inTitle ? 8 : 0) + Math.min(body.split(w).length - 1, 10);
    }
    if (score > 0) hits.push({ doc, score });
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit).map(({ doc }) => {
    const at = Math.max(doc.body.toLowerCase().indexOf(words[0]), 0);
    const start = Math.max(doc.body.lastIndexOf(" ", Math.max(at - 60, 0)), 0);
    const raw = doc.body.slice(start, start + 180).trim();
    const snippet = (start > 0 ? "… " : "") + esc(raw).replace(marker, (m) => `<mark>${m}</mark>`) + (start + 180 < doc.body.length ? " …" : "");
    return { kind: doc.kind, course_slug: doc.course_slug, course_title: doc.course_title, ref: doc.ref, title: doc.title, snippet };
  });
}
