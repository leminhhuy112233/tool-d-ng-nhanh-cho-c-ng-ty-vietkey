/**
 * VietKey DocGen — DocumentFormattingToolbar
 * Thanh công cụ định dạng văn bản trực tiếp (WYSIWYG) cho bản xem trước A4
 */

import React from 'react'
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  EyeOff,
  Palette
} from 'lucide-react'

interface DocumentFormattingToolbarProps {
  zoom: number
  onChangeZoom: (newZoom: number) => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  onClosePreview?: () => void
  onPrint?: () => void
  onResetFormat?: () => void
}

export function DocumentFormattingToolbar({
  zoom,
  onChangeZoom,
  isFullscreen,
  onToggleFullscreen,
  onClosePreview,
  onPrint,
  onResetFormat
}: DocumentFormattingToolbarProps) {
  const executeCommand = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val)
  }

  const handleFontSize = (sizePt: string) => {
    // Tùy biến cỡ chữ qua inline style của selection
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.style.fontSize = `${sizePt}pt`
    try {
      range.surroundContents(span)
    } catch {
      document.execCommand('fontSize', false, '3')
    }
  }

  const handleFontFamily = (fontName: string) => {
    document.execCommand('fontName', false, fontName)
  }

  const handleColor = (colorHex: string) => {
    document.execCommand('foreColor', false, colorHex)
  }

  return (
    <div className="preview-toolbar">
      {/* Cụm 1: Định dạng chữ (Bold, Italic, Underline) */}
      <div className="preview-toolbar-group">
        <button
          type="button"
          className="preview-tool-btn"
          title="In đậm (Ctrl+B)"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand('bold')
          }}
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          className="preview-tool-btn"
          title="In nghiêng (Ctrl+I)"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand('italic')
          }}
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          className="preview-tool-btn"
          title="Gạch chân (Ctrl+U)"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand('underline')
          }}
        >
          <Underline size={14} />
        </button>
      </div>

      <div className="preview-toolbar-divider" />

      {/* Cụm 2: Cỡ chữ & Font chữ */}
      <div className="preview-toolbar-group">
        <select
          className="preview-tool-select"
          title="Chọn Font chữ"
          onChange={(e) => handleFontFamily(e.target.value)}
          defaultValue="Times New Roman"
        >
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Segoe UI', sans-serif">Segoe UI</option>
          <option value="'Inter', sans-serif">Inter</option>
        </select>

        <select
          className="preview-tool-select"
          style={{ width: '65px' }}
          title="Cỡ chữ"
          onChange={(e) => handleFontSize(e.target.value)}
          defaultValue="13"
        >
          <option value="11">11 pt</option>
          <option value="12">12 pt</option>
          <option value="13">13 pt</option>
          <option value="14">14 pt</option>
          <option value="16">16 pt</option>
          <option value="18">18 pt</option>
          <option value="20">20 pt</option>
        </select>
      </div>

      <div className="preview-toolbar-divider" />

      {/* Cụm 3: Căn lề */}
      <div className="preview-toolbar-group">
        <button
          type="button"
          className="preview-tool-btn"
          title="Căn lề trái"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand('justifyLeft')
          }}
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          className="preview-tool-btn"
          title="Căn giữa"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand('justifyCenter')
          }}
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          className="preview-tool-btn"
          title="Căn lề phải"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand('justifyRight')
          }}
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          className="preview-tool-btn"
          title="Căn đều 2 bên"
          onMouseDown={(e) => {
            e.preventDefault()
            executeCommand('justifyFull')
          }}
        >
          <AlignJustify size={14} />
        </button>
      </div>

      <div className="preview-toolbar-divider" />

      {/* Cụm 4: Màu chữ nhanh */}
      <div className="preview-toolbar-group">
        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Palette size={12} />
        </span>
        <button
          type="button"
          className="color-dot"
          style={{ background: '#000000' }}
          title="Màu chữ Đen"
          onMouseDown={(e) => {
            e.preventDefault()
            handleColor('#000000')
          }}
        />
        <button
          type="button"
          className="color-dot"
          style={{ background: '#1d4ed8' }}
          title="Màu chữ Xanh dương"
          onMouseDown={(e) => {
            e.preventDefault()
            handleColor('#1d4ed8')
          }}
        />
        <button
          type="button"
          className="color-dot"
          style={{ background: '#b91c1c' }}
          title="Màu chữ Đỏ"
          onMouseDown={(e) => {
            e.preventDefault()
            handleColor('#b91c1c')
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      {/* Cụm 5: Thu phóng (Zoom) & Thao tác */}
      <div className="preview-toolbar-group">
        <button
          type="button"
          className="preview-tool-btn"
          title="Thu nhỏ"
          onClick={() => onChangeZoom(Math.max(0.5, Number((zoom - 0.1).toFixed(1))))}
        >
          <ZoomOut size={13} />
        </button>
        <span style={{ fontSize: '11.5px', fontWeight: 600, minWidth: '42px', textAlign: 'center', color: 'var(--foreground)' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className="preview-tool-btn"
          title="Phóng to"
          onClick={() => onChangeZoom(Math.min(1.5, Number((zoom + 0.1).toFixed(1))))}
        >
          <ZoomIn size={13} />
        </button>
        <button
          type="button"
          className="preview-tool-btn"
          title="Đặt lại cỡ 100%"
          onClick={() => onChangeZoom(1.0)}
          style={{ fontSize: '11px', fontWeight: 600 }}
        >
          100%
        </button>
      </div>

      <div className="preview-toolbar-divider" />

      {/* Cụm 6: Phóng to / In / Đóng */}
      <div className="preview-toolbar-group">
        {onPrint && (
          <button
            type="button"
            className="preview-tool-btn"
            title="In văn bản nhanh (Ctrl+P)"
            onClick={onPrint}
          >
            <Printer size={14} color="#0284c7" />
          </button>
        )}

        <button
          type="button"
          className="preview-tool-btn"
          title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Xem toàn màn hình'}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {onClosePreview && (
          <button
            type="button"
            className="preview-tool-btn text-destructive"
            title="Đóng bản xem trước"
            onClick={onClosePreview}
          >
            <EyeOff size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
