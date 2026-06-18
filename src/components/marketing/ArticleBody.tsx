import { Link } from "react-router-dom";

/**
 * Minimal, dependency-free Markdown renderer for insight article bodies.
 * Supports the subset our content uses:
 *   ## / ###   headings
 *   >          blockquote (pull quote — great for GEO citation)
 *   -          bullet list
 *   blank line paragraph break
 *   **bold**, [label](/internal-or-https-link)
 * Internal links (href starting with "/") use the SPA router so they do not
 * full-reload; external links open in a new tab.
 */

function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const label = m[1];
      const href = m[2];
      if (href.startsWith("/")) {
        nodes.push(<Link key={key++} to={href} className="text-brand-cyan hover:text-white underline underline-offset-2">{label}</Link>);
      } else {
        nodes.push(<a key={key++} href={href} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:text-white underline underline-offset-2">{label}</a>);
      }
    } else if (m[3] !== undefined) {
      nodes.push(<strong key={key++} className="text-white font-semibold">{m[3]}</strong>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function ArticleBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const special = (l: string) => l.startsWith("## ") || l.startsWith("### ") || l.startsWith("> ") || l.startsWith("- ");

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    if (line.startsWith("## ")) {
      blocks.push(<h2 key={key++} className="font-display text-2xl md:text-3xl font-bold text-white mt-12 mb-4">{inline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={key++} className="font-display text-xl font-bold text-white mt-8 mb-3">{inline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) { quote.push(lines[i].slice(2)); i++; }
      blocks.push(<blockquote key={key++} className="border-l-2 border-brand-orange pl-5 my-8 font-display text-xl md:text-2xl text-white leading-snug">{inline(quote.join(" "))}</blockquote>);
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) { items.push(lines[i].slice(2)); i++; }
      blocks.push(<ul key={key++} className="list-disc pl-6 mb-6 space-y-2 text-white/80 leading-relaxed">{items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>);
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !special(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(<p key={key++} className="text-white/80 leading-relaxed mb-6">{inline(para.join(" "))}</p>);
  }

  return <>{blocks}</>;
}
