'use client';

import React, { useState } from 'react';
import { Group, Rect, Text, Circle, Transformer } from 'react-konva';
import { GrowArea } from '@/lib/api';
import Konva from 'konva';

interface GrowAreaBoxProps {
  growArea: GrowArea;
  isSelected: boolean;
  isMultiSelected?: boolean; // New prop for multi-select visual feedback
  isDraggingEnabled: boolean;
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  onRotate?: (rotation: number) => void;
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
  isMultiSelected = false,
  isDraggingEnabled,
  onDragStart,
  onDragEnd,
  onResize,
  onRotate,
  onSelect,
  onDoubleClick,
}: GrowAreaBoxProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const groupRef = React.useRef<Konva.Group>(null);
  const shapeRef = React.useRef<Konva.Shape>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);

  // Debug logging for props received
  React.useEffect(() => {
    console.log(`📊 GrowAreaBox "${growArea.name}" (${growArea.id}) render:`, {
      isSelected,
      isMultiSelected,
      isDraggingEnabled,
    });
  }, [isSelected, isMultiSelected, isDraggingEnabled, growArea.name, growArea.id]);

  // Debug logging for multi-select visual feedback
  React.useEffect(() => {
    if (isMultiSelected) {
      console.log(`GrowArea ${growArea.name} is multi-selected:`, { isMultiSelected, isSelected });
    }
  }, [isMultiSelected, isSelected, growArea.name]);

  // Position and dimensions
  const x = growArea.positionX ?? 0;
  const y = growArea.positionY ?? 0;

  // Ensure minimum touch-friendly size (Step 19.6)
  // Convert cm to pixels (1cm = 1px at 100% zoom) with minimum 44px
  const width = Math.max(growArea.width || 100, 44);
  const height = Math.max(growArea.length || 100, 44);

  // Color based on zone type (Step 19.2) or custom color (Step 27.9)
  const color = (growArea as any).customColor || (growArea.zoneType
    ? ZONE_TYPE_COLORS[growArea.zoneType as keyof typeof ZONE_TYPE_COLORS] || ZONE_TYPE_COLORS.BOX
    : ZONE_TYPE_COLORS.BOX);

  // Hover effect colors (Step 19.5)
  const strokeColor = isSelected ? '#10b981' : isMultiSelected ? '#3b82f6' : isHovered ? '#1f2937' : '#374151';
  const strokeWidth = isSelected ? 4 : isMultiSelected ? 3 : isHovered ? 3 : 2;
  const shadowBlur = isSelected ? 15 : isMultiSelected ? 12 : isHovered ? 10 : 5;

  // Check if this is a bucket (should be circular)
  const isBucket = growArea.zoneType === 'BUCKET';

  // For buckets, calculate radius (use average of width/height, or just width if square)
  const radius = isBucket ? Math.max(width, height) / 2 : 0;

  // Attach transformer when selected - attach to group for rotation
  React.useEffect(() => {
    if (isSelected && groupRef.current && transformerRef.current) {
      // Attach transformer to the group (for rotation support)
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleTransformEnd = () => {
    if (!groupRef.current) return;

    const node = groupRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newRotation = node.rotation();

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
    if (onResize && (scaleX !== 1 || scaleY !== 1)) {
      onResize(Math.round(newWidth), Math.round(newHeight));
    }

    // Call the rotation callback if rotation changed
    const currentRotation = growArea.rotation ?? 0;
    // Normalize both values for comparison
    const normalizedNew = ((newRotation % 360) + 360) % 360;
    const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
    
    if (onRotate && Math.abs(normalizedNew - normalizedCurrent) > 0.1) {
      onRotate(normalizedNew);
    }
  };

  // Rotation angle from props
  const rotation = growArea.rotation ?? 0;

  // Calculate offset for rotation around center
  const offsetX = isBucket ? radius : width / 2;
  const offsetY = isBucket ? radius : height / 2;

  return (
    <>
      <Group
        ref={groupRef}
        x={x + offsetX}
        y={y + offsetY}
        rotation={rotation}
        offsetX={offsetX}
        offsetY={offsetY}
        draggable={isDraggingEnabled}
        onTransformEnd={handleTransformEnd}
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
        // Adjust back from offset
        const newX = node.x() - offsetX;
        const newY = node.y() - offsetY;
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
        />
      )}

      {/* Transformer moved outside Group - must be sibling to work */}

      {/* Multi-select visual feedback - MOVED HERE to render on top */}
      {isMultiSelected && (
        <>
          {isBucket ? (
            <Circle
              x={radius}
              y={radius}
              radius={radius + 4}
              stroke="#3b82f6"
              strokeWidth={6}
              dash={[8, 4]}
              fill="transparent"
              listening={false}
              shadowColor="#3b82f6"
              shadowBlur={12}
              shadowOpacity={0.6}
              shadowEnabled={true}
            />
          ) : (
            <Rect
              x={-3}
              y={-3}
              width={width + 6}
              height={height + 6}
              stroke="#3b82f6"
              strokeWidth={6}
              dash={[8, 4]}
              fill="transparent"
              cornerRadius={8}
              listening={false}
              shadowColor="#3b82f6"
              shadowBlur={12}
              shadowOpacity={0.6}
              shadowEnabled={true}
            />
          )}
        </>
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

      {/* Current Crops Display (Step 27.8) */}
      {growArea.currentCrops && growArea.currentCrops.length > 0 && !isSelected && !isTransforming && (
        <Group>
          {/* Crop info background */}
          <Rect
            x={isBucket ? radius - 50 : (width / 2) - 50}
            y={isBucket ? radius + 25 : height / 2 + 25}
            width={100}
            height={Math.min(growArea.currentCrops.length * 18 + 8, 80)}
            fill="rgba(16, 185, 129, 0.9)"
            cornerRadius={6}
            listening={false}
            shadowColor="black"
            shadowBlur={4}
            shadowOpacity={0.3}
            shadowOffset={{ x: 1, y: 1 }}
          />
          
          {/* Crop list - show up to 3 crops */}
          {growArea.currentCrops.slice(0, 3).map((crop, index) => {
            // Status color coding
            const statusColor = crop.status === 'HARVESTED' ? '#fbbf24' : 
                              crop.status === 'DISEASED' || crop.status === 'FAILED' ? '#ef4444' :
                              '#ffffff';
            
            return (
              <Text
                key={crop.id}
                x={isBucket ? radius - 46 : (width / 2) - 46}
                y={isBucket ? radius + 30 + (index * 18) : height / 2 + 30 + (index * 18)}
                width={92}
                text={`🌱 ${crop.plantName || 'Unknown'}`}
                fontSize={11}
                fontStyle="600"
                fill={statusColor}
                align="center"
                listening={false}
                wrap="none"
                ellipsis={true}
              />
            );
          })}
          
          {/* "+" indicator if more than 3 crops */}
          {growArea.currentCrops.length > 3 && (
            <Text
              x={isBucket ? radius - 46 : (width / 2) - 46}
              y={isBucket ? radius + 84 : height / 2 + 84}
              width={92}
              text={`+${growArea.currentCrops.length - 3} more`}
              fontSize={10}
              fill="white"
              align="center"
              listening={false}
              opacity={0.8}
            />
          )}
        </Group>
      )}

      {/* Dimensions Text (Step 19.4) - Adjusted position when crops are shown */}
      {growArea.width && growArea.length && !isSelected && !isTransforming && !(growArea.currentCrops && growArea.currentCrops.length > 0) && (
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

    {/* Transformer for resizing and rotating (only when selected) - must be sibling of Group */}
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
        rotateEnabled={true}
        rotationSnaps={[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5]}
        rotationSnapTolerance={5}
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
  </>
  );
}
