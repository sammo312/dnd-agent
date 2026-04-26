"use client";

import type { IDockviewPanelProps } from "dockview-react";
import dynamic from "next/dynamic";

const TerminalShell = dynamic(
  () => import("@dnd-agent/dm-terminal").then((m) => m.TerminalShell),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-[#0a0e14]">
        <span className="text-gray-500 animate-pulse">Loading terminal...</span>
      </div>
    ),
  }
);

export const DmTerminalPanel: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="h-full w-full bg-[#0a0e14]">
      <TerminalShell />
    </div>
  );
};

DmTerminalPanel.displayName = "DmTerminalPanel";
