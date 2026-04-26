"use client"

import { useState, useEffect } from "react"
import type { PlacedPOI } from "../lib/terrain-types"
import { Button } from "@dnd-agent/ui/components/button"
import { Input } from "@dnd-agent/ui/components/input"
import { Label } from "@dnd-agent/ui/components/label"
import { Card, CardContent, CardHeader, CardTitle } from "@dnd-agent/ui/components/card"
import { Pencil, Check, X, Trash2, RefreshCw } from "lucide-react"
import { generatePOIName } from "../lib/name-generator"

interface POIDetailPanelProps {
  poi: PlacedPOI | null
  onRename: (poiId: string, newName: string) => void
  onDelete: (poiId: string) => void
}

export function POIDetailPanel({ poi, onRename, onDelete }: POIDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState("")

  useEffect(() => {
    if (poi) {
      setEditName(poi.name)
    }
    setIsEditing(false)
  }, [poi])

  if (!poi) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">POI Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Select a POI on the map to view and edit its details.
          </p>
        </CardContent>
      </Card>
    )
  }

  const handleSave = () => {
    if (editName.trim()) {
      onRename(poi.id, editName.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditName(poi.name)
    setIsEditing(false)
  }

  const handleRandomize = () => {
    const newName = generatePOIName(poi.type)
    setEditName(newName)
    if (!isEditing) {
      onRename(poi.id, newName)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-lg">{poi.icon}</span>
          POI Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Name</Label>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave()
                  if (e.key === "Escape") handleCancel()
                }}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave}>
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium flex-1">{poi.name}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
                title="Edit name"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRandomize}
                title="Generate random name"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">Type:</span>
            <p className="font-medium capitalize">{poi.type.replace(/-/g, " ")}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Position:</span>
            <p className="font-medium">({poi.x}, {poi.y})</p>
          </div>
          <div>
            <span className="text-muted-foreground">Size:</span>
            <p className="font-medium">{poi.size.w}x{poi.size.h}</p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => onDelete(poi.id)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete POI
        </Button>
      </CardContent>
    </Card>
  )
}
