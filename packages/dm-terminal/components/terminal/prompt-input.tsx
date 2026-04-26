"use client";

import { useEffect, useRef } from "react";
import { Square, SquareCheck, Loader2 } from "lucide-react";

function cn(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(" ");
}

/**
 * Bottom-of-terminal prompt input with auto mode toggle and submit.
 *
 * - Auto-grows up to ~6 lines.
 * - Enter submits, Shift+Enter inserts newline.
 * - When `autoMode` is on, an empty submit sends "continue." so the DM can
 *   just hammer Enter to keep the agent rolling.
 * - Disabled while waiting on a pending askQuestion (the picker takes over).
 */
export interface PromptInputProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: (text: string) => void;
  isStreaming: boolean;
  isAwaitingChoice: boolean;
  autoMode: boolean;
  onToggleAutoMode: () => void;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isStreaming,
  isAwaitingChoice,
  autoMode,
  onToggleAutoMode,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea to fit content (cap at ~6 lines).
  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 144)}px`;
  }, [value]);

  // Re-focus the input after streaming ends or after a choice resolves.
  useEffect(() => {
    if (!isStreaming && !isAwaitingChoice) {
      textareaRef.current?.focus();
    }
  }, [isStreaming, isAwaitingChoice]);

  const disabled = isStreaming || isAwaitingChoice;

  function submit() {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed && !autoMode) return;
    onSubmit(trimmed.length > 0 ? trimmed : "continue.");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const placeholder = isAwaitingChoice
    ? "answer above…"
    : isStreaming
      ? "agent is responding…"
      : autoMode
        ? "auto mode on — press enter to continue, or steer with a message"
        : "describe a scene, or what to refine next…";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-border bg-[var(--bg-deep)]/40 backdrop-blur-sm flex flex-col"
    >
      <div className="px-4 pt-3 pb-1.5 flex gap-2.5 items-start">
        <span
          aria-hidden
          className={cn(
            "font-mono shrink-0 select-none mt-1",
            disabled
              ? "text-muted-foreground/40"
              : "text-[var(--accent-amber)] text-glow-amber"
          )}
        >
          {">"}
        </span>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          spellCheck={false}
          className={cn(
            "flex-1 bg-transparent font-mono text-sm leading-relaxed resize-none outline-none",
            "text-foreground placeholder:text-muted-foreground/50",
            "min-h-[1.5em] max-h-36 disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        />
      </div>
      <div className="px-4 pb-2.5 flex items-center justify-between gap-3 font-mono text-[11px]">
        <button
          type="button"
          onClick={onToggleAutoMode}
          className={cn(
            "group inline-flex items-center gap-1.5 px-2 py-1 border transition-colors select-none",
            autoMode
              ? "border-[var(--accent-amber)]/60 bg-[var(--accent-amber)]/10 text-[var(--accent-amber)]"
              : "border-border text-muted-foreground hover:border-[var(--accent-amber)]/40 hover:text-foreground"
          )}
          style={{ borderRadius: "2px" }}
          title="When on, the agent takes initiative — pitch new beats and keep building without explicit prompts."
        >
          {autoMode ? (
            <SquareCheck className="size-3" />
          ) : (
            <Square className="size-3" />
          )}
          <span>auto mode</span>
          {autoMode ? (
            <span
              aria-hidden
              className="inline-block size-1.5 rounded-full bg-[var(--accent-amber)] animate-pulse-glow ml-0.5"
            />
          ) : null}
        </button>

        <div className="flex items-center gap-3 text-muted-foreground/70">
          <span className="inline-flex items-center gap-1.5">
            {isStreaming ? (
              <>
                <Loader2 className="size-3 animate-spin text-[var(--accent-amber)]" />
                <span>thinking</span>
              </>
            ) : isAwaitingChoice ? (
              <span className="text-[var(--accent-amber)]/80">
                awaiting your choice
              </span>
            ) : (
              <span>ready</span>
            )}
          </span>
          <span className="text-muted-foreground/40 hidden sm:inline">
            enter to send · shift+enter newline
          </span>
        </div>
      </div>
    </form>
  );
}
