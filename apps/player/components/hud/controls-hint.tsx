"use client";

interface ControlsHintProps {
  visible: boolean;
}

export function ControlsHint({ visible }: ControlsHintProps) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-background/80 backdrop-blur-sm rounded-lg px-6 py-4 border border-foreground/10">
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-foreground/10 rounded text-sm font-mono">
                W
              </kbd>
            </div>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-foreground/10 rounded text-sm font-mono">
                A
              </kbd>
              <kbd className="px-2 py-1 bg-foreground/10 rounded text-sm font-mono">
                S
              </kbd>
              <kbd className="px-2 py-1 bg-foreground/10 rounded text-sm font-mono">
                D
              </kbd>
            </div>
            <span className="text-xs text-foreground/60">Move</span>
          </div>
          <div className="h-12 w-px bg-foreground/20" />
          <div className="flex flex-col items-center gap-2">
            <kbd className="px-3 py-1 bg-foreground/10 rounded text-sm font-mono">
              Click
            </kbd>
            <span className="text-xs text-foreground/60">Walk to</span>
          </div>
          <div className="h-12 w-px bg-foreground/20" />
          <div className="flex flex-col items-center gap-2">
            <kbd className="px-3 py-1 bg-foreground/10 rounded text-sm font-mono">
              ESC
            </kbd>
            <span className="text-xs text-foreground/60">Exit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
