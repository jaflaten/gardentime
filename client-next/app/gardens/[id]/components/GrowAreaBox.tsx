'use client';

import React, { useState } from 'react';
import { Group, Rect, Text, Circle, Transformer } from 'react-konva';
import { GrowArea } from '@/lib/api';
import Konva from 'konva';

interface GrowAreaBoxProps {
  growArea: GrowArea;
  isSelected: boolean;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  onSelect: () => void;
  onDoubleClick: () => void;
}

// Color mapping based on zone type (Step 19.2)
const ZONE_TYPE_COLORS = {
  BOX: '#3b82f6',      // blue
  FIELD: '#22c55e',    // green
  BED: '#92400e',      // brown
  BUCKET: '#6b7280',   // gray
} as const;

export default function GrowAreaBox({
  growArea,
  isSelected,
  onDragStart,
  onDragEnd,
  onResize,
  onSelect,
  onDoubleClick,
}: GrowAreaBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const shapeRef = React.useRef<Konva.Shape>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);

  // Position and dimensions
  const x = growArea.positionX ?? 0;
  const y = growArea.positionY ?? 0;

  // Ensure minimum touch-friendly size (Step 19.6)
  // Convert cm to pixels (1cm = 1px at 100% zoom) with minimum 44px
  const width = Math.max(growArea.width || 100, 44);
  const height = Math.max(growArea.length || 100, 44);

  // Color based on zone type (Step 19.2)
  const color = growArea.zoneType
    ? ZONE_TYPE_COLORS[growArea.zoneType as keyof typeof ZONE_TYPE_COLORS] || ZONE_TYPE_COLORS.BOX
    : ZONE_TYPE_COLORS.BOX;

  // Hover effect colors (Step 19.5)
  const strokeColor = isSelected ? '#10b981' : isHovered ? '#1f2937' : '#374151';
  const strokeWidth = isSelected ? 4 : isHovered ? 3 : 2;
  const shadowBlur = isSelected ? 15 : isHovered ? 10 : 5;

  // Check if this is a bucket (should be circular)
  const isBucket = growArea.zoneType === 'BUCKET';

  // For buckets, calculate radius (use average of width/height, or just width if square)
  const radius = isBucket ? Math.max(width, height) / 2 : 0;

  // Attach transformer when selected
  React.useEffect(() => {
    if (isSelected && shapeRef.current && transformerRef.current) {
      // Attach transformer to the shape
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    if (!shapeRef.current || !onResize) return;

    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Calculate new dimensions
    let newWidth: number;
    let newHeight: number;

    if (isBucket) {
      // For circles, use the scale to calculate new radius
      const newRadius = radius * Math.max(scaleX, scaleY);
      newWidth = newRadius * 2;
      newHeight = newRadius * 2;
    } else {
      // For rectangles, apply scale to dimensions
      newWidth = Math.max(width * scaleX, 44);
      newHeight = Math.max(height * scaleY, 44);
    }

    // Reset scale to 1 (we've applied it to width/height)
    node.scaleX(1);
    node.scaleY(1);

    setIsTransforming(false);

    // Call the resize callback with new dimensions
    onResize(Math.round(newWidth), Math.round(newHeight));
  };

  return (
    <Group
      x={x}
      y={y}
      draggable
      onDragStart={(e) => {
        e.cancelBubble = true;
        const stage = e.target.getStage();
        if (stage) {
          stage.draggable(false);
        }
        onDragStart();
      }}
      onDragEnd={(e) => {
        const node = e.target;
        const newX = node.x();
        const newY = node.y();
        onDragEnd(newX, newY);

        const stage = e.target.getStage();
        if (stage) {
          stage.draggable(true);
        }
      }}
      onMouseDown={(e) => {
        e.cancelBubble = true;
      }}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDblClick={(e) => {
        e.cancelBubble = true;
        onDoubleClick();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDblTap={(e) => {
        e.cancelBubble = true;
        onDoubleClick();
      }}
      // Hover effects (Step 19.5)
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Shape - Circle for buckets, Rectangle for others */}
      {isBucket ? (
        <Circle
          ref={shapeRef as any}
          x={radius}
          y={radius}
          radius={radius}
          fill={color}
          opacity={isHovered ? 0.8 : 0.7}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          shadowColor="black"
          shadowBlur={shadowBlur}
          shadowOpacity={0.3}
          shadowOffset={{ x: 2, y: 2 }}
          onTransformEnd={handleTransformEnd}
        />
      ) : (
        <Rect
          ref={shapeRef as any}
          x={0}
          y={0}
          width={width}
          height={height}
          fill={color}
          opacity={isHovered ? 0.8 : 0.7}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          cornerRadius={6}
          shadowColor="black"
          shadowBlur={shadowBlur}
          shadowOpacity={0.3}
          shadowOffset={{ x: 2, y: 2 }}
          hitStrokeWidth={0}
          onTransformEnd={handleTransformEnd}
        />
      )}

      {/* Transformer for resizing (only when selected) */}
      {isSelected && (
        <Transformer
          ref={transformerRef}
          borderStroke="#10b981"
          borderStrokeWidth={2}
          anchorFill="#10b981"
          anchorStroke="#059669"
          anchorStrokeWidth={1}
          anchorSize={12}
          anchorCornerRadius={2}
          rotateEnabled={false}
          enabledAnchors={
            isBucket
              ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] // Corners only for circles
              : ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center'] // All anchors for rectangles
          }
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 44 || newBox.height < 44) {
              return oldBox;
            }
            return newBox;
          }}
          onTransformStart={() => setIsTransforming(true)}
        />
      )}

      {/* Zone Type Badge (centered at top for both rectangles and circles) */}
      {/* Show badge when not selected OR not currently transforming */}
      {growArea.zoneType && !isSelected && !isTransforming && (
        <Group>
          <Rect
            x={isBucket ? radius - 25 : (width / 2) - 25}
            y={8}
            width={50}
            height={20}
            fill="rgba(0, 0, 0, 0.5)"
            cornerRadius={4}
            listening={false}
          />
          <Text
            x={isBucket ? radius - 25 : (width / 2) - 25}
            y={11}
            width={50}
            text={growArea.zoneType}
            fontSize={10}
            fontStyle="bold"
            fill="white"
            align="center"
            listening={false}
          />
        </Group>
      )}

      {/* Grow Area Name (Step 19.3) */}
      {!isSelected && !isTransforming && (
        <Text
          x={isBucket ? 0 : 8}
          y={isBucket ? radius - 10 : height / 2 - 20}
          width={isBucket ? radius * 2 : width - 16}
          text={growArea.name}
          fontSize={16}
          fontStyle="bold"
          fill="white"
          align="center"
          listening={false}
          wrap="none"
          ellipsis={true}
        />
      )}

      {/* Dimensions Text (Step 19.4) */}
      {growArea.width && growArea.length && !isSelected && !isTransforming && (
        <Text
          x={isBucket ? 0 : 8}
          y={isBucket ? radius + 10 : height / 2 + 5}
          width={isBucket ? radius * 2 : width - 16}
          text={isBucket ? `Ø ${Math.round(radius * 2)} cm` : `${growArea.width} × ${growArea.length} cm`}
          fontSize={13}
          fill="white"
          align="center"
          listening={false}
          opacity={0.9}
        />
      )}

      {/* Zone Size (if provided as string and no dimensions) */}
      {growArea.zoneSize && !growArea.width && !growArea.length && !isSelected && !isTransforming && (
        <Text
          x={isBucket ? 0 : 8}
          y={isBucket ? radius + 10 : height / 2 + 5}
          width={isBucket ? radius * 2 : width - 16}
          text={growArea.zoneSize}
          fontSize={12}
          fill="white"
          align="center"
          listening={false}
          opacity={0.8}
        />
      )}

      {/* Number of Rows indicator (bottom-right corner) - Not shown for buckets or when selected */}
      {growArea.nrOfRows && !isBucket && !isSelected && !isTransforming && (
        <Group>
          <Rect
            x={width - 58}
            y={height - 28}
            width={50}
            height={20}
            fill="rgba(0, 0, 0, 0.5)"
            cornerRadius={4}
            listening={false}
          />
          <Text
            x={width - 58}
            y={height - 25}
            width={50}
            text={`${growArea.nrOfRows} rows`}
            fontSize={10}
            fill="white"
            align="center"
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
}
