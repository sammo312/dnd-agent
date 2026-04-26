"use client";

import { useEffect, useState } from "react";
import type { IDockviewPanelHeaderProps } from "dockview-react";

/**
 * A non-closable tab. Dockview's default tab renders a close button and also
 * closes on middle-click; this strips both so the three primary surfaces
 * (DM Terminal, Map Editor, Story Boarder) can never be dismissed — there's
 * no way to re-summon them once closed.
 */
export function StaticTab(props: IDockviewPanelHeaderProps) {
  const [title, setTitle] = useState(props.api.title);

  useEffect(() => {
    const sub = props.api.onDidTitleChange(() => setTitle(props.api.title));
    return () => sub.dispose();
  }, [props.api]);

  return (
    <div
      className="flex h-full items-center px-3 text-xs font-mono tracking-tight"
      onMouseDown={(e) => {
        // Swallow middle-click so dockview's default close handler doesn't fire.
        if (e.button === 1) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onAuxClick={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <span>{title}</span>
    </div>
  );
}
