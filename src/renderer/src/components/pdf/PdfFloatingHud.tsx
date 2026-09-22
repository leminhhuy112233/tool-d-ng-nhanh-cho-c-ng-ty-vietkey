/**
 * PdfFloatingHud — Thanh điều khiển nổi kính mờ phong cách Apple / Figma / Canva
 * Đặt nổi ở đáy trung tâm màn hình, hỗ trợ Zoom, Navigation, Fit, Fullscreen
 */

import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Hand,
  MousePointer,
  Scan,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePdfStore } from '../../stores/pdfTools.store'

const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200]

export function PdfFloatingHud() {
  const {
    pageCount,
    currentPage,
    zoomLevel,
    setCurrentPage,
    zoomIn,
    zoomOut,
    setZoomLevel,
    fitWidth,
    fitPage,
    panMode,
    setPanMode,
    isHudVisible,
    pdfBase64
  } = usePdfStore()

  const [pageInput, setPageInput] = useState('')
  const [showZoomMenu, setShowZoomMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!pdfBase64 || !isHudVisible) return null

  const handlePageSubmit = () => {
    const num = parseInt(pageInput, 10)
    if (!isNaN(num) && num >= 1 && num <= pageCount) {
      setCurrentPage(num - 1)
    }
    setPageInput('')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <motion.div
      className="pdf-floating-hud"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* 1. Điều hướng trang */}
      <div className="pdf-hud-group">
        <button
          className="pdf-hud-btn"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 0}
          title="Trang trước (Phím mũi tên trái)"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="pdf-hud-page-indicator">
          <input
            className="pdf-hud-page-input"
            type="text"
            value={pageInput !== '' ? pageInput : (currentPage + 1).toString()}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
            onBlur={handlePageSubmit}
            onFocus={() => setPageInput('')}
            title="Nhập số trang và nhấn Enter"
          />
          <span className="pdf-hud-page-total">/ {pageCount}</span>
        </div>

        <button
          className="pdf-hud-btn"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= pageCount - 1}
          title="Trang sau (Phím mũi tên phải)"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="pdf-hud-separator" />

      {/* 2. Điều khiển Zoom */}
      <div className="pdf-hud-group relative">
        <button className="pdf-hud-btn" onClick={zoomOut} title="Thu nhỏ (Ctrl + -)">
          <ZoomOut size={16} />
        </button>

        {/* Nút % Zoom kích hoạt dropdown */}
        <div className="relative">
          <button
            className="pdf-hud-zoom-badge"
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            title="Chọn mức thu phóng nhanh"
          >
            {zoomLevel}%
          </button>

          {/* Menu chọn zoom presets */}
          <AnimatePresence>
            {showZoomMenu && (
              <motion.div
                className="pdf-hud-zoom-popover"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                {ZOOM_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    className={`pdf-hud-zoom-item ${zoomLevel === preset ? 'active' : ''}`}
                    onClick={() => {
                      setZoomLevel(preset)
                      setShowZoomMenu(false)
                    }}
                  >
                    <span>{preset}%</span>
                    {zoomLevel === preset && <Check size={14} />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="pdf-hud-btn" onClick={zoomIn} title="Phóng to (Ctrl + +)">
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="pdf-hud-separator" />

      {/* 3. Tự động căn chỉnh & Công cụ hỗ trợ */}
      <div className="pdf-hud-group">
        <button
          className={`pdf-hud-btn ${zoomLevel === 100 ? 'active' : ''}`}
          onClick={fitWidth}
          title="Căn vừa chiều rộng màn hình (Fit Width)"
        >
          <Scan size={16} />
        </button>

        <button
          className={`pdf-hud-btn ${panMode ? 'active' : ''}`}
          onClick={() => setPanMode(!panMode)}
          title={panMode ? 'Đổi sang con trỏ chọn' : 'Bật bàn tay kéo trang (Phím cách / H)'}
        >
          {panMode ? <Hand size={16} /> : <MousePointer size={16} />}
        </button>

        <button
          className={`pdf-hud-btn ${isFullscreen ? 'active' : ''}`}
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F11)'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </motion.div>
  )
}
