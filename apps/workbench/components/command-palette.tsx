"use client";

import {
  Map,
  BookOpen,
  Terminal,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@dnd-agent/ui/components/command";
import { useWorkbenchStore } from "@/lib/workbench-store";

const PANEL_COMMANDS = [
  {
    id: "map-editor",
    label: "Map Editor",
    shortcut: "⌘ 1",
    icon: Map,
  },
  {
    id: "narrative-editor",
    label: "Story Boarder",
    shortcut: "⌘ 2",
    icon: BookOpen,
  },
  {
    id: "dm-terminal",
    label: "DM Terminal",
    shortcut: "⌘ 3",
    icon: Terminal,
  },
] as const;

export function CommandPalette() {
  const open = useWorkbenchStore((s) => s.commandPaletteOpen);
  const setOpen = useWorkbenchStore((s) => s.setCommandPaletteOpen);
  const minimizedPanels = useWorkbenchStore((s) => s.minimizedPanels);
  const minimizePanel = useWorkbenchStore((s) => s.minimizePanel);
  const restorePanel = useWorkbenchStore((s) => s.restorePanel);
  const restoreAllPanels = useWorkbenchStore((s) => s.restoreAllPanels);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Search for a command to run..."
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Toggle Panels">
          {PANEL_COMMANDS.map((cmd) => {
            const isHidden = minimizedPanels.has(cmd.id);
            return (
              <CommandItem
                key={cmd.id}
                onSelect={() => {
                  if (isHidden) {
                    restorePanel(cmd.id);
                  } else {
                    minimizePanel(cmd.id);
                  }
                  setOpen(false);
                }}
              >
                {isHidden ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
                <span>
                  {isHidden ? "Show" : "Hide"} {cmd.label}
                </span>
                <CommandShortcut>{cmd.shortcut}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Panel Actions">
          <CommandItem
            onSelect={() => {
              restoreAllPanels();
              setOpen(false);
            }}
          >
            <RotateCcw className="size-4" />
            <span>Show All Panels</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
