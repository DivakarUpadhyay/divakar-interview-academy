import Link from "next/link";
import { RESOURCES, type Resource } from "@/lib/earn";

/** "Recommended resources" box: useful links for the topic, plus DevLadder's own mock-interview offer. */
export default function Resources({ track, title = "Recommended resources" }: { track?: string; title?: string }) {
  const list: Resource[] = [...(RESOURCES[track ?? ""] ?? []), ...(track === "interview" ? [] : RESOURCES.default)];
  if (!list.length) return null;
  return (
    <aside className="card resources" aria-label={title}>
      <h2>{title}</h2>
      <ul>
        {list.map((r) => (
          <li key={r.url}>
            {r.url.startsWith("/") ? <Link href={r.url}><b>{r.title}</b></Link> : (
              <a href={r.url} target="_blank" rel={r.affiliate ? "sponsored noopener" : "noopener"}><b>{r.title}</b></a>
            )}
            {r.affiliate && <span className="badge resource-tag">affiliate</span>}
            <span className="muted small"> · {r.note}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
