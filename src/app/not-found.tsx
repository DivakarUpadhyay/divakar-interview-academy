import Link from "next/link";

export default function NotFound() {
  return (
    <div className="narrow">
      <h1>Page not found</h1>
      <p className="muted">That page doesn&apos;t exist. Try the roadmap or search.</p>
      <div className="row"><Link className="btn primary" href="/roadmap">Roadmap</Link><Link className="btn" href="/search">Search</Link></div>
    </div>
  );
}
