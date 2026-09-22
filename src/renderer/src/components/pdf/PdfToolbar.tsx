/**
 * PdfToolbar — Thanh công cụ PDF giống Foxit/Adobe
 * Navigation, Zoom, Rotate, Delete, Split, Merge, Save
 */

import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Trash2,
  Scissors,
  Merge,
  Save,
  FolderOpen,
  Grid3X3,
  FileText,
  Undo2,
  Download,
  Check
} from 'lucide-react'
import { usePdfStore } from '../../stores/pdfTools.store'
import { useState } from 'react'

interface PdfToolbarProps {
  onOpenFile: () => void
  onSaveFile: () => void
  onDeletePages: () => void
  onRotatePages: (degrees: number) => void
  onMerge: () => void
  onSplit: () => void
  onExtractPages: () => void
}

export function PdfToolbar({
  onOpenFile,
  onSaveFile,
  onDeletePages,
  onRotatePages,
  onMerge,
  onSplit,
  onExtractPages
}: PdfToolbarProps) {
  const {
    pageCount,
    currentPage,
    zoomLevel,
    viewMode,
    selectedPages,
    canUndo,
    setCurrentPage,
    setZoomLevel,
    zoomIn,
    zoomOut,
    setViewMode,
    undo,
    pdfBase64
  } = usePdfStore()

  const [pageInput, setPageInput] = useState('')
  const hasPdf = !!pdfBase64
  const hasSelection = selectedPages.length > 0

  const handlePageInputSubmit = () => {
    const num = parseInt(pageInput, 10)
    if (!isNaN(num) && num >= 1 && num <= pageCount) {
      setCurrentPage(num - 1)
    }
    setPageInput('')
  }

  return (
    <div className="pdf-toolbar">
      {/* File Actions */}
      <div className="pdf-toolbar-group">
        <button className="pdf-btn pdf-btn-sm pdf-btn-icon" onClick={onOpenFile} title="Mở file PDF">
          <FolderOpen size={16} />
        </button>
        {hasPdf && (
          <button className="pdf-btn pdf-btn-sm pdf-btn-icon" onClick={onSaveFile} title="Lưu PDF">
            <Save size={16} />
          </button>
        )}
        <button className="pdf-btn pdf-btn-sm pdf-btn-icon" onClick={onMerge} title="Ghép nhiều PDF">
          <Merge size={16} />
        </button>
      </div>

      {hasPdf && (
        <>
          <div className="pdf-toolbar-separator" />

          {/* Page Navigation */}
          <div className="pdf-toolbar-group">
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 0}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>

            <input
              className="pdf-page-input"
              type="text"
              value={pageInput || (currentPage + 1).toString()}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePageInputSubmit()}
              onBlur={handlePageInputSubmit}
              title="Nhập số trang"
            />
            <span className="pdf-toolbar-label">/ {pageCount}</span>

            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= pageCount - 1}
              title="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="pdf-toolbar-separator" />

          {/* Zoom */}
          <div className="pdf-toolbar-group">
            <button className="pdf-btn pdf-btn-sm pdf-btn-icon" onClick={zoomOut} title="Thu nhỏ">
              <ZoomOut size={16} />
            </button>
            <span className="pdf-zoom-display">{zoomLevel}%</span>
            <button className="pdf-btn pdf-btn-sm pdf-btn-icon" onClick={zoomIn} title="Phóng to">
              <ZoomIn size={16} />
            </button>
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={() => setZoomLevel(100)}
              title="Vừa chiều rộng"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <div className="pdf-toolbar-separator" />

          {/* View Mode */}
          <div className="pdf-toolbar-group">
            <button
              className={`pdf-btn pdf-btn-sm pdf-btn-icon ${viewMode === 'page' ? 'pdf-btn-primary' : ''}`}
              onClick={() => setViewMode('page')}
              title="Xem trang"
            >
              <FileText size={16} />
            </button>
            <button
              className={`pdf-btn pdf-btn-sm pdf-btn-icon ${viewMode === 'thumbnail' ? 'pdf-btn-primary' : ''}`}
              onClick={() => setViewMode('thumbnail')}
              title="Xem dạng lưới"
            >
              <Grid3X3 size={16} />
            </button>
          </div>

          <div className="pdf-toolbar-separator" />

          {/* Page Actions */}
          <div className="pdf-toolbar-group">
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={() => onRotatePages(90)}
              title="Xoay 90° theo chiều kim đồng hồ"
            >
              <RotateCw size={16} />
            </button>
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={onDeletePages}
              disabled={!hasSelection && pageCount <= 1}
              title={hasSelection ? `Xóa ${selectedPages.length} trang đã chọn` : 'Xóa trang hiện tại'}
            >
              <Trash2 size={16} />
            </button>
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={onSplit}
              disabled={pageCount <= 1}
              title="Tách PDF"
            >
              <Scissors size={16} />
            </button>
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={onExtractPages}
              disabled={!hasSelection}
              title={hasSelection ? `Trích xuất ${selectedPages.length} trang` : 'Chọn trang để trích xuất'}
            >
              <Download size={16} />
            </button>
          </div>

          <div className="pdf-toolbar-separator" />

          {/* Undo */}
          <div className="pdf-toolbar-group">
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-icon"
              onClick={undo}
              disabled={!canUndo}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
          </div>

          {/* Selection info */}
          {hasSelection && (
            <>
              <div className="pdf-toolbar-separator" />
              <div className="pdf-toolbar-group">
                <span className="pdf-toolbar-label" style={{ color: 'var(--accent)', fontWeight: 600 }}>
                  <Check size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {selectedPages.length} trang đã chọn
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
