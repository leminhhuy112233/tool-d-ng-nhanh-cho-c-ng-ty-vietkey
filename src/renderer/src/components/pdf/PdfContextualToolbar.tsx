/**
 * PdfContextualToolbar — Thanh công cụ nổi theo ngữ cảnh đối tượng (Progressive Disclosure)
 * Nằm nổi ngay phía trên đối tượng đang chọn, tự động biến đổi các tùy chọn theo loại đối tượng
 * (Font, Cỡ chữ, Màu sắc, Nét viền, Nhân bản, Xóa) tương tự Figma / Canva.
 */

import React from 'react'
import {
  Trash2,
  Copy,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Palette,
  Layers,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { EditorObject } from '../../core/editor/EditorObjects'

interface PdfContextualToolbarProps {
  object: EditorObject
  onUpdate: (updates: Partial<EditorObject>) => void
  onDuplicate?: () => void
  onDelete: () => void
  onBringForward?: () => void
  onSendBackward?: () => void
}

const COLOR_PRESETS = [
  { label: 'Đen', value: '#0f172a' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Xanh lá', value: '#16a34a' },
  { label: 'Cam', value: '#ea580c' },
  { label: 'Vàng neon', value: '#facc15' }
]

const HIGHLIGHT_PRESETS = [
  { label: 'Vàng dạ quang', value: 'rgba(254, 240, 138, 0.55)' },
  { label: 'Xanh lá dạ quang', value: 'rgba(187, 247, 208, 0.55)' },
  { label: 'Xanh cyan dạ quang', value: 'rgba(186, 230, 253, 0.55)' },
  { label: 'Hồng dạ quang', value: 'rgba(251, 207, 232, 0.55)' }
]

export function PdfContextualToolbar({
  object,
  onUpdate,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward
}: PdfContextualToolbarProps) {
  const isText = object.type === 'text'
  const isShape = object.type === 'shape'
  const isHighlight = object.type === 'highlight'

  return (
    <div
      className="pdf-contextual-toolbar"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '4px 8px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
        zIndex: 100,
        whiteSpace: 'nowrap',
        pointerEvents: 'auto'
      }}
    >
      {/* Tiêu đề ngắn của đối tượng */}
      <span className="pdf-context-label" style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
        {object.label || object.type}
      </span>

      <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />

      {/* 1. Tùy chọn cho Văn bản (Font, Cỡ, Bold, Italic) */}
      {isText && (
        <>
          <select
            className="pdf-context-select"
            value={object.fontSize || 14}
            onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '4px',
              color: '#f8fafc',
              fontSize: '11px',
              padding: '2px 4px',
              outline: 'none'
            }}
          >
            {[10, 12, 14, 16, 18, 20, 24, 28, 32, 40].map((s) => (
              <option key={s} value={s}>
                {s} pt
              </option>
            ))}
          </select>

          <button
            className={`pdf-context-mini-btn ${object.bold ? 'active' : ''}`}
            onClick={() => onUpdate({ bold: !object.bold })}
            style={{
              background: object.bold ? '#2563eb' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#f8fafc',
              padding: '3px',
              cursor: 'pointer'
            }}
            title="In đậm (Bold)"
          >
            <Bold size={12} />
          </button>

          <button
            className={`pdf-context-mini-btn ${object.italic ? 'active' : ''}`}
            onClick={() => onUpdate({ italic: !object.italic })}
            style={{
              background: object.italic ? '#2563eb' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: '#f8fafc',
              padding: '3px',
              cursor: 'pointer'
            }}
            title="In nghiêng (Italic)"
          >
            <Italic size={12} />
          </button>
        </>
      )}

      {/* 2. Tùy chọn cho Hình khối (Độ dày nét) */}
      {isShape && (
        <select
          value={object.strokeWidth || 2}
          onChange={(e) => onUpdate({ strokeWidth: Number(e.target.value) })}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '4px',
            color: '#f8fafc',
            fontSize: '11px',
            padding: '2px 4px',
            outline: 'none'
          }}
          title="Độ dày viền"
        >
          {[1, 2, 4, 6, 8].map((w) => (
            <option key={w} value={w}>
              Nét {w}px
            </option>
          ))}
        </select>
      )}

      {/* 3. Bảng chọn màu sắc nhanh */}
      {(isText || isShape) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {COLOR_PRESETS.slice(0, 5).map((c) => (
            <button
              key={c.value}
              className="pdf-color-dot"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: c.value,
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                padding: 0
              }}
              title={c.label}
              onClick={() => {
                if (isText) onUpdate({ color: c.value })
                if (isShape) onUpdate({ strokeColor: c.value })
              }}
            />
          ))}
        </div>
      )}

      {/* 4. Chọn màu cho Dạ quang (Highlight) */}
      {isHighlight && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {HIGHLIGHT_PRESETS.map((c) => (
            <button
              key={c.value}
              className="pdf-color-dot"
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: c.value,
                border: '1px solid rgba(255,255,255,0.3)',
                cursor: 'pointer',
                padding: 0
              }}
              title={c.label}
              onClick={() => onUpdate({ color: c.value })}
            />
          ))}
        </div>
      )}

      <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)' }} />

      {/* 5. Nút Nhân bản (Duplicate) */}
      {onDuplicate && (
        <button
          onClick={onDuplicate}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '3px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Nhân bản đối tượng (Ctrl + D)"
        >
          <Copy size={13} />
        </button>
      )}

      {/* 6. Thứ tự lớp (Layering) */}
      {onBringForward && (
        <button
          onClick={onBringForward}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '3px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Đưa lên lớp trên"
        >
          <ArrowUp size={13} />
        </button>
      )}

      {/* 7. Nút Xóa (Delete) */}
      <button
        onClick={onDelete}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#f87171',
          cursor: 'pointer',
          padding: '3px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center'
        }}
        title="Xóa đối tượng (Delete)"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}
