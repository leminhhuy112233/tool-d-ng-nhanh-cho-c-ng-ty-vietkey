/**
 * SelectionLayer — Lớp Selection & Transform độc lập hoàn toàn với Object Content
 * Bao gồm Bounding Box phát quang, 8 điểm mút co giãn (Resize handles), và Contextual Toolbar.
 */

import React from 'react'
import { EditorObject } from '../../../core/editor/EditorObjects'
import { PdfContextualToolbar } from '../PdfContextualToolbar'

interface SelectionLayerProps {
  object: EditorObject
  width: number
  height: number
  onResizeStart: (e: React.MouseEvent, handle: string) => void
  onUpdate: (updates: Partial<EditorObject>) => void
  onDuplicate?: () => void
  onDelete: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
}

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export function SelectionLayer({
  object,
  width: _width,
  height: _height,
  onResizeStart,
  onUpdate,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward
}: SelectionLayerProps) {
  return (
    <div
      className="pdf-selection-layer"
      style={{
        position: 'absolute',
        inset: 0,
        border: '1.5px solid #0284c7',
        boxShadow: '0 0 0 1px rgba(2, 132, 199, 0.3), 0 0 8px rgba(56, 189, 248, 0.35)',
        pointerEvents: 'none',
        borderRadius: '2px',
        zIndex: 50
      }}
    >
      {/* 8 Điểm mút điều khiển kích thước (Resize Handles) */}
      {HANDLES.map((h) => {
        let cursor = 'nwse-resize'
        if (h === 'n' || h === 's') cursor = 'ns-resize'
        if (h === 'e' || h === 'w') cursor = 'ew-resize'
        if (h === 'ne' || h === 'sw') cursor = 'nesw-resize'

        const isTop = h.includes('n')
        const isBottom = h.includes('s')
        const isLeft = h.includes('w')
        const isRight = h.includes('e')

        let top = '50%'
        let left = '50%'
        if (isTop) top = '-4px'
        if (isBottom) top = 'calc(100% - 4px)'
        if (isLeft) left = '-4px'
        if (isRight) left = 'calc(100% - 4px)'

        return (
          <div
            key={h}
            className={`pdf-resize-handle handle-${h}`}
            style={{
              position: 'absolute',
              top,
              left,
              width: '8px',
              height: '8px',
              backgroundColor: '#ffffff',
              border: '1.5px solid #0284c7',
              borderRadius: '2px',
              cursor,
              pointerEvents: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transform: !isTop && !isBottom ? 'translateY(-50%)' : !isLeft && !isRight ? 'translateX(-50%)' : undefined,
              zIndex: 60
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              onResizeStart(e, h)
            }}
          />
        )
      })}

      {/* Contextual Toolbar nổi ngay phía trên Bounding Box */}
      <PdfContextualToolbar
        object={object}
        onUpdate={onUpdate}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onBringForward={onBringForward}
        onSendBackward={onSendBackward}
      />
    </div>
  )
}
