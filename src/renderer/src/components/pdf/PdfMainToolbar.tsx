/**
 * PdfMainToolbar — Thanh công cụ 1 tầng tinh gọn phong cách Desktop
 * Chiều cao 44px, hiển thị các công cụ cốt lõi kèm trạng thái Active rõ ràng.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  MousePointer,
  Hand,
  Type,
  Image as ImageIcon,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Highlighter,
  PenTool,
  StickyNote,
  FileSignature,
  Stamp,
  Check,
  X as XIcon,
  Calendar,
  Search,
  Undo2,
  Redo2,
  ChevronDown,
  Eraser,
  Sparkles,
  Droplet,
  Layers
} from 'lucide-react'
import { usePdfStore } from '../../stores/pdfTools.store'

export type MainToolType =
  | 'select'
  | 'pan'
  | 'text'
  | 'image'
  | 'shape'
  | 'highlight'
  | 'draw'
  | 'note'
  | 'whiteout'
  | 'sign'

interface PdfMainToolbarProps {
  activeTool: MainToolType
  onSelectTool: (tool: MainToolType) => void
  onInsertImage: () => void
  onInsertShape: (shape: 'rect' | 'circle' | 'arrow' | 'line') => void
  onWhiteoutText: () => void
  onHighlight: () => void
  onComment: () => void
  onInsertQuickSymbol: (type: 'check' | 'cross' | 'date' | 'text') => void
  onOpenSignatureModal: (tab?: 'draw' | 'upload' | 'type' | 'stamp') => void
  onOpenWatermarkModal: () => void
  onToggleSearch: () => void
}

export function PdfMainToolbar({
  activeTool,
  onSelectTool,
  onInsertImage,
  onInsertShape,
  onWhiteoutText,
  onHighlight,
  onComment,
  onInsertQuickSymbol,
  onOpenSignatureModal,
  onOpenWatermarkModal,
  onToggleSearch
}: PdfMainToolbarProps) {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    panMode,
    setPanMode,
    pdfBase64
  } = usePdfStore()

  const [shapeMenuOpen, setShapeMenuOpen] = useState(false)
  const [stampMenuOpen, setStampMenuOpen] = useState(false)
  const [symbolMenuOpen, setSymbolMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const toolbarRef = useRef<HTMLDivElement>(null)

  // Đóng popups khi click ra ngoài
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShapeMenuOpen(false)
        setStampMenuOpen(false)
        setSymbolMenuOpen(false)
        setMoreMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [])

  const hasDoc = !!pdfBase64

  return (
    <div className="pdf-main-toolbar" ref={toolbarRef}>
      {/* NHÓM 1: Điều hướng & Chọn (Select / Pan) */}
      <div className="pdf-toolbar-group">
        <button
          className={`pdf-tool-btn ${activeTool === 'select' && !panMode ? 'active' : ''}`}
          title="Chọn đối tượng (V)"
          onClick={() => {
            setPanMode(false)
            onSelectTool('select')
          }}
          disabled={!hasDoc}
        >
          <MousePointer size={16} />
          <span className="pdf-tool-label">Chọn</span>
        </button>

        <button
          className={`pdf-tool-btn ${panMode ? 'active' : ''}`}
          title="Bàn tay kéo trang (H hoặc giữ Space)"
          onClick={() => {
            setPanMode(!panMode)
            if (!panMode) onSelectTool('pan')
          }}
          disabled={!hasDoc}
        >
          <Hand size={16} />
          <span className="pdf-tool-label">Kéo</span>
        </button>
      </div>

      <div className="pdf-toolbar-separator" />

      {/* NHÓM 2: Biên tập Nội dung (Text, Image, Shape) */}
      <div className="pdf-toolbar-group">
        <button
          className={`pdf-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          title="Chèn văn bản (T)"
          onClick={() => onInsertQuickSymbol('text')}
          disabled={!hasDoc}
        >
          <Type size={16} />
          <span className="pdf-tool-label">Văn bản</span>
        </button>

        <button
          className={`pdf-tool-btn ${activeTool === 'image' ? 'active' : ''}`}
          title="Chèn hình ảnh từ máy tính (I)"
          onClick={onInsertImage}
          disabled={!hasDoc}
        >
          <ImageIcon size={16} />
          <span className="pdf-tool-label">Ảnh</span>
        </button>

        {/* Shape Menu Dropdown */}
        <div className="pdf-tool-dropdown-wrap">
          <button
            className={`pdf-tool-btn has-dropdown ${activeTool === 'shape' ? 'active' : ''}`}
            title="Vẽ hình khối (S)"
            onClick={() => setShapeMenuOpen((prev) => !prev)}
            disabled={!hasDoc}
          >
            <Square size={16} />
            <span className="pdf-tool-label">Hình khối</span>
            <ChevronDown size={11} className="pdf-chevron" />
          </button>

          {shapeMenuOpen && (
            <div className="pdf-tool-popup-menu">
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onInsertShape('rect')
                  setShapeMenuOpen(false)
                }}
              >
                <Square size={14} color="#2563eb" />
                <span>Khung chữ nhật</span>
              </button>
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onInsertShape('circle')
                  setShapeMenuOpen(false)
                }}
              >
                <Circle size={14} color="#ef4444" />
                <span>Hình elip / tròn</span>
              </button>
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onInsertShape('arrow')
                  setShapeMenuOpen(false)
                }}
              >
                <ArrowRight size={14} color="#10b981" />
                <span>Mũi tên chỉ dẫn</span>
              </button>
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onInsertShape('line')
                  setShapeMenuOpen(false)
                }}
              >
                <Minus size={14} color="#3b82f6" />
                <span>Đường kẻ ngang</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pdf-toolbar-separator" />

      {/* NHÓM 3: Đánh dấu & Ghi chú (Highlight, Note, Whiteout) */}
      <div className="pdf-toolbar-group">
        <button
          className={`pdf-tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
          title="Dạ quang Highlight văn bản (H)"
          onClick={onHighlight}
          disabled={!hasDoc}
        >
          <Highlighter size={16} color="#eab308" />
          <span className="pdf-tool-label">Dạ quang</span>
        </button>

        <button
          className={`pdf-tool-btn ${activeTool === 'note' ? 'active' : ''}`}
          title="Ghi chú dán Sticky Note (N)"
          onClick={onComment}
          disabled={!hasDoc}
        >
          <StickyNote size={16} color="#f59e0b" />
          <span className="pdf-tool-label">Ghi chú</span>
        </button>

        <button
          className={`pdf-tool-btn ${activeTool === 'whiteout' ? 'active' : ''}`}
          title="Xóa chữ cũ & Viết đè nội dung mới"
          onClick={onWhiteoutText}
          disabled={!hasDoc}
        >
          <Eraser size={16} />
          <span className="pdf-tool-label">Sửa chữ</span>
        </button>
      </div>

      <div className="pdf-toolbar-separator" />

      {/* NHÓM 4: Điền đơn & Ký tên (Sign, Stamp, Symbols) */}
      <div className="pdf-toolbar-group">
        <button
          className="pdf-tool-btn"
          title="Ký tên điện tử (Vẽ tay, nạp ảnh, chữ ký mẫu)"
          onClick={() => onOpenSignatureModal('draw')}
          disabled={!hasDoc}
        >
          <FileSignature size={16} color="#0284c7" />
          <span className="pdf-tool-label">Ký tên</span>
        </button>

        <button
          className="pdf-tool-btn"
          title="Đóng con dấu doanh nghiệp (ĐÃ DUYỆT, BẢO MẬT, BẢN GỐC...)"
          onClick={() => onOpenSignatureModal('stamp')}
          disabled={!hasDoc}
        >
          <Stamp size={16} color="#dc2626" />
          <span className="pdf-tool-label">Con dấu</span>
        </button>

        {/* Ký hiệu nhanh (Tick, X, Ngày) */}
        <div className="pdf-tool-dropdown-wrap">
          <button
            className="pdf-tool-btn has-dropdown"
            title="Ký hiệu nhanh điền đơn"
            onClick={() => setSymbolMenuOpen((prev) => !prev)}
            disabled={!hasDoc}
          >
            <Check size={16} color="#16a34a" />
            <span className="pdf-tool-label">Ký hiệu</span>
            <ChevronDown size={11} className="pdf-chevron" />
          </button>

          {symbolMenuOpen && (
            <div className="pdf-tool-popup-menu">
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onInsertQuickSymbol('check')
                  setSymbolMenuOpen(false)
                }}
              >
                <Check size={14} color="#16a34a" />
                <span>Dấu tick xanh (✓)</span>
              </button>
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onInsertQuickSymbol('cross')
                  setSymbolMenuOpen(false)
                }}
              >
                <XIcon size={14} color="#ef4444" />
                <span>Dấu X đỏ (✕)</span>
              </button>
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onInsertQuickSymbol('date')
                  setSymbolMenuOpen(false)
                }}
              >
                <Calendar size={14} color="#6366f1" />
                <span>Ngày tháng hôm nay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pdf-toolbar-spacer" />

      {/* NHÓM 5: Thao tác tiện ích bên phải (Undo, Redo, Search, More) */}
      <div className="pdf-toolbar-group right">
        <button
          className="pdf-tool-btn icon-only"
          title="Hoàn tác (Ctrl+Z)"
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 size={16} />
        </button>

        <button
          className="pdf-tool-btn icon-only"
          title="Làm lại (Ctrl+Y)"
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo2 size={16} />
        </button>

        <button
          className="pdf-tool-btn icon-only"
          title="Tìm kiếm văn bản (Ctrl+F)"
          onClick={onToggleSearch}
          disabled={!hasDoc}
        >
          <Search size={16} />
        </button>

        {/* Nút Thêm... */}
        <div className="pdf-tool-dropdown-wrap">
          <button
            className="pdf-tool-btn has-dropdown"
            title="Thao tác nâng cao"
            onClick={() => setMoreMenuOpen((prev) => !prev)}
            disabled={!hasDoc}
          >
            <Sparkles size={15} color="#8b5cf6" />
            <span className="pdf-tool-label">Tiện ích</span>
            <ChevronDown size={11} className="pdf-chevron" />
          </button>

          {moreMenuOpen && (
            <div className="pdf-tool-popup-menu right-aligned">
              <button
                className="pdf-popup-item"
                onClick={() => {
                  onOpenWatermarkModal()
                  setMoreMenuOpen(false)
                }}
              >
                <Droplet size={14} color="#0284c7" />
                <span>Đóng dấu Watermark</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
