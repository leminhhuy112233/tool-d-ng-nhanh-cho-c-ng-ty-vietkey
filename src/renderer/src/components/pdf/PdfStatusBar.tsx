/**
 * PdfStatusBar — Thanh trạng thái cố định ở đáy màn hình chuẩn Desktop
 * Chiều cao 30px, gồm Điều hướng trang, Bộ điều khiển Zoom và Trạng thái Lưu trữ tĩnh lặng.
 */

import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Circle
} from 'lucide-react'
import { usePdfStore } from '../../stores/pdfTools.store'

interface PdfStatusBarProps {
  onSaveFile?: () => void
}

const ZOOM_OPTIONS = [50, 75, 100, 125, 150, 200, 300]

export function PdfStatusBar({ onSaveFile }: PdfStatusBarProps) {
  const {
    pageCount,
    currentPage,
    setCurrentPage,
    zoomLevel,
    setZoomLevel,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
    hasChanges,
    fileName,
    pdfBase64
  } = usePdfStore()

  const [pageInput, setPageInput] = useState('')
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false)

  if (!pdfBase64 || pageCount === 0) return null

  const handlePageInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const p = parseInt(pageInput, 10)
      if (!isNaN(p) && p >= 1 && p <= pageCount) {
        setCurrentPage(p - 1)
      }
      setPageInput('')
    }
  }

  return (
    <div className="pdf-bottom-statusbar">
      {/* 1. Bên trái: Điều hướng trang */}
      <div className="pdf-statusbar-left">
        <button
          className="pdf-status-icon-btn"
          disabled={currentPage <= 0}
          onClick={() => setCurrentPage(currentPage - 1)}
          title="Trang trước (Phím mũi tên trái)"
        >
          <ChevronLeft size={15} />
        </button>

        <div className="pdf-status-page-indicator">
          <span>Trang</span>
          <input
            type="text"
            className="pdf-status-page-input"
            placeholder={(currentPage + 1).toString()}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={handlePageInputSubmit}
            onBlur={() => setPageInput('')}
            title="Nhập số trang rồi bấm Enter"
          />
          <span className="pdf-status-total">/ {pageCount}</span>
        </div>

        <button
          className="pdf-status-icon-btn"
          disabled={currentPage >= pageCount - 1}
          onClick={() => setCurrentPage(currentPage + 1)}
          title="Trang sau (Phím mũi tên phải)"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* 2. Ở giữa: Bộ điều khiển Thu phóng & Fit */}
      <div className="pdf-statusbar-center">
        <button className="pdf-status-icon-btn" onClick={zoomOut} title="Thu nhỏ (Ctrl + -)">
          <ZoomOut size={14} />
        </button>

        {/* Dropdown Preset Zoom */}
        <div className="pdf-status-zoom-wrap">
          <button
            className="pdf-status-zoom-btn"
            onClick={() => setZoomDropdownOpen((prev) => !prev)}
            title="Chọn tỉ lệ phóng to"
          >
            {zoomLevel}%
          </button>

          {zoomDropdownOpen && (
            <div className="pdf-status-zoom-menu">
              {ZOOM_OPTIONS.map((z) => (
                <button
                  key={z}
                  className={`pdf-status-zoom-option ${zoomLevel === z ? 'active' : ''}`}
                  onClick={() => {
                    setZoomLevel(z)
                    setZoomDropdownOpen(false)
                  }}
                >
                  <span>{z}%</span>
                  {zoomLevel === z && <Check size={12} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="pdf-status-icon-btn" onClick={zoomIn} title="Phóng to (Ctrl + +)">
          <ZoomIn size={14} />
        </button>

        <div className="pdf-statusbar-sep" />

        <button className="pdf-status-text-btn" onClick={fitWidth} title="Vừa chiều ngang màn hình">
          <Maximize2 size={13} />
          <span>Vừa chiều ngang</span>
        </button>

        <button className="pdf-status-text-btn" onClick={fitPage} title="Vừa toàn bộ trang">
          <span>Vừa trang</span>
        </button>
      </div>

      {/* 3. Bên phải: Trạng thái Lưu trữ tĩnh lặng (Subtle Save Status) */}
      <div className="pdf-statusbar-right">
        {hasChanges ? (
          <button
            className="pdf-status-save-chip unsaved"
            onClick={onSaveFile}
            title="Bấm để lưu tài liệu (Ctrl+S)"
          >
            <Circle size={8} fill="#f59e0b" color="#f59e0b" />
            <span>Chưa lưu</span>
          </button>
        ) : (
          <div className="pdf-status-save-chip saved" title="Tất cả thay đổi đã được lưu an toàn">
            <Check size={12} color="#10b981" />
            <span>Đã lưu</span>
          </div>
        )}
      </div>
    </div>
  )
}
