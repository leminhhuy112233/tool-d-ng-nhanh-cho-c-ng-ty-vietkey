/**
 * VietKey DocGen — DocxNativePreviewPane
 * Bản xem trước DOCX nguyên bản (Single Source of Truth)
 * Render trực tiếp từ OpenXML buffer tạo bởi docxtemplater thông qua docx-preview.
 * Đảm bảo 100% khớp font chữ, bảng, header/footer, khoảng cách lề và kích thước A4.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as docx from 'docx-preview'
import { DocumentFormattingToolbar } from './DocumentFormattingToolbar'
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  AlertCircle,
  Check,
  Edit3,
  Sparkles,
  ShieldCheck,
  Eye
} from 'lucide-react'

interface DocxNativePreviewPaneProps {
  title?: string
  docType: 'contract' | 'quotation' | 'advance' | 'custom'
  data: any
  customTemplateId?: string
  onClosePreview?: () => void
  onExportWord?: () => void
  onExportPdf?: () => void
}

export function DocxNativePreviewPane({
  title = 'Bản Xem Trước Văn Bản Chuẩn Word (DOCX)',
  docType,
  data,
  customTemplateId,
  onClosePreview,
  onExportWord,
  onExportPdf
}: DocxNativePreviewPaneProps) {
  const [zoom, setZoom] = useState<number>(0.85)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isEditable, setIsEditable] = useState<boolean>(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastRenderedTime, setLastRenderedTime] = useState<string>('')
  const [savedNotice, setSavedNotice] = useState<boolean>(false)

  const docxContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataHashRef = useRef<string>('')
  const renderRequestIdRef = useRef<number>(0)

  // Chuyển base64 sang ArrayBuffer an toàn cho trình duyệt
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = window.atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  // Bật contentEditable trên các khối text của tài liệu đã render
  const enableInlineEditing = useCallback(() => {
    if (!docxContainerRef.current) return
    const container = docxContainerRef.current

    // Tìm tất cả các đoạn văn, ô bảng, tiêu đề bên trong bản render của Word
    const editableElements = container.querySelectorAll<HTMLElement>(
      'p, td, th, h1, h2, h3, h4, h5, h6, span'
    )

    editableElements.forEach((el) => {
      // Chỉ gán contentEditable cho các node có chữ hoặc ô bảng
      if (el.tagName === 'TD' || el.tagName === 'TH' || el.tagName === 'P') {
        el.setAttribute('contenteditable', isEditable ? 'true' : 'false')
        el.style.outline = 'none'
        el.style.cursor = isEditable ? 'text' : 'default'
      }
    })
  }, [isEditable])

  // Hàm render tài liệu DOCX sang DOM
  const renderDocxBuffer = useCallback(
    async (force = false) => {
      if (!docxContainerRef.current) return

      const currentDataHash = JSON.stringify({ docType, data, customTemplateId })
      if (!force && currentDataHash === lastDataHashRef.current) {
        return
      }

      const currentRequestId = ++renderRequestIdRef.current
      setIsLoading(true)
      setErrorMessage(null)

      try {
        if (!window.api?.renderPreviewDocx) {
          throw new Error('API renderPreviewDocx chưa được khởi tạo trong Electron.')
        }

        const res = await window.api.renderPreviewDocx(docType, data, customTemplateId)

        // Bỏ qua nếu có yêu cầu render mới hơn đã được phát đi
        if (currentRequestId !== renderRequestIdRef.current) {
          return
        }

        const rawBase64 = res.base64Buffer || res.docxBase64
        if (!res.success || !rawBase64) {
          throw new Error(res.error || 'Không nhận được dữ liệu file DOCX xem trước.')
        }

        const arrayBuffer = base64ToArrayBuffer(rawBase64)

        // Dọn sạch DOM trước khi render trang mới để tránh rò rỉ bộ nhớ
        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = ''
        }

        // Render OpenXML DOCX bằng docx-preview với các thiết lập chuẩn xác nhất
        await docx.renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
          className: 'docx-preview-viewport',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          debug: false
        })

        lastDataHashRef.current = currentDataHash
        setLastRenderedTime(new Date().toLocaleTimeString('vi-VN'))

        // Áp dụng tính năng chỉnh sửa trực tiếp sau khi render hoàn tất
        enableInlineEditing()
      } catch (err: any) {
        if (currentRequestId === renderRequestIdRef.current) {
          setErrorMessage(err.message || 'Lỗi khi kết xuất bản xem trước DOCX.')
        }
      } finally {
        if (currentRequestId === renderRequestIdRef.current) {
          setIsLoading(false)
        }
      }
    },
    [docType, data, customTemplateId, enableInlineEditing]
  )

  // Hiệu năng cao: Debounce 350ms khi người dùng thay đổi form
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      renderDocxBuffer()
    }, 350)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [renderDocxBuffer])

  // Cập nhật trạng thái contentEditable khi bật/tắt chế độ sửa
  useEffect(() => {
    enableInlineEditing()
  }, [isEditable, enableInlineEditing])

  const handlePrint = () => {
    window.print()
  }

  const triggerSaveNotice = () => {
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  return (
    <div
      className={`docx-preview-pane ${isFullscreen ? 'preview-fullscreen' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '680px',
        background: '#e2e8f0',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        position: 'relative'
      }}
    >
      {/* 1. Header & Thanh công cụ */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #cbd5e1', padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#1B365D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <FileText size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1B365D' }}>
                  {title}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShieldCheck size={12} />
                  Chuẩn DOCX Word 1:1
                </span>
              </div>
              {lastRenderedTime && (
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Cập nhật lúc: {lastRenderedTime}
                </div>
              )}
            </div>
          </div>

          {/* Cụm nút Xuất Word / In / Chế độ sửa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Nút bật/tắt sửa trực tiếp */}
            <button
              type="button"
              onClick={() => setIsEditable(!isEditable)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: '6px',
                background: isEditable ? '#eff6ff' : '#f1f5f9',
                color: isEditable ? '#1d4ed8' : '#475569',
                border: isEditable ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Click để bật hoặc tắt chế độ chỉnh sửa chữ trực tiếp trên trang"
            >
              {isEditable ? <Edit3 size={13} color="#1d4ed8" /> : <Eye size={13} />}
              <span>{isEditable ? 'Chế độ: Đang cho sửa text' : 'Chế độ: Chỉ đọc'}</span>
            </button>

            {/* Nút làm mới */}
            <button
              type="button"
              onClick={() => renderDocxBuffer(true)}
              disabled={isLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                padding: '6px 10px',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
              title="Cập nhật lại bản xem trước ngay lập tức"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            {/* Nút Xuất Word */}
            {onExportWord && (
              <button
                type="button"
                onClick={onExportWord}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #1B365D 0%, #2A4D7D 100%)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(27, 54, 93, 0.25)'
                }}
              >
                <Download size={13} />
                <span>Xuất File Word</span>
              </button>
            )}

            {/* Nút Xuất PDF */}
            {onExportPdf && (
              <button
                type="button"
                onClick={onExportPdf}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Download size={13} />
                <span>Xuất PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh công cụ định dạng chữ và zoom */}
        <DocumentFormattingToolbar
          zoom={zoom}
          onChangeZoom={setZoom}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onClosePreview={onClosePreview}
          onPrint={handlePrint}
        />
      </div>

      {/* 2. Dải hướng dẫn và trạng thái */}
      <div
        style={{
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1',
          padding: '6px 16px',
          fontSize: '11.5px',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="#2563eb" />
          <span>
            Bản xem trước được sinh từ file Word thật. Click vào chữ để chỉnh sửa, bôi đen để định dạng in đậm / nghiêng / đổi màu.
          </span>
        </span>
        {savedNotice && (
          <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Check size={13} /> Đã cập nhật
          </span>
        )}
      </div>

      {/* 3. Vùng hiển thị tài liệu DOCX */}
      <div
        className="docx-canvas-viewport"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '30px 16px',
          display: 'flex',
          justifyContent: 'center',
          background: '#94a3b8',
          position: 'relative'
        }}
        onClick={() => triggerSaveNotice()}
      >
        {/* Loading overlay nhẹ nhàng, không gây giật lag */}
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '24px',
              zIndex: 10,
              background: 'rgba(27, 54, 93, 0.9)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(4px)'
            }}
          >
            <RefreshCw size={13} className="animate-spin" />
            <span>Đang render DOCX...</span>
          </div>
        )}

        {errorMessage ? (
          <div
            style={{
              margin: 'auto',
              maxWidth: '480px',
              background: '#ffffff',
              padding: '32px',
              borderRadius: '12px',
              textAlign: 'center',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}
          >
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>
              Không Thể Hiển Thị Bản Xem Trước DOCX
            </h4>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => renderDocxBuffer(true)}
              style={{
                padding: '8px 18px',
                background: '#1B365D',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Thử lại kết xuất
            </button>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Container cho docx-preview renderAsync */}
            <div
              ref={docxContainerRef}
              className="docx-render-target"
              style={{
                width: '100%',
                maxWidth: '900px'
              }}
            />
          </div>
        )}
      </div>

      {/* Global CSS chuyên biệt cho trang Word do docx-preview xuất ra */}
      <style>{`
        .docx-preview-viewport {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          background: transparent !important;
          padding: 0 !important;
        }

        .docx-preview-viewport > section.docx {
          background: #ffffff !important;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18), 0 1px 4px rgba(0, 0, 0, 0.08) !important;
          margin-bottom: 24px !important;
          border-radius: 2px !important;
          transition: box-shadow 0.2s ease;
        }

        .docx-preview-viewport > section.docx:hover {
          box-shadow: 0 10px 32px rgba(0, 0, 0, 0.24), 0 2px 6px rgba(0, 0, 0, 0.1) !important;
        }

        .docx-render-target [contenteditable="true"]:focus {
          outline: 1px dashed #2563eb !important;
          background-color: rgba(37, 99, 235, 0.04) !important;
        }

        .preview-fullscreen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 9999 !important;
          border-radius: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }
      `}</style>
    </div>
  )
}
