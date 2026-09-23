/**
 * ShapeObjectRenderer — Hiển thị hình khối Vector SVG thuần túy
 * Không rasterize thành ảnh pixel, giữ độ nét hoàn hảo 100% tại mọi mức phóng Zoom (25% - 400%).
 */

import React from 'react'
import { ShapeEditorObject } from '../../../core/editor/EditorObjects'

interface ShapeObjectRendererProps {
  object: ShapeEditorObject
  width: number
  height: number
  scale: number
}

export function ShapeObjectRenderer({ object, width, height, scale }: ShapeObjectRendererProps) {
  const strokeW = Math.max(1, (object.strokeWidth || 2) * scale)
  const strokeColor = object.strokeColor || '#2563eb'
  const fillColor = object.fillColor || 'transparent'
  const isDashed = object.strokeStyle === 'dashed'

  if (object.shapeType === 'rect') {
    const halfStroke = strokeW / 2
    return (
      <svg
        width={width}
        height={height}
        style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <rect
          x={halfStroke}
          y={halfStroke}
          width={Math.max(1, width - strokeW)}
          height={Math.max(1, height - strokeW)}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={isDashed ? '6,4' : undefined}
          fill={fillColor}
          rx={4}
          ry={4}
        />
      </svg>
    )
  }

  if (object.shapeType === 'circle') {
    const rx = Math.max(1, (width - strokeW) / 2)
    const ry = Math.max(1, (height - strokeW) / 2)
    return (
      <svg
        width={width}
        height={height}
        style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={rx}
          ry={ry}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={isDashed ? '6,4' : undefined}
          fill={fillColor}
        />
      </svg>
    )
  }

  if (object.shapeType === 'line') {
    return (
      <svg
        width={width}
        height={height}
        style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={isDashed ? '6,4' : undefined}
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (object.shapeType === 'arrow') {
    const arrowHeadSize = Math.max(8, strokeW * 3)
    const endX = Math.max(10, width - arrowHeadSize)
    const midY = height / 2

    return (
      <svg
        width={width}
        height={height}
        style={{ display: 'block', overflow: 'visible', pointerEvents: 'none' }}
      >
        <line
          x1={0}
          y1={midY}
          x2={endX}
          y2={midY}
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <polygon
          points={`${endX},${midY - arrowHeadSize / 2} ${width},${midY} ${endX},${midY + arrowHeadSize / 2}`}
          fill={strokeColor}
        />
      </svg>
    )
  }

  return null
}
