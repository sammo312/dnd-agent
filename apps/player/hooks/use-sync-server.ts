"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// ──────────────────────────────────────────────────────
// WebSocket hook for connecting to the sync server.
//
// Flow:
//   1. Connect to ws://localhost:3002
//   2. Receive full_state on connect
//   3. Receive mutations as they happen
//   4. Apply mutations to local state
//   5. Auto-reconnect on disconnect
// ──────────────────────────────────────────────────────

interface WorldEntity {
  id: string
  type: string
  name: string
  position: { x: number; y: number; z: number }
  color: string
  status?: {
    health?: { current: number; max: number }
    condition?: string
  }
  spawned_at: number
}

interface CameraDirective {
  target: { x: number; y: number; z: number }
  duration: number
  returnControl: boolean
  started_at: number
}

interface NarrativeEvent {
  id: string
  text: string
  style: string
  timestamp: number
  displayDuration: number
}

interface GameState {
  entities: Record<string, WorldEntity>
  lighting: string
  mood: string
  cameraDirective: CameraDirective | null
  narrativeQueue: NarrativeEvent[]
  revealedPOIs: string[]
  fogRevealed: boolean
}

interface SyncState {
  gameState: GameState
  connected: boolean
  error: string | null
}

const INITIAL_STATE: GameState = {
  entities: {},
  lighting: "daylight",
  mood: "calm",
  cameraDirective: null,
  narrativeQueue: [],
  revealedPOIs: [],
  fogRevealed: false,
}

export function useSyncServer(url = "ws://localhost:3002") {
  const [state, setState] = useState<SyncState>({
    gameState: INITIAL_STATE,
    connected: false,
    error: null,
  })
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[sync] Connected to sync server")
        setState(prev => ({ ...prev, connected: true, error: null }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === "full_state") {
            setState(prev => ({ ...prev, gameState: msg.state }))
          } else if (msg.type === "mutation") {
            setState(prev => {
              const gs = { ...prev.gameState }
              const m = msg.mutation

              switch (m.action) {
                case "spawn_entity":
                  gs.entities = { ...gs.entities, [m.entity.id]: m.entity }
                  break
                case "move_entity":
                  if (gs.entities[m.entityId]) {
                    gs.entities = {
                      ...gs.entities,
                      [m.entityId]: { ...gs.entities[m.entityId], position: m.position },
                    }
                  }
                  break
                case "remove_entity":
                  gs.entities = { ...gs.entities }
                  delete gs.entities[m.entityId]
                  break
                case "set_lighting":
                  gs.lighting = m.preset
                  break
                case "set_mood":
                  gs.mood = m.mood
                  break
                case "focus_camera":
                  gs.cameraDirective = m.directive
                  break
                case "reveal_poi":
                  gs.revealedPOIs = [...gs.revealedPOIs, m.poiId]
                  break
                case "narrate":
                  gs.narrativeQueue = [...gs.narrativeQueue, m.event].slice(-20)
                  if (!gs.fogRevealed) gs.fogRevealed = true
                  break
                case "update_entity_status":
                  if (gs.entities[m.entityId]) {
                    gs.entities = {
                      ...gs.entities,
                      [m.entityId]: { ...gs.entities[m.entityId], status: m.status },
                    }
                  }
                  break
                case "fog_reveal":
                  gs.fogRevealed = true
                  break
              }

              return { ...prev, gameState: gs }
            })
          }
        } catch (err) {
          console.error("[sync] Failed to parse message:", err)
        }
      }

      ws.onclose = () => {
        console.log("[sync] Disconnected. Reconnecting in 2s...")
        setState(prev => ({ ...prev, connected: false }))
        wsRef.current = null
        // Auto-reconnect
        reconnectTimerRef.current = setTimeout(connect, 2000)
      }

      ws.onerror = (err) => {
        console.error("[sync] WebSocket error:", err)
        setState(prev => ({ ...prev, error: "Connection error" }))
      }
    } catch (err) {
      console.error("[sync] Failed to connect:", err)
      setState(prev => ({ ...prev, error: "Failed to connect" }))
      reconnectTimerRef.current = setTimeout(connect, 2000)
    }
  }, [url])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [connect])

  // Send a chat message through the sync server
  const sendMessage = useCallback(async (message: string, sender: "dm" | "player" = "player") => {
    try {
      const response = await fetch("http://localhost:3002/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sender }),
      })

      // Read SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          // Parse SSE events
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.text) fullText += data.text
              } catch {
                // ignore parse errors for partial SSE
              }
            }
          }
        }
      }

      return fullText
    } catch (err) {
      console.error("[sync] Failed to send message:", err)
      return null
    }
  }, [])

  return {
    ...state.gameState,
    connected: state.connected,
    error: state.error,
    sendMessage,
  }
}
