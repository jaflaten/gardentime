'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text, Line, Group } from 'react-konva';
import { GrowArea } from '@/lib/api';
import Konva from 'konva';

interface GardenBoardViewProps {
  growAreas: GrowArea[];
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onSelectGrowArea: (growArea: GrowArea) => void;
}

type ZoomLevel = 50 | 100 | 200;

export default function GardenBoardView({
  growAreas,
  onUpdatePosition,
  onSelectGrowArea,
}: GardenBoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const draggingIdRef = useRef<string | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(100);
  const [showGrid, setShowGrid] = useState(true);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  // Update canvas dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = Math.max(600, window.innerHeight - 300); // Min 600px, or viewport - header/toolbar
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle zoom changes
  const handleZoomChange = (level: ZoomLevel) => {
    setZoomLevel(level);
  };

  // Fit to view - centers and scales to show all grow areas
  const handleFitToView = () => {
    if (growAreas.length === 0) {
      setZoomLevel(100);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    // Find bounds of all grow areas
    const positions = growAreas
      .filter(area => area.positionX !== undefined && area.positionY !== undefined)
      .map(area => ({
        x: area.positionX!,
        y: area.positionY!,
        width: area.width || 100,
        height: area.length || 100,
      }));

    if (positions.length === 0) {
      setZoomLevel(100);
      setStagePosition({ x: 0, y: 0 });
      return;
    }

    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.width));
    const maxY = Math.max(...positions.map(p => p.y + p.height));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    // Calculate zoom to fit content with padding
    const scaleX = (dimensions.width * 0.8) / contentWidth;
    const scaleY = (dimensions.height * 0.8) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 2); // Max 200% zoom

    // Determine closest zoom level
    let newZoom: ZoomLevel = 100;
    if (scale <= 0.75) newZoom = 50;
    else if (scale >= 1.5) newZoom = 200;

    // Center the content
    const centerX = (dimensions.width - contentWidth * (newZoom / 100)) / 2 - minX * (newZoom / 100);
    const centerY = (dimensions.height - contentHeight * (newZoom / 100)) / 2 - minY * (newZoom / 100);

    setZoomLevel(newZoom);
    setStagePosition({ x: centerX, y: centerY });
  };

  // Generate grid lines
  const generateGridLines = () => {
    const lines = [];
    const gridSize = 50; // 50cm intervals at 100% zoom
    const scaledGridSize = gridSize * (zoomLevel / 100);

    // Calculate visible area accounting for stage position
    const startX = Math.floor(-stagePosition.x / scaledGridSize) * scaledGridSize;
    const startY = Math.floor(-stagePosition.y / scaledGridSize) * scaledGridSize;
    const endX = startX + dimensions.width / (zoomLevel / 100) + scaledGridSize;
    const endY = startY + dimensions.height / (zoomLevel / 100) + scaledGridSize;

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#e5e7eb"
          strokeWidth={1 / (zoomLevel / 100)}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#e5e7eb"
          strokeWidth={1 / (zoomLevel / 100)}
          listening={false}
        />
      );
    }

    return lines;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Zoom:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleZoomChange(50)}
              className={`px-3 py-1 text-sm rounded ${
                zoomLevel === 50
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              50%
            </button>
            <button
              onClick={() => handleZoomChange(100)}
              className={`px-3 py-1 text-sm rounded ${
                zoomLevel === 100
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => handleZoomChange(200)}
              className={`px-3 py-1 text-sm rounded ${
                zoomLevel === 200
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              200%
            </button>
            <button
              onClick={handleFitToView}
              className="px-3 py-1 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Fit to View
            </button>
          </div>
        </div>

        {/* View Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Show Grid</span>
          </label>
          <div className="text-sm text-gray-600">
            {growAreas.filter(a => a.positionX !== undefined).length} / {growAreas.length} areas placed
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 bg-gray-100 overflow-hidden relative">
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          draggable={true}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={zoomLevel / 100}
          scaleY={zoomLevel / 100}
          onDragEnd={(e) => {
            // Only update stage position if we actually dragged the stage (not a grow area)
            const target = e.target;
            if (target === stageRef.current) {
              setStagePosition({
                x: target.x(),
                y: target.y(),
              });
            }
          }}
          onClick={(e) => {
            // Deselect when clicking on stage background
            if (e.target === e.target.getStage()) {
              setSelectedId(null);
            }
          }}
        >
          <Layer>
            {/* Background rectangle for canvas area */}
            <Rect
              x={-10000}
              y={-10000}
              width={20000}
              height={20000}
              fill="#ffffff"
              listening={false}
            />

            {/* Grid */}
            {showGrid && generateGridLines()}

            {/* Grow Areas */}
            {growAreas.map((growArea) => {
              // Skip areas without positions - they'll appear in a sidebar later
              if (growArea.positionX === undefined || growArea.positionY === undefined) {
                return null;
              }

              const x = growArea.positionX;
              const y = growArea.positionY;
              const width = growArea.width || 100; // Default 100cm
              const height = growArea.length || 100; // Default 100cm
              const isSelected = selectedId === growArea.id;
              const isDragging = draggingIdRef.current === growArea.id;
              const color = (() => {
                switch (growArea.zoneType) {
                  case 'BOX': return '#3b82f6'; // blue
                  case 'FIELD': return '#22c55e'; // green
                  case 'BED': return '#a855f7'; // purple
                  case 'BUCKET': return '#64748b'; // gray
                  default: return '#6b7280'; // default gray
                }
              })();

              return (
                <Group
                  key={growArea.id}
                  x={x}
                  y={y}
                  draggable
                  onDragStart={(e) => {
                    // Mark this item as being dragged
                    draggingIdRef.current = growArea.id;

                    // CRITICAL: Stop the event from bubbling to the Stage
                    // This prevents the Stage from starting a drag when we drag a grow area
                    e.cancelBubble = true;
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.draggable(false);
                    }
                  }}
                  onDragEnd={(e) => {
                    // Get the final position
                    const node = e.target;
                    const newX = node.x();
                    const newY = node.y();

                    // Update the backend with the new position
                    onUpdatePosition(growArea.id, newX, newY);

                    draggingIdRef.current = null;

                    // Re-enable stage dragging
                    const stage = e.target.getStage();
                    if (stage) {
                      stage.draggable(true);
                    }
                  }}
                  onMouseDown={(e) => {
                    // Stop event from reaching the stage
                    e.cancelBubble = true;
                  }}
                  onClick={(e) => {
                    e.cancelBubble = true;
                    setSelectedId(growArea.id);
                  }}
                  onDblClick={(e) => {
                    e.cancelBubble = true;
                    onSelectGrowArea(growArea);
                  }}
                  onTap={(e) => {
                    e.cancelBubble = true;
                    setSelectedId(growArea.id);
                  }}
                  onDblTap={(e) => {
                    e.cancelBubble = true;
                    onSelectGrowArea(growArea);
                  }}
                >
                  {/* Rectangle */}
                  <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill={color}
                    opacity={0.7}
                    stroke={isSelected ? '#10b981' : '#1f2937'}
                    strokeWidth={isSelected ? 3 : 1}
                    cornerRadius={4}
                    shadowColor="black"
                    shadowBlur={isSelected ? 10 : 5}
                    shadowOpacity={0.3}
                    shadowOffset={{ x: 2, y: 2 }}
                  />

                  {/* Label */}
                  <Text
                    x={0}
                    y={height / 2 - 10}
                    width={width}
                    text={growArea.name}
                    fontSize={14}
                    fontStyle="bold"
                    fill="white"
                    align="center"
                    listening={false}
                  />

                  {/* Dimensions */}
                  {growArea.width && growArea.length && (
                    <Text
                      x={0}
                      y={height / 2 + 5}
                      width={width}
                      text={`${growArea.width} × ${growArea.length} cm`}
                      fontSize={11}
                      fill="white"
                      align="center"
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        </Stage>

        {/* Instructions overlay when empty */}
        {growAreas.filter(a => a.positionX !== undefined).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to Board View
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Create grow areas and they will appear here. You can drag them to arrange your garden layout.
              </p>
              <p className="text-gray-500 text-xs">
                💡 Tip: Grow areas need width and length values to appear on the board.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 text-xs text-gray-600">
        <div className="flex gap-4">
          <span>💡 Tip: Drag the canvas to pan, drag grow areas to reposition</span>
          <span>📏 Grid: 50cm intervals</span>
          <span>🖱️ Double-click a grow area to edit</span>
        </div>
      </div>
    </div>
  );
}
