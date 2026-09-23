/**
 * HighlightObjectRenderer — Hiển thị vùng dạ quang trong suốt với mix-blend-mode: multiply
 * Giúp nổi bật nội dung chữ của văn bản bên dưới mà không làm che khuất nét chữ.
 */

import React from 'react'
import { HighlightEditorObject } from '../../../core/editor/EditorObjects'

interface HighlightObjectRendererProps {
  object: HighlightEditorObject
  width: number
  height: number
}

export function HighlightObjectRenderer({
  object,
  width,
  height
}: HighlightObjectRendererProps) {
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: object.color || 'rgba(254, 240, 138, 0.45)',
        mixBlendMode: 'multiply',
        borderRadius: '2px',
        pointerEvents: 'none'
      }}
    />
  )
}
