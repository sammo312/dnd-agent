"use client"

import { useState, useEffect, useRef, type RefObject } from "react"

interface ContainerSize {
  width: number
  height: number
}

/**
 * Hook that tracks the size of a container element using ResizeObserver.
 * Uses requestAnimationFrame to batch updates during rapid resizing (e.g. dockview panel dragging).
 */
export function useContainerSize(ref: RefObject<HTMLElement | null>): ContainerSize {
  const [size, setSize] = useState<ContainerSize>({ width: 0, height: 0 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      // Cancel any pending animation frame to avoid stale updates
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        const { width, height } = entry.contentRect
        setSize((prev) => {
          // Only update if values actually changed (avoids unnecessary re-renders)
          if (prev.width === Math.round(width) && prev.height === Math.round(height)) {
            return prev
          }
          return { width: Math.round(width), height: Math.round(height) }
        })
        rafRef.current = null
      })
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [ref])

  return size
}
