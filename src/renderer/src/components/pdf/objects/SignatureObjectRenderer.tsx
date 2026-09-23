/**
 * SignatureObjectRenderer — Hiển thị chữ ký điện tử hoặc con dấu sắc nét
 */

import React from 'react'
import { SignatureEditorObject } from '../../../core/editor/EditorObjects'

interface SignatureObjectRendererProps {
  object: SignatureEditorObject
  width: number
  height: number
}

export function SignatureObjectRenderer({
  object,
  width,
  height
}: SignatureObjectRendererProps) {
  if (!object.src) {
    return (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          border: '1px dashed #94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '11px'
        }}
      >
        Chữ ký chưa sẵn sàng
      </div>
    )
  }

  return (
    <img
      src={object.src}
      alt=""
      draggable={false}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'contain',
        display: 'block',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    />
  )
}
