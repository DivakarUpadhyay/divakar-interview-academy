export function Priority({ p }: { p: string }) {
  return <span className={`badge ${p}`} title={`${p} interview priority`}>{p === "High" ? "★ Must know" : p}</span>;
}
export function Grade({ g }: { g: string }) {
  return <span className="badge grade">{g}</span>;
}
export function Level({ l }: { l: string }) {
  return <span className={`badge level ${l}`}>{l}</span>;
}
export function Legend() {
  return (
    <div className="legend">
      <span>Interview priority:</span>
      <span className="badge High">★ Must know</span> <span>High priority — asked in almost every interview, learn first</span>
      <span className="badge Medium">Medium</span> <span>asked regularly</span>
      <span className="badge Low">Low</span> <span>good to know</span>
    </div>
  );
}

/** How hard a question is to answer well, derived from its level. */
export const easeOf = (level: string) => (level === "Beginner" ? "Easy" : level === "Intermediate" ? "Medium" : "Hard");
export function Ease({ level }: { level: string }) {
  const e = easeOf(level);
  return <span className={`badge ease-${e}`} title={`${e} to answer`}>{e} to answer</span>;
}
