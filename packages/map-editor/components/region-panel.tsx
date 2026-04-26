"use client"

import { useState } from "react"
import type { NamedRegion } from "../lib/terrain-types"
import { Button } from "@dnd-agent/ui/components/button"
import { Input } from "@dnd-agent/ui/components/input"
import { Card, CardContent, CardHeader, CardTitle } from "@dnd-agent/ui/components/card"
import { ScrollArea } from "@dnd-agent/ui/components/scroll-area"
import { Pencil, Trash2, Check, X, MapPin } from "lucide-react"

interface RegionPanelProps {
  regions: NamedRegion[]
  selectedRegion: string | null
  onSelectRegion: (regionId: string | null) => void
  onRenameRegion: (regionId: string, newName: string) => void
  onDeleteRegion: (regionId: string) => void
}

export function RegionPanel({
  regions,
  selectedRegion,
  onSelectRegion,
  onRenameRegion,
  onDeleteRegion,
}: RegionPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const startEditing = (region: NamedRegion) => {
    setEditingId(region.id)
    setEditName(region.name)
  }

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      onRenameRegion(editingId, editName.trim())
    }
    setEditingId(null)
    setEditName("")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  if (regions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Named Regions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Use the Lasso tool to select terrain areas and create named regions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Named Regions ({regions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-48">
          <div className="p-3 space-y-2">
            {regions.map((region) => (
              <div
                key={region.id}
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                  selectedRegion === region.id
                    ? "bg-primary/10 ring-1 ring-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectRegion(selectedRegion === region.id ? null : region.id)}
              >
                <div
                  className="w-4 h-4 rounded-sm border flex-shrink-0"
                  style={{ backgroundColor: region.color }}
                />

                {editingId === region.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit()
                        if (e.key === "Escape") cancelEdit()
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        saveEdit()
                      }}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation()
                        cancelEdit()
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{region.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {region.pixels.length} cells
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(region)
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteRegion(region.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
