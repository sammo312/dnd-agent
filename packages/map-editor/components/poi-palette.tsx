"use client"

import React from "react"

import { poiCategories, type POICategory, type POIItem } from "../lib/terrain-types"
import { cn } from "@dnd-agent/ui/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@dnd-agent/ui/components/accordion"
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area"

interface POIPaletteProps {
  selectedPOI: string | null
  onSelectPOI: (poi: POIItem | null) => void
}

function POIButton({
  poi,
  isSelected,
  onDragStart,
  onClick,
}: {
  poi: POIItem
  isSelected: boolean
  onDragStart: (e: React.DragEvent) => void
  onClick: () => void
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing hover:scale-105",
        isSelected
          ? "border-foreground bg-muted shadow-md"
          : "border-transparent hover:border-muted-foreground/30 hover:bg-muted/50"
      )}
    >
      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-2xl">
        {poi.icon}
      </div>
      <span className="text-xs text-muted-foreground truncate max-w-[60px]">
        {poi.name}
      </span>
      <span className="text-[10px] text-muted-foreground/60">
        {poi.size.w}x{poi.size.h}
      </span>
    </button>
  )
}

export function POIPalette({ selectedPOI, onSelectPOI }: POIPaletteProps) {
  const handleDragStart = (e: React.DragEvent, poi: POIItem) => {
    e.dataTransfer.setData("application/json", JSON.stringify(poi))
    e.dataTransfer.effectAllowed = "copy"
  }

  const categories = Object.entries(poiCategories) as [POICategory, (typeof poiCategories)[POICategory]][]

  return (
    <div className="bg-card border rounded-lg p-3">
      <h3 className="font-semibold text-sm mb-2">Points of Interest</h3>
      <p className="text-xs text-muted-foreground mb-2">
        Drag and drop onto the map
      </p>
      <ScrollArea className="h-[400px]">
        <Accordion type="multiple" defaultValue={["settlements", "buildings"]} className="w-full">
          {categories.map(([key, category]) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-sm py-2">
                {category.name}
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-1 pt-1">
                  {category.items.map((poi) => (
                    <POIButton
                      key={poi.id}
                      poi={poi}
                      isSelected={selectedPOI === poi.id}
                      onDragStart={(e) => handleDragStart(e, poi)}
                      onClick={() => onSelectPOI(selectedPOI === poi.id ? null : poi)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  )
}
