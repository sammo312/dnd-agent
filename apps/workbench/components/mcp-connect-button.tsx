"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, Check, Plug, Power } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@dnd-agent/ui/components/dialog";
import { useWorkbenchStore } from "../lib/workbench-store";
import { useMcpBridge, type McpBridgeStatus } from "../hooks/use-mcp-bridge";

/**
 * Top-rail "MCP" pill. Same visual language as Export / Open in player —
 * thin amber-on-stone monospace button that fits the workbench's
 * existing chrome.
 *
 * Behaviour:
 *   - Click opens a dialog with the connection state, the toggle, the
 *     server URL, and a copy-paste-ready Claude Desktop config snippet.
 *   - The little dot in the pill mirrors the bridge status: dim (off),
 *     solid amber (connected), red (registered but server unreachable).
 *   - The bridge polling hook lives here at the rail level rather than
 *     inside the dialog so polling keeps running while the dialog is
 *     closed; otherwise users would see "Disconnected" every time they
 *     reopened the dialog.
 */
export function McpConnectButton() {
  const enabled = useWorkbenchStore((s) => s.mcpEnabled);
  const setEnabled = useWorkbenchStore((s) => s.setMcpEnabled);
  const status = useMcpBridge({ enabled });

  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-amber-700/40 bg-stone-900/90 px-2.5 py-1 font-mono text-xs text-amber-300/90 shadow-sm backdrop-blur-sm transition-colors hover:border-amber-500/60 hover:bg-stone-800 hover:text-amber-200"
        aria-label={`MCP bridge ${enabled ? statusLabel(status) : "off"}. Open settings.`}
      >
        <StatusDot status={enabled ? status : "idle"} />
        <span className="hidden sm:inline">MCP</span>
      </button>

      <McpConnectDialog
        open={open}
        onOpenChange={setOpen}
        enabled={enabled}
        onToggle={setEnabled}
        status={status}
      />
    </>
  );
}

interface McpConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  status: McpBridgeStatus;
}

function McpConnectDialog({
  open,
  onOpenChange,
  enabled,
  onToggle,
  status,
}: McpConnectDialogProps) {
  // Compute the local server URL once on open. We use window.location so
  // demo URLs work whether the user is on localhost:3000 or a Vercel
  // preview — but mcp-remote pointed at localhost is by far the common
  // case so we lead with that in the snippet.
  const serverUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:3000/api/mcp";
    return `${window.location.origin}/api/mcp`;
  }, []);

  const claudeConfig = useMemo(
    () =>
      JSON.stringify(
        {
          mcpServers: {
            "dnd-workbench": {
              command: "npx",
              args: ["-y", "mcp-remote", serverUrl],
            },
          },
        },
        null,
        2,
      ),
    [serverUrl],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0 overflow-hidden border-amber-700/30 bg-stone-950 text-amber-100/90">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-amber-900/30">
          <DialogTitle className="font-mono text-amber-200 flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Connect over MCP
          </DialogTitle>
          <DialogDescription className="text-amber-100/60 text-sm leading-relaxed">
            Drive this workbench from Claude Desktop, Cursor, or any other
            MCP client. Tool calls flow through the same in-app DM
            handlers — your map and story update live.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          <ToggleRow
            enabled={enabled}
            status={status}
            onToggle={onToggle}
          />

          <CopyableField
            label="Server URL"
            value={serverUrl}
            mono
          />

          <CopyableField
            label="Claude Desktop config"
            sublabel="Add this to claude_desktop_config.json and restart Claude."
            value={claudeConfig}
            multiline
          />

          <p className="text-[11px] leading-relaxed text-amber-100/50">
            The DM Terminal panel must be open in this tab — that&apos;s what
            executes the tool calls. Calls time out after 30s if the
            terminal isn&apos;t mounted.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleRow({
  enabled,
  status,
  onToggle,
}: {
  enabled: boolean;
  status: McpBridgeStatus;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-amber-900/30 bg-stone-900/50 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <StatusDot status={enabled ? status : "idle"} large />
        <div className="flex flex-col">
          <span className="font-mono text-xs text-amber-200">
            {enabled ? statusLabel(status) : "Bridge off"}
          </span>
          <span className="text-[11px] text-amber-100/50 leading-tight">
            {enabled
              ? status === "connected"
                ? "Polling for tool calls."
                : status === "disconnected"
                  ? "Reconnecting…"
                  : "Waiting for first poll…"
              : "External clients can't reach the workbench."}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={
          enabled
            ? "inline-flex items-center gap-1.5 rounded border border-amber-700/40 bg-amber-700/20 px-2.5 py-1 font-mono text-xs text-amber-200 hover:bg-amber-700/30"
            : "inline-flex items-center gap-1.5 rounded border border-amber-700/40 bg-stone-900 px-2.5 py-1 font-mono text-xs text-amber-300/80 hover:bg-stone-800 hover:text-amber-200"
        }
      >
        <Power className="h-3 w-3" />
        {enabled ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}

function CopyableField({
  label,
  sublabel,
  value,
  mono,
  multiline,
}: {
  label: string;
  sublabel?: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  // Reset the "copied" affordance after a moment so successive copies
  // both show feedback. Keyed on `value` so editing the URL/config
  // resets it too.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Permissions denied — leave the icon as Copy. Users can still
      // select the text manually since we render it readably.
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-[11px] uppercase tracking-wider text-amber-200/80">
          {label}
        </label>
        {sublabel && (
          <span className="text-[10px] text-amber-100/40">{sublabel}</span>
        )}
      </div>
      <div className="relative">
        {multiline ? (
          <pre
            className={`max-h-48 overflow-auto rounded-md border border-amber-900/30 bg-stone-900/80 px-3 py-2.5 pr-9 font-mono text-[11px] leading-relaxed text-amber-100/85 whitespace-pre`}
          >
            {value}
          </pre>
        ) : (
          <div
            className={`flex items-center rounded-md border border-amber-900/30 bg-stone-900/80 px-3 py-2 pr-9 ${mono ? "font-mono" : ""} text-xs text-amber-100/85`}
          >
            <span className="truncate">{value}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : `Copy ${label}`}
          className="absolute top-1.5 right-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-amber-200/70 hover:bg-amber-900/30 hover:text-amber-100"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function StatusDot({
  status,
  large = false,
}: {
  status: McpBridgeStatus;
  large?: boolean;
}) {
  // idle = dim, connected = solid amber, disconnected = red
  const size = large ? "h-2 w-2" : "h-1.5 w-1.5";
  const color =
    status === "connected"
      ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
      : status === "disconnected"
        ? "bg-red-500"
        : "bg-amber-200/30";
  // The pulse on disconnected makes "the server is currently retrying"
  // visually distinct from "idle / not enabled".
  const pulse = status === "disconnected" ? "animate-pulse" : "";
  return (
    <span
      aria-hidden
      className={`inline-block rounded-full ${size} ${color} ${pulse}`}
    />
  );
}

function statusLabel(status: McpBridgeStatus): string {
  switch (status) {
    case "connected":
      return "Connected";
    case "disconnected":
      return "Reconnecting";
    case "idle":
    default:
      return "Connecting…";
  }
}

