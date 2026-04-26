"use client"

import { useEffect, useCallback } from "react"

export interface HotkeyConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  action: () => void
  description?: string
  preventDefault?: boolean
}

export function useHotkeys(hotkeys: HotkeyConfig[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Ignore if user is typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      for (const hotkey of hotkeys) {
        const ctrlMatch = hotkey.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)
        const shiftMatch = hotkey.shift ? event.shiftKey : !event.shiftKey
        const altMatch = hotkey.alt ? event.altKey : !event.altKey
        const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase()

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (hotkey.preventDefault !== false) {
            event.preventDefault()
          }
          hotkey.action()
          return
        }
      }
    },
    [hotkeys, enabled]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}

export function formatHotkey(config: HotkeyConfig): string {
  const parts: string[] = []
  if (config.ctrl) parts.push("Ctrl")
  if (config.shift) parts.push("Shift")
  if (config.alt) parts.push("Alt")
  parts.push(config.key.toUpperCase())
  return parts.join("+")
}
