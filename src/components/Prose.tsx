/** Renders HTML that build-db.mjs produced from our own Markdown content. */
export default function Prose({ html, className = "" }: { html: string; className?: string }) {
  return <div className={`prose ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
