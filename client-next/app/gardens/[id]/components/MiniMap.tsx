'use client';

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import { GrowArea, CanvasObject } from '@/lib/api';

interface MiniMapProps {
  growAreas: GrowArea[];
  canvasObjects: CanvasObject[];
  stagePosition: { x: number; y: number };
  scale: number;
  viewportWidth: number;
  viewportHeight: number;
  onViewportClick: (x: number, y: number) => void;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const MINIMAP_SCALE = 0.05; // Scale factor for minimap

export default function MiniMap({
  growAreas,
  canvasObjects,
  stagePosition,
  scale,
  viewportWidth,
  viewportHeight,
  onViewportClick,
}: MiniMapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);

  // Calculate bounds of all objects
  const calculateBounds = () => {
    let minX = 0, minY = 0, maxX = 1000, maxY = 1000;
    
    growAreas.forEach(ga => {
      if (ga.positionX !== undefined && ga.positionY !== undefined) {
        minX = Math.min(minX, ga.positionX);
        minY = Math.min(minY, ga.positionY);
        maxX = Math.max(maxX, ga.positionX + (ga.width || 100));
        maxY = Math.max(maxY, ga.positionY + (ga.length || 100));
      }
    });
    
    canvasObjects.forEach(obj => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + (obj.width || 50));
      maxY = Math.max(maxY, obj.y + (obj.height || 50));
    });
    
    return { minX, minY, maxX, maxY };
  };

  const bounds = calculateBounds();
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  
  // Calculate scale to fit content in minimap
  const scaleX = MINIMAP_WIDTH / Math.max(contentWidth, 1);
  const scaleY = MINIMAP_HEIGHT / Math.max(contentHeight, 1);
  const minimapScale = Math.min(scaleX, scaleY, MINIMAP_SCALE);
  
  // Calculate viewport rectangle position and size
  const viewportRect = {
    x: (-stagePosition.x / scale) * minimapScale,
    y: (-stagePosition.y / scale) * minimapScale,
    width: (viewportWidth / scale) * minimapScale,
    height: (viewportHeight / scale) * minimapScale,
  };

  const handleClick = (e: any) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    // Convert minimap click to canvas coordinates
    const canvasX = -(pos.x / minimapScale) * scale;
    const canvasY = -(pos.y / minimapScale) * scale;
    
    onViewportClick(canvasX, canvasY);
  };

  return (
    <div
      ref={minimapRef}
      className="absolute bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg overflow-hidden z-40"
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
    >
      <Stage
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        onClick={handleClick}
      >
        <Layer>
          {/* Background */}
          <Rect
            x={0}
            y={0}
            width={MINIMAP_WIDTH}
            height={MINIMAP_HEIGHT}
            fill="#f9fafb"
          />
          
          {/* Grow Areas */}
          {growAreas.map(ga => {
            if (ga.positionX === undefined || ga.positionY === undefined) return null;
            
            return (
              <Rect
                key={`minimap-ga-${ga.id}`}
                x={(ga.positionX - bounds.minX) * minimapScale}
                y={(ga.positionY - bounds.minY) * minimapScale}
                width={(ga.width || 100) * minimapScale}
                height={(ga.length || 100) * minimapScale}
                fill={ga.color || '#10b981'}
                opacity={0.6}
              />
            );
          })}
          
          {/* Canvas Objects */}
          {canvasObjects.map(obj => {
            const x = (obj.x - bounds.minX) * minimapScale;
            const y = (obj.y - bounds.minY) * minimapScale;
            
            if (obj.type === 'RECTANGLE' || obj.type === 'TEXT') {
              return (
                <Rect
                  key={`minimap-obj-${obj.id}`}
                  x={x}
                  y={y}
                  width={(obj.width || 50) * minimapScale}
                  height={(obj.height || 30) * minimapScale}
                  fill={obj.fillColor || '#3b82f6'}
                  opacity={0.5}
                />
              );
            } else if (obj.type === 'CIRCLE') {
              const radius = Math.min((obj.width || 50) * minimapScale, (obj.height || 50) * minimapScale) / 2;
              return (
                <Circle
                  key={`minimap-obj-${obj.id}`}
                  x={x + radius}
                  y={y + radius}
                  radius={radius}
                  fill={obj.fillColor || '#3b82f6'}
                  opacity={0.5}
                />
              );
            }
            return null;
          })}
          
          {/* Viewport indicator */}
          <Rect
            x={viewportRect.x}
            y={viewportRect.y}
            width={viewportRect.width}
            height={viewportRect.height}
            stroke="#ef4444"
            strokeWidth={2}
            dash={[5, 5]}
            listening={false}
          />
        </Layer>
      </Stage>
      
      {/* Label */}
      <div className="absolute top-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-0.5 rounded">
        Overview
      </div>
    </div>
  );
}
