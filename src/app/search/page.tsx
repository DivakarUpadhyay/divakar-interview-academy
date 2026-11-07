import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import SearchBox from "./SearchBox";

export const metadata: Metadata = pageMeta({ title: "Search", description: "Search lessons, interview answers and cheat sheets.", path: "/search", noindex: true });

export default function SearchPage() {
  return (
    <>
      <h1>Search everything</h1>
      <p className="muted">Lessons, interview answers, cheat sheets and course overviews. Search runs in your browser, so results appear as you type.</p>
      <SearchBox />
    </>
  );
}
