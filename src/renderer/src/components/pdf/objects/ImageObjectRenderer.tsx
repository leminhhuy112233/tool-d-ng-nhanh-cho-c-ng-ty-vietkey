/**
 * ImageObjectRenderer — Hiển thị hình ảnh an toàn tuyệt đối với Loading & Error States
 * Triệt tiêu 100% hiện tượng broken image và alt text lỗi.
 */

import React, { useState, useEffect } from 'react'
import { Image as ImageIcon, AlertTriangle, RefreshCw, Upload } from 'lucide-react'
import { ImageEditorObject } from '../../../core/editor/EditorObjects'

interface ImageObjectRendererProps {
  object: ImageEditorObject
  width: number
  height: number
  onReplaceImage?: () => void
}

export function ImageObjectRenderer({
  object,
  width,
  height,
  onReplaceImage
}: ImageObjectRendererProps) {
  const [loadStatus, setLoadStatus] = useState<'loading' | 'loaded' | 'error'>(
    object.status || 'loading'
  )
  const [retryKey, setRetryKey] = useState(0)

  // Kiểm tra nạp ảnh an toàn qua Image() DOM
  useEffect(() => {
    if (!object.src || object.src.trim().length === 0) {
      setLoadStatus('error')
      return
    }

    setLoadStatus('loading')
    let cancelled = false

    const img = new Image()
    img.onload = () => {
      if (!cancelled) setLoadStatus('loaded')
    }
    img.onerror = () => {
      if (!cancelled) setLoadStatus('error')
    }
    img.src = object.src

    return () => {
      cancelled = true
    }
  }, [object.src, retryKey])

  // 1. Trạng thái Đang tải (Loading Placeholder)
  if (loadStatus === 'loading') {
    return (
      <div
        className="pdf-image-loading-placeholder"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px dashed rgba(56, 189, 248, 0.4)',
          borderRadius: '4px',
          color: '#94a3b8',
          fontSize: '11px',
          gap: '6px',
          userSelect: 'none'
        }}
      >
        <div className="pdf-spinner-mini" style={{ width: '16px', height: '16px' }} />
        <span>Đang tải ảnh...</span>
      </div>
    )
  }

  // 2. Trạng thái Lỗi (Error State với Nút Thử lại / Thay ảnh)
  if (loadStatus === 'error') {
    return (
      <div
        className="pdf-image-error-box"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px dashed rgba(239, 68, 68, 0.4)',
          borderRadius: '4px',
          padding: '8px',
          color: '#f87171',
          fontSize: '11px',
          textAlign: 'center',
          gap: '6px',
          boxSizing: 'border-box'
        }}
      >
        <AlertTriangle size={18} />
        <span style={{ fontWeight: 500 }}>Ảnh bị lỗi nạp</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setRetryKey((k) => k + 1)
            }}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: '#f8fafc',
              cursor: 'pointer'
            }}
            title="Thử nạp lại"
          >
            <RefreshCw size={10} style={{ display: 'inline', marginRight: '3px' }} />
            Thử lại
          </button>
          {onReplaceImage && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onReplaceImage()
              }}
              style={{
                padding: '2px 8px',
                fontSize: '10px',
                background: '#2563eb',
                border: 'none',
                borderRadius: '4px',
                color: '#ffffff',
                cursor: 'pointer'
              }}
              title="Chọn ảnh khác từ máy tính"
            >
              <Upload size={10} style={{ display: 'inline', marginRight: '3px' }} />
              Đổi ảnh
            </button>
          )}
        </div>
      </div>
    )
  }

  // 3. Trạng thái Hiển thị Ảnh Thành công
  return (
    <img
      src={object.src}
      alt="" // Không dùng alt text làm rác giao diện khi có sự cố
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
