"use client";

interface ScrollHintProps {
  visible: boolean;
}

export function ScrollHint({ visible }: ScrollHintProps) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <span className="text-foreground/70 text-sm">Scroll to explore</span>
      <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
        <div className="w-1.5 h-3 bg-foreground/50 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
