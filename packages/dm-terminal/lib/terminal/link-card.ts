import { ANSI } from "./ansi";

export type LinkSurface = "map" | "story";

interface LinkCardOptions {
  surface: LinkSurface;
  /** Short noun describing what changed, shown in the card header. */
  title: string;
  /** 1-2 sentence summary of what the agent just did. */
  summary: string;
}

/**
 * Render a "link to surface" card inline in the terminal. The card is a
 * cyan-bordered box with a header, the agent's summary, and a hint for
 * the slash-command that focuses the corresponding panel.
 *
 * Width is conservative (60 cols) so it fits in narrow split layouts.
 */
export function formatLinkCard({ surface, title, summary }: LinkCardOptions): string {
  const slash = surface === "map" ? "/map" : "/story";
  const surfaceLabel = surface === "map" ? "Map Editor" : "Story Boarder";
  const inner = 58; // 60 minus 2 border chars

  const top = `╭─ ${title} ${"─".repeat(Math.max(0, inner - 3 - title.length))}╮`;
  const bottom = `╰${"─".repeat(inner)}╯`;
  const hint = `↳ open with ${slash}  ·  ${surfaceLabel}`;

  const wrapped = wrap(summary, inner - 2);
  const summaryLines = wrapped.map(
    (line) =>
      `│ ${ANSI.text}${line}${ANSI.reset}${" ".repeat(
        Math.max(0, inner - 1 - line.length),
      )}│`,
  );

  const hintLine = `│ ${ANSI.dimText}${hint}${ANSI.reset}${" ".repeat(
    Math.max(0, inner - 1 - hint.length),
  )}│`;

  return [
    "",
    `${ANSI.cyan}${top}${ANSI.reset}`,
    ...summaryLines.map((l) => `${ANSI.cyan}${l[0]}${ANSI.reset}${l.slice(1, -1)}${ANSI.cyan}${l[l.length - 1]}${ANSI.reset}`),
    `${ANSI.cyan}│${ANSI.reset}${" ".repeat(inner)}${ANSI.cyan}│${ANSI.reset}`,
    `${ANSI.cyan}${hintLine[0]}${ANSI.reset}${hintLine.slice(1, -1)}${ANSI.cyan}${hintLine[hintLine.length - 1]}${ANSI.reset}`,
    `${ANSI.cyan}${bottom}${ANSI.reset}`,
    "",
  ].join("\r\n");
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (!line.length) {
      line = w;
    } else if (line.length + 1 + w.length <= width) {
      line += " " + w;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length === 0 ? [""] : lines;
}
