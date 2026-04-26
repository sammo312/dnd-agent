"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  /** Human-friendly label of the panel that crashed (e.g. "Map Editor"). */
  panelName: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Localizes render-time crashes to the offending dock panel rather than
 * letting them propagate up and trigger the global Next.js
 * "Application error: a client-side exception" overlay (which blanks
 * the whole app and gives the user nothing actionable).
 *
 * The error message + stack are also dumped to the console with a
 * `[v0]` tag so they're easy to find in the debug log.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Stack is split across error.stack and componentStack; print both.
    console.log(
      `[v0] ${this.props.panelName} crashed:`,
      error?.message ?? error,
    );
    if (error?.stack) console.log("[v0] error stack:", error.stack);
    if (info?.componentStack) {
      console.log("[v0] component stack:", info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="max-w-md space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle
              className="h-5 w-5 shrink-0 text-destructive"
              aria-hidden
            />
            <h2 className="text-sm font-semibold text-foreground">
              {this.props.panelName} hit a snag
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            The panel failed to render. The full stack trace is in your
            browser console.
          </p>
          <pre className="max-h-40 overflow-auto rounded border border-border bg-background/60 p-2 font-mono text-[11px] leading-relaxed text-foreground/90">
            {error.message || String(error)}
          </pre>
          <button
            type="button"
            onClick={this.reset}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Try again
          </button>
        </div>
      </div>
    );
  }
}
