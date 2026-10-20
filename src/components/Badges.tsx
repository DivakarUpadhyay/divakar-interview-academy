export function Priority({ p }: { p: string }) {
  return <span className={`badge ${p}`} title={`${p} interview priority`}>{p === "High" ? "★ High" : p}</span>;
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
      <span className="badge High">★ High</span> <span>asked very often — learn first</span>
      <span className="badge Medium">Medium</span> <span>asked regularly</span>
      <span className="badge Low">Low</span> <span>good to know</span>
    </div>
  );
}
