"use client"

import { useState, useRef, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { DemoPlayerScene } from "@dnd-agent/three-engine"
import { useSyncServer } from "@/hooks/use-sync-server"

// ──────────────────────────────────────────────────────
// Demo page: the player's view of The Living Stage.
//
// Connects to sync server via WebSocket.
// Renders DemoPlayerScene with live game state.
// Includes a player CLI for two-way interaction.
// ──────────────────────────────────────────────────────

export default function DemoPage() {
  const sync = useSyncServer()
  const [input, setInput] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return
    const message = input.trim()
    setInput("")
    setSending(true)
    setAiResponse("")

    const response = await sync.sendMessage(message, "player")
    if (response) {
      setAiResponse(response)
    }
    setSending(false)
    inputRef.current?.focus()
  }, [input, sending, sync])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  // Latest narration events (last 5)
  const recentNarration = sync.narrativeQueue.slice(-5)

  return (
    <div className="h-screen w-screen relative bg-black">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [15, 12, 15], fov: 50 }}
        shadows
        className="w-full h-full"
      >
        <DemoPlayerScene
          entities={sync.entities}
          lighting={sync.lighting as any}
          mood={sync.mood as any}
          cameraDirective={sync.cameraDirective}
          fogRevealed={sync.fogRevealed}
        />
      </Canvas>

      {/* Connection status */}
      <div className="fixed top-4 right-4 z-10">
        <div
          className={`px-3 py-1 rounded-full text-xs font-mono ${
            sync.connected
              ? "bg-green-900/80 text-green-300"
              : "bg-red-900/80 text-red-300"
          }`}
        >
          {sync.connected ? "● Connected" : "○ Disconnected"}
        </div>
      </div>

      {/* Narration event log */}
      <div className="fixed bottom-24 left-4 right-4 z-10 pointer-events-none">
        <div className="max-w-2xl mx-auto space-y-2">
          {recentNarration.map((event) => (
            <div
              key={event.id}
              className={`
                px-4 py-2 rounded-lg font-mono text-sm animate-fade-in
                ${event.style === "dramatic" ? "bg-purple-900/90 text-purple-100 text-base" : ""}
                ${event.style === "whisper" ? "bg-gray-900/80 text-gray-400 italic text-xs" : ""}
                ${event.style === "shout" ? "bg-red-900/90 text-red-100 font-bold uppercase" : ""}
                ${event.style === "system" ? "bg-blue-900/80 text-blue-300 text-xs" : ""}
                ${event.style === "normal" ? "bg-black/80 text-gray-200" : ""}
              `}
            >
              {event.text}
            </div>
          ))}
        </div>
      </div>

      {/* AI response display */}
      {aiResponse && (
        <div className="fixed bottom-40 left-4 right-4 z-10 pointer-events-none">
          <div className="max-w-2xl mx-auto bg-amber-900/80 text-amber-100 px-4 py-2 rounded-lg font-mono text-sm">
            {aiResponse}
          </div>
        </div>
      )}

      {/* Player input */}
      <div className="fixed bottom-4 left-4 right-4 z-10">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={sending ? "Thinking..." : "What do you do?"}
            disabled={sending}
            className="flex-1 bg-black/80 border border-gray-700 text-gray-200 px-4 py-2 rounded-lg font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="bg-amber-700 hover:bg-amber-600 disabled:bg-gray-800 disabled:text-gray-600 text-white px-4 py-2 rounded-lg font-mono text-sm transition-colors"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  )
}
