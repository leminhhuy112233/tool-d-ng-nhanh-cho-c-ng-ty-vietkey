/**
 * VietKey DocGen — DocumentPreviewPane
 * Khung hiển thị trang A4 tương tác trực tiếp với thanh công cụ định dạng và zoom linh hoạt
 */

import React, { useState, useRef } from 'react'
import { DocumentFormattingToolbar } from './DocumentFormattingToolbar'
import { Check, Edit3, Download, Printer } from 'lucide-react'

interface DocumentPreviewPaneProps {
  title?: string
  children: React.ReactNode
  onClosePreview?: () => void
  onExportWord?: () => void
  onExportPdf?: () => void
}

export function DocumentPreviewPane({
  title = 'Bản Xem Trước Văn Bản (A4)',
  children,
  onClosePreview,
  onExportWord,
  onExportPdf
}: DocumentPreviewPaneProps) {
  const [zoom, setZoom] = useState<number>(0.85)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [savedNotice, setSavedNotice] = useState<boolean>(false)
  const documentSheetRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const triggerSaveNotice = () => {
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  return (
    <div
      className={`preview-pane-container ${isFullscreen ? 'preview-fullscreen' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '650px',
        background: 'var(--muted)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
      }}
    >
      {/* 1. Header & Thanh công cụ Formatting */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)', padding: '6px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
              📄 {title}
            </span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', fontWeight: 600 }}>
              Sửa trực tiếp (WYSIWYG)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onExportWord && (
              <button
                type="button"
                onClick={onExportWord}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={12} />
                <span>Xuất Word</span>
              </button>
            )}

            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={12} />
                <span>Xuất PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh công cụ định dạng chữ */}
        <DocumentFormattingToolbar
          zoom={zoom}
          onChangeZoom={setZoom}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onClosePreview={onClosePreview}
          onPrint={handlePrint}
        />
      </div>

      {/* 2. Dải thông báo trợ giúp */}
      <div
        style={{
          background: 'rgba(2, 132, 199, 0.06)',
          borderBottom: '1px solid rgba(2, 132, 199, 0.15)',
          padding: '4px 14px',
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Edit3 size={12} color="#0284c7" />
          <span>Mẹo: Bạn có thể click chuột trực tiếp vào bất kỳ dòng chữ nào trên trang A4 để sửa nội dung.</span>
        </span>
        {savedNotice && (
          <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Check size={12} /> Đã cập nhật
          </span>
        )}
      </div>

      {/* 3. Vùng chứa Trang Giấy A4 (A4 Paper Canvas) */}
      <div
        className="a4-scroll-viewport"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '24px 16px',
          display: 'flex',
          justifyContent: 'center',
          background: 'var(--muted)'
        }}
        onClick={() => triggerSaveNotice()}
      >
        <div
          ref={documentSheetRef}
          className="a4-sheet-paper"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
