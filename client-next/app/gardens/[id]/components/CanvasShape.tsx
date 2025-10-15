'use client';

import React, { useEffect, useRef } from 'react';
import { Rect, Circle, Line, Text, Arrow, Group, Transformer } from 'react-konva';
import { CanvasObject } from '@/lib/api';

interface CanvasShapeProps {
  canvasObject: CanvasObject;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
  onResize?: (x: number, y: number, width: number, height: number) => void; // new
}

export default function CanvasShape({ canvasObject: shape, isSelected, onSelect, onDragEnd, onResize }: CanvasShapeProps) {
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const baseDragHandler = (e: any) => {
    onDragEnd(e.target.x(), e.target.y());
  };

  const commonProps = {
    ref: shapeRef,
    draggable: !shape.locked,
    onClick: onSelect,
    onTap: onSelect,
    opacity: shape.opacity || 1,
    rotation: shape.rotation || 0,
    shadowColor: isSelected ? '#10b981' : undefined,
    shadowBlur: isSelected ? 10 : 0,
    shadowOpacity: isSelected ? 0.8 : 0,
  } as const;

  const maybeTransformer = isSelected && (shape.type === 'RECTANGLE' || shape.type === 'CIRCLE') ? (
    <Transformer
      ref={trRef}
      rotateEnabled={false}
      enabledAnchors={shape.type === 'RECTANGLE' ? undefined : ['top-left','top-right','bottom-left','bottom-right']}
      boundBoxFunc={(oldBox, newBox) => {
        // Enforce minimum size 20x20
        if (newBox.width < 20 || newBox.height < 20) {
            return oldBox;
        }
        return newBox;
      }}
    />
  ) : null;

  // RECTANGLE
  if (shape.type === 'RECTANGLE') {
    return (
      <>
        <Rect
          x={shape.x}
          y={shape.y}
          width={shape.width || 100}
          height={shape.height || 100}
          fill={shape.fillColor || 'transparent'}
          stroke={shape.strokeColor || '#000000'}
          strokeWidth={shape.strokeWidth || 2}
          onDragEnd={baseDragHandler}
          onTransformEnd={() => {
            if (!shapeRef.current || !onResize) return;
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            const newWidth = Math.max(20, (shape.width || 100) * scaleX);
            const newHeight = Math.max(20, (shape.height || 100) * scaleY);
            // Reset scale to 1 after extracting
            node.scaleX(1);
            node.scaleY(1);
            onResize(node.x(), node.y(), newWidth, newHeight);
          }}
          {...commonProps}
        />
        {maybeTransformer}
      </>
    );
  }

  // CIRCLE (stored as top-left x,y in backend but rendered via center on canvas)
  if (shape.type === 'CIRCLE') {
    const diameter = shape.width || shape.height || 100;
    const radius = diameter / 2;
    return (
      <>
        <Circle
          x={(shape.x ?? 0) + radius}
          y={(shape.y ?? 0) + radius}
          radius={radius}
          fill={shape.fillColor || 'transparent'}
          stroke={shape.strokeColor || '#000000'}
          strokeWidth={shape.strokeWidth || 2}
          onDragEnd={(e: any) => {
            const centerX = e.target.x();
            const centerY = e.target.y();
            const newX = centerX - radius;
            const newY = centerY - radius;
            onDragEnd(newX, newY);
          }}
          onTransformEnd={() => {
            if (!shapeRef.current || !onResize) return;
            const node = shapeRef.current;
            const scale = node.scaleX(); // assume uniform
            const newRadius = Math.max(10, radius * scale);
            node.scaleX(1);
            node.scaleY(1);
            const newDiameter = newRadius * 2;
            const centerX = node.x();
            const centerY = node.y();
            const newX = centerX - newRadius;
            const newY = centerY - newRadius;
            onResize(newX, newY, newDiameter, newDiameter);
          }}
          {...commonProps}
        />
        {maybeTransformer}
      </>
    );
  }

  // LINE
  if (shape.type === 'LINE') {
    const points = shape.points ? JSON.parse(shape.points) : [0, 0, 100, 100];
    return (
      <Line
        points={points}
        stroke={shape.strokeColor || '#000000'}
        strokeWidth={shape.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        {...commonProps}
        draggable={false}
      />
    );
  }

  // ARROW
  if (shape.type === 'ARROW') {
    const points = shape.points ? JSON.parse(shape.points) : [0, 0, 100, 100];
    return (
      <Arrow
        points={points}
        stroke={shape.strokeColor || '#000000'}
        fill={shape.strokeColor || '#000000'}
        strokeWidth={shape.strokeWidth || 2}
        pointerLength={10}
        pointerWidth={10}
        {...commonProps}
        draggable={false}
      />
    );
  }

  // TEXT
  if (shape.type === 'TEXT') {
    return (
      <Group {...commonProps} draggable={!shape.locked} onDragEnd={baseDragHandler}>
        {/* Optional background */}
        {shape.fillColor && (
          <Rect
            x={shape.x}
            y={shape.y}
            width={shape.width || 200}
            height={shape.height || 40}
            fill={shape.fillColor}
            opacity={0.8}
          />
        )}
        <Text
          x={shape.x}
          y={shape.y}
          width={shape.width || 200}
          height={shape.height || 40}
          text={shape.text || 'Text'}
          fontSize={shape.fontSize || 16}
          fontFamily={shape.fontFamily || 'Arial'}
          fill={shape.strokeColor || '#000000'}
          align="center"
          verticalAlign="middle"
          padding={5}
        />
      </Group>
    );
  }

  // FREEHAND
  if (shape.type === 'FREEHAND') {
    const points = shape.points ? JSON.parse(shape.points) : [];
    return (
      <Line
        points={points}
        stroke={shape.strokeColor || '#000000'}
        strokeWidth={shape.strokeWidth || 2}
        lineCap="round"
        lineJoin="round"
        tension={0.5}
        {...commonProps}
        draggable={false}
      />
    );
  }

  // Fallback for unknown types
  return null;
}
