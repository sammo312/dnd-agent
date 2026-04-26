"use client";

import React from "react";

import { useRef, useState, useCallback, useEffect } from "react";
import { useStoryStore } from "../../lib/story-store";
import { StoryNode } from "./story-node";
import type { Connection, Section, DialogueNode } from "../../lib/story-types";

interface PendingConnection {
  fromId: string;
  label?: string;
}

export function StoryCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { nodes, canvasOffset, zoom, setCanvasOffset, setZoom, addConnection, selectNode, connections } = useStoryStore();

  // Derive connections from node data (sections' start_id and choices' id)
  const derivedConnections: Connection[] = React.useMemo(() => {
    const conns: Connection[] = [];
    const dialogueNodeIds = new Set(
      nodes.filter(n => n.type === 'dialogue').map(n => (n.data as DialogueNode).id)
    );

    nodes.forEach((node) => {
      if (node.type === 'section') {
        const section = node.data as Section;
        // Find dialogue node by data.id matching start_id
        const targetNode = nodes.find(
          n => n.type === 'dialogue' && (n.data as DialogueNode).id === section.start_id
        );
        if (section.start_id && targetNode) {
          conns.push({
            id: `derived_${node.id}_${targetNode.id}`,
            from: node.id,
            to: targetNode.id,
            label: 'starts',
          });
        }
      } else if (node.type === 'dialogue') {
        const dialogue = node.data as DialogueNode;
        dialogue.choices?.forEach((choice) => {
          // Find target dialogue node by data.id
          const targetNode = nodes.find(
            n => n.type === 'dialogue' && (n.data as DialogueNode).id === choice.id
          );
          if (choice.id && targetNode && targetNode.id !== node.id) {
            conns.push({
              id: `derived_${node.id}_${choice.id}_${choice.label}`,
              from: node.id,
              to: targetNode.id,
              label: choice.label,
            });
          }
        });
      }
    });

    return conns;
  }, [nodes]);
  const [isPanning, setIsPanning] = useState(false);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(zoom + delta);
      } else {
        setCanvasOffset({
          x: canvasOffset.x - e.deltaX,
          y: canvasOffset.y - e.deltaY,
        });
      }
    },
    [zoom, canvasOffset, setZoom, setCanvasOffset]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY };
        offsetStart.current = { ...canvasOffset };
      } else if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains("canvas-bg")) {
        selectNode(null);
      }
    },
    [canvasOffset, selectNode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setCanvasOffset({
          x: offsetStart.current.x + dx,
          y: offsetStart.current.y + dy,
        });
      }
      if (pendingConnection) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setMousePos({
            x: (e.clientX - rect.left - canvasOffset.x) / zoom,
            y: (e.clientY - rect.top - canvasOffset.y) / zoom,
          });
        }
      }
    },
    [isPanning, pendingConnection, canvasOffset, zoom, setCanvasOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (pendingConnection) {
      setPendingConnection(null);
    }
  }, [pendingConnection]);

  const handleStartConnection = useCallback((nodeId: string, _portType: "out", choiceLabel?: string) => {
    setPendingConnection({ fromId: nodeId, label: choiceLabel });
  }, []);

  const handleEndConnection = useCallback(
    (toNodeId: string) => {
      if (pendingConnection && pendingConnection.fromId !== toNodeId) {
        const newConnection: Connection = {
          id: `conn_${Date.now()}`,
          from: pendingConnection.fromId,
          to: toNodeId,
          label: pendingConnection.label,
        };
        addConnection(newConnection);
      }
      setPendingConnection(null);
    },
    [pendingConnection, addConnection]
  );

  // Get node center position for connection rendering
  const getNodeCenter = useCallback(
    (nodeId: string, isOutput: boolean, choiceIndex?: number) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };

      const nodeWidth = 220;
      const headerHeight = 40;

      if (isOutput) {
        if (node.type === "section") {
          return {
            x: node.position.x + nodeWidth + 12,
            y: node.position.y + 60,
          };
        }
        // Dialogue nodes with choices
        const choiceOffset = choiceIndex !== undefined ? choiceIndex * 28 : 0;
        return {
          x: node.position.x + nodeWidth + 12,
          y: node.position.y + 60 + choiceOffset,
        };
      }

      return {
        x: node.position.x - 12,
        y: node.position.y + headerHeight + 20,
      };
    },
    [nodes]
  );

  // Render connection path
  const renderConnection = useCallback(
    (conn: Connection) => {
      const fromNode = nodes.find((n) => n.id === conn.from);
      if (!fromNode) return null;

      let choiceIndex: number | undefined;
      if (fromNode.type === "dialogue" && conn.label) {
        const dialogueData = fromNode.data as { choices: { label: string }[] };
        choiceIndex = dialogueData.choices.findIndex((c) => c.label === conn.label);
      }

      const start = getNodeCenter(conn.from, true, choiceIndex !== -1 ? choiceIndex : undefined);
      const end = getNodeCenter(conn.to, false);

      const controlOffset = Math.min(100, Math.abs(end.x - start.x) / 2);
      const path = `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;

      return (
        <g key={conn.id}>
          <path
            d={path}
            fill="none"
            stroke="var(--connection)"
            strokeWidth={2}
            className="transition-all"
          />
          {conn.label && (
            <text
              x={(start.x + end.x) / 2}
              y={(start.y + end.y) / 2 - 8}
              fill="var(--muted-foreground)"
              fontSize={10}
              textAnchor="middle"
              className="pointer-events-none select-none"
            >
              {conn.label}
            </text>
          )}
        </g>
      );
    },
    [nodes, getNodeCenter]
  );

  // Render pending connection
  const renderPendingConnection = useCallback(() => {
    if (!pendingConnection) return null;

    const fromNode = nodes.find((n) => n.id === pendingConnection.fromId);
    if (!fromNode) return null;

    let choiceIndex: number | undefined;
    if (fromNode.type === "dialogue" && pendingConnection.label) {
      const dialogueData = fromNode.data as { choices: { label: string }[] };
      choiceIndex = dialogueData.choices.findIndex((c) => c.label === pendingConnection.label);
    }

    const start = getNodeCenter(pendingConnection.fromId, true, choiceIndex !== -1 ? choiceIndex : undefined);
    const end = mousePos;

    const controlOffset = Math.min(100, Math.abs(end.x - start.x) / 2);
    const path = `M ${start.x} ${start.y} C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;

    return (
      <path
        d={path}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={2}
        strokeDasharray="5,5"
        className="animate-pulse"
      />
    );
  }, [pendingConnection, mousePos, nodes, getNodeCenter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && pendingConnection) {
        setPendingConnection(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingConnection]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-background cursor-default select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isPanning ? "grabbing" : pendingConnection ? "crosshair" : "default" }}
    >
      {/* Grid Background */}
      <div
        className="canvas-bg absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, var(--border) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`,
        }}
      />

      {/* Canvas Content */}
      <div
        className="absolute"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Connections SVG */}
        <svg
          className="absolute top-0 left-0 pointer-events-none overflow-visible"
          style={{ width: "1px", height: "1px" }}
        >
          {derivedConnections.map(renderConnection)}
          {renderPendingConnection()}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <StoryNode
            key={node.id}
            node={node}
            isSelected={useStoryStore.getState().selectedNodeId === node.id}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            zoom={zoom}
          />
        ))}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-muted-foreground border border-border">
        {Math.round(zoom * 100)}%
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs text-muted-foreground border border-border">
        <span className="text-foreground">Shift+Drag</span> to pan • <span className="text-foreground">Scroll</span> to pan • <span className="text-foreground">Ctrl+Scroll</span> to zoom
      </div>
    </div>
  );
}
