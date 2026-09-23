/**
 * TextObjectRenderer — Hiển thị văn bản sắc nét và hỗ trợ Inline Editing khi nhấp đúp
 */

import React, { useState, useRef, useEffect } from 'react'
import { TextEditorObject } from '../../../core/editor/EditorObjects'

interface TextObjectRendererProps {
  object: TextEditorObject
  width: number
  height: number
  scale: number
  isSelected: boolean
  onUpdateText: (text: string) => void
}

export function TextObjectRenderer({
  object,
  width: _width,
  height: _height,
  scale,
  isSelected: _isSelected,
  onUpdateText
}: TextObjectRendererProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(object.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditText(object.text)
  }, [object.text])

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (editText !== object.text) {
      onUpdateText(editText)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditText(object.text)
    }
  }

  const computedFontSize = Math.max(8, (object.fontSize || 14) * scale)

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '100%',
          fontSize: `${computedFontSize}px`,
          fontFamily: object.fontFamily || 'Inter, sans-serif',
          color: object.color || '#0f172a',
          fontWeight: object.bold ? 'bold' : 'normal',
          fontStyle: object.italic ? 'italic' : 'normal',
          textDecoration: object.underline ? 'underline' : 'none',
          textAlign: object.align || 'left',
          lineHeight: object.lineHeight || 1.3,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #38bdf8',
          borderRadius: '3px',
          outline: 'none',
          resize: 'none',
          padding: '2px 4px',
          boxSizing: 'border-box'
        }}
      />
    )
  }

  return (
    <div
      onDoubleClick={(e) => {
        e.stopPropagation()
        setIsEditing(true)
      }}
      style={{
        width: '100%',
        height: '100%',
        fontSize: `${computedFontSize}px`,
        fontFamily: object.fontFamily || 'Inter, sans-serif',
        color: object.color || '#0f172a',
        fontWeight: object.bold ? 'bold' : 'normal',
        fontStyle: object.italic ? 'italic' : 'normal',
        textDecoration: object.underline ? 'underline' : 'none',
        textAlign: object.align || 'left',
        lineHeight: object.lineHeight || 1.3,
        wordBreak: 'break-word',
        userSelect: 'none',
        pointerEvents: 'none', // Cho phép click xuyên vào container để chọn/kéo
        padding: '2px 4px',
        boxSizing: 'border-box'
      }}
    >
      {object.text || <span style={{ opacity: 0.4 }}>Nhấp đúp để nhập chữ...</span>}
    </div>
  )
}
