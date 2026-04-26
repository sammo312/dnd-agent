"use client"

import { useChat } from "@ai-sdk/react"
import { useRef, useEffect } from "react"

// ──────────────────────────────────────────────────────
// DM Demo Terminal: uses Vercel AI SDK's useChat hook.
//
// useChat handles:
//   - Conversation history management
//   - Streaming responses from the API route
//   - Tool call execution + multi-step loops
//   - Message state (loading, error, etc.)
//
// The API route (apps/workbench/app/api/chat/route.ts)
// uses streamText + allDmTools. World tools POST mutations
// to the sync server relay, which broadcasts via WebSocket
// to the player app.
// ──────────────────────────────────────────────────────

export default function DMDemoPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
    })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-focus input after response
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus()
  }, [isLoading])

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-gray-200 flex flex-col font-mono">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3 flex items-center justify-between shrink-0">
        <pre className="text-amber-500 text-xs leading-tight">
{`╔═══════════════════════╗
║  THE LIVING STAGE     ║
║  DM Terminal          ║
╚═══════════════════════╝`}
        </pre>
        <div className="text-xs text-gray-600">
          Vercel AI SDK • useChat • streamText
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-gray-600 text-sm space-y-2">
            <p>Type a command to control the world.</p>
            <p className="text-gray-700">Try: &quot;Spawn a dragon at position 10, 8&quot;</p>
            <p className="text-gray-700">Try: &quot;Set the lighting to dramatic red and spawn skeletons at 5, 5&quot;</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            {/* User messages */}
            {msg.role === "user" && (
              <div className="text-sm text-amber-400">
                <span className="text-gray-600">[DM] </span>
                {msg.content}
              </div>
            )}

            {/* Assistant messages */}
            {msg.role === "assistant" && (
              <div className="text-sm space-y-1">
                {/* Show tool calls as cue sheet */}
                {msg.parts?.map((part, i) => {
                  if (part.type === "tool-invocation") {
                    const toolName = part.toolInvocation.toolName
                    const args = JSON.stringify(part.toolInvocation.args, null, 0)
                    return (
                      <div key={i} className="text-xs text-cyan-600 pl-4 border-l border-cyan-900">
                        ▸ {toolName}({args})
                      </div>
                    )
                  }
                  if (part.type === "text" && part.text.trim()) {
                    return (
                      <div key={i} className="text-gray-300">
                        <span className="text-gray-600">[AI] </span>
                        {part.text}
                      </div>
                    )
                  }
                  return null
                })}

                {/* Fallback for simple content */}
                {!msg.parts?.length && msg.content && (
                  <div className="text-gray-300">
                    <span className="text-gray-600">[AI] </span>
                    {msg.content}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-xs text-gray-600 animate-pulse">
            ⏳ Thinking...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-red-400">
            Error: {error.message}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-4 shrink-0">
        <div className="flex gap-2">
          <span className="text-amber-500 py-2">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={isLoading ? "Thinking..." : "What happens next?"}
            disabled={isLoading}
            autoFocus
            className="flex-1 bg-transparent border-none text-gray-200 text-sm placeholder:text-gray-700 focus:outline-none"
          />
          {isLoading && <span className="text-gray-600 py-2 animate-pulse">⏳</span>}
        </div>
      </form>
    </div>
  )
}
