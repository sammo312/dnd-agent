"use client";

/**
 * Message rendering primitives for the DM terminal.
 *
 * - `UserMessage`: amber `>` prompt prefix + user input echoed back.
 * - `AssistantText`: streamed agent prose, with optional blinking caret
 *   on the actively-streaming part.
 * - `SystemNote`: small italic note (errors, info, "thinking…").
 */

function cn(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

export function UserMessage({ content }: { content: string }) {
  return (
    <div className="font-mono flex gap-2 py-1 leading-relaxed">
      <span
        aria-hidden
        className="text-[var(--accent-amber)] text-glow-amber select-none shrink-0"
      >
        {">"}
      </span>
      <div className="flex-1 text-foreground whitespace-pre-wrap break-words">
        {content}
      </div>
    </div>
  );
}

/**
 * Renders streaming assistant prose. When `streaming` is true, a blinking
 * amber block caret is appended at the end.
 */
export function AssistantText({
  text,
  streaming,
}: {
  text: string;
  streaming?: boolean;
}) {
  // Split on double newlines so each paragraph stands alone.
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className="font-mono text-sm leading-relaxed text-foreground py-0.5">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className={cn("whitespace-pre-wrap break-words", i > 0 && "mt-2")}
        >
          {p}
          {streaming && i === paragraphs.length - 1 ? (
            <span
              aria-hidden
              className="inline-block w-[0.5em] h-[1em] align-text-bottom bg-[var(--accent-amber)]/85 ml-0.5 animate-pulse"
            />
          ) : null}
        </p>
      ))}
    </div>
  );
}

/** Pulsing "agent is thinking" placeholder while we're waiting for the first
 *  token of an assistant message. */
export function ThinkingLine() {
  return (
    <div className="font-mono text-xs text-muted-foreground py-1 flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full bg-[var(--accent-amber)]/80 animate-pulse-glow"
      />
      <span className="italic">thinking…</span>
    </div>
  );
}

/** Small italic system note — used for errors or meta info. */
export function SystemNote({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={cn(
        "font-mono text-xs italic py-1",
        tone === "muted" && "text-muted-foreground",
        tone === "error" && "text-[var(--accent-crimson)] not-italic"
      )}
    >
      {children}
    </div>
  );
}
