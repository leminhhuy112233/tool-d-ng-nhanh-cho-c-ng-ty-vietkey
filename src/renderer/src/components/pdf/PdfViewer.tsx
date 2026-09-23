/**
 * PdfViewer — Hệ thống Studio Canvas hiển thị PDF hiệu năng cao (Anti-Lag Virtualization)
 * Tích hợp:
 * - Động cơ ảo hóa (VirtualScrollEngine) với Binary Search O(log N) cho trang đa kích thước
 * - Hàng đợi render ưu tiên (RenderQueue) tự động HỦY các tác vụ của trang trôi ra khỏi màn hình
 * - Quản lý ngân sách RAM qua LRU Cache (RenderCache) dọn sạch VRAM trang xa
 * - Tách riêng lớp PDF Canvas và Editor Overlay
 * - Kéo thả đối tượng 60 FPS sử dụng phần cứng GPU CSS Translate3D
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Trash2, Move, Sparkles } from 'lucide-react'
import { usePdfStore } from '../../stores/pdfTools.store'
import { PdfContextMenu } from './PdfContextMenu'
import { PdfContextualToolbar } from './PdfContextualToolbar'
import { EditorObjectOverlay } from './objects/EditorObjectOverlay'
import { useEditorObjectsStore } from '../../stores/pdfEditorObjects.store'
import { pdfjsLib, getSharedPdfDoc } from '../../utils/pdfConfig'
import { PageLayoutManager } from '../../core/virtualization/PageLayoutManager'
import { computeVisibleRange, VisibleRange } from '../../core/virtualization/VirtualScrollEngine'
import { RenderManager } from '../../core/render/RenderManager'
import { RenderPriority } from '../../core/render/RenderQueue'

export interface ActiveAnnotation {
  id: string
  type: 'image' | 'text'
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  imageBase64?: string
  text?: string
  fontSize?: number
  color?: { r: number; g: number; b: number }
  label: string
}

interface PdfViewerProps {
  className?: string
  onRotatePages?: (degrees: number) => void
  onDeletePages?: () => void
  onExtractPages?: () => void
  activeAnnotation?: ActiveAnnotation | null
  onUpdateAnnotation?: (ann: ActiveAnnotation | null) => void
  onApplyAnnotation?: (ann: ActiveAnnotation) => void
}

// Singleton RenderManager duy nhất cho PdfViewer
const renderManager = new RenderManager(7, 2)

export function PdfViewer({
  className,
  onRotatePages,
  onDeletePages,
  onExtractPages,
  activeAnnotation,
  onUpdateAnnotation,
  onApplyAnnotation
}: PdfViewerProps) {
  const {
    pdfBase64,
    pageCount,
    pages,
    currentPage,
    zoomLevel,
    viewMode,
    panMode,
    setCurrentPage
  } = usePdfStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const annotationDomRef = useRef<HTMLDivElement>(null)

  // Khởi tạo PageLayoutManager tính toán kích thước động
  const layoutManager = useMemo(() => {
    const mgr = new PageLayoutManager(24)
    mgr.computeLayouts(pages, zoomLevel)
    return mgr
  }, [pages, zoomLevel])

  // Trạng thái dải trang hiển thị (Virtual Windowing)
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startIndex: 0,
    endIndex: Math.min(2, Math.max(0, pageCount - 1)),
    visibleIndices: Array.from({ length: Math.min(3, pageCount) }, (_, i) => i),
    currentVisiblePage: 0
  })

  // Pan / Hand Tool State
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0
  })

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    pageIndex: number
  } | null>(null)

  // 1. Tải và đồng bộ PDF Document Proxy
  useEffect(() => {
    if (!pdfBase64) {
      pdfDocRef.current = null
      renderManager.clear()
      canvasRefs.current.clear()
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const pdfDoc = await getSharedPdfDoc(pdfBase64)
        if (cancelled) return
        pdfDocRef.current = pdfDoc
        renderManager.setDocument(pdfDoc)
        // Trigger lại tính toán cửa sổ hiển thị
        updateVirtualWindow()
      } catch (err) {
        console.error('Lỗi nạp PDF document cho PdfViewer:', err)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [pdfBase64])

  // 2. Tính toán dải trang hiển thị với requestAnimationFrame throttle
  const updateVirtualWindow = useCallback(() => {
    if (!containerRef.current) return
    const scrollTop = containerRef.current.scrollTop
    const viewportHeight = containerRef.current.clientHeight || 800

    const range = computeVisibleRange(
      layoutManager.getOffsets(),
      layoutManager.getAllLayouts(),
      scrollTop,
      viewportHeight,
      1, // Overscan trước 1 trang
      2  // Overscan sau 2 trang
    )

    setVisibleRange(range)

    // Cập nhật trang hiện tại nếu khác
    if (range.currentVisiblePage !== currentPage && range.currentVisiblePage < pageCount) {
      setCurrentPage(range.currentVisiblePage)
    }

    // Thông báo cho RenderManager hủy ngay lập tức các job ngoài cửa sổ
    const activeSet = new Set(range.visibleIndices)
    renderManager.updateVisibleWindow(activeSet)
    renderManager.getCache().retainOnly(activeSet)
  }, [layoutManager, currentPage, pageCount, setCurrentPage])

  // Lắng nghe sự kiện cuộn với rAF (tối đa 1 lần xử lý per frame)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateVirtualWindow()
          ticking = false
        })
        ticking = true
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY < 0 ? 10 : -10
        const currentZoom = usePdfStore.getState().zoomLevel
        const newZoom = Math.min(400, Math.max(25, currentZoom + delta))
        usePdfStore.getState().setZoomLevel(newZoom)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('wheel', handleWheel, { passive: false })
    // Tính toán ban đầu
    updateVirtualWindow()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [updateVirtualWindow])

  // Lắng nghe phím Space để tạm thời kích hoạt Pan Hand tool
  useEffect(() => {
    let wasPan = false
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        if (!usePdfStore.getState().panMode) {
          wasPan = true
          usePdfStore.getState().setPanMode(true)
        }
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && wasPan) {
        usePdfStore.getState().setPanMode(false)
        wasPan = false
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 3. Render các trang trong visibleRange bằng RenderManager
  useEffect(() => {
    if (!pdfDocRef.current || visibleRange.visibleIndices.length === 0) return

    const scale = zoomLevel / 100

    for (const idx of visibleRange.visibleIndices) {
      const canvas = canvasRefs.current.get(idx)
      if (canvas) {
        // Trang hiện tại có độ ưu tiên cao nhất (100), các trang khác trong cửa sổ (80)
        const priority = idx === currentPage ? RenderPriority.CURRENT : RenderPriority.VISIBLE
        renderManager.requestRender(idx, scale, canvas, priority)
      }
    }
  }, [visibleRange, zoomLevel, currentPage])

  // 4. Scroll đến trang được chỉ định từ HUD / Sidebar
  useEffect(() => {
    if (viewMode !== 'page' || !containerRef.current) return
    const layout = layoutManager.getLayout(currentPage)
    if (layout) {
      const targetScroll = layout.offsetTop - 12
      // Chỉ cuộn nếu chênh lệch đáng kể (tránh giật cuộn vòng lặp)
      if (Math.abs(containerRef.current.scrollTop - targetScroll) > 100) {
        containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' })
      }
    }
  }, [currentPage, viewMode, layoutManager])

  // 5. Pan / Hand Mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panMode || !containerRef.current) return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !containerRef.current) return
    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y
    containerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx
    containerRef.current.scrollTop = panStartRef.current.scrollTop - dy
  }

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false)
  }

  // Context Menu
  const handleContextMenu = (e: React.MouseEvent, pageIndex: number) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      pageIndex
    })
  }

  const setCanvasRef = useCallback((idx: number, el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(idx, el)
      // Khi canvas mount: yêu cầu render ngay
      const scale = zoomLevel / 100
      renderManager.requestRender(idx, scale, el, idx === currentPage ? RenderPriority.CURRENT : RenderPriority.VISIBLE)
    } else {
      canvasRefs.current.delete(idx)
    }
  }, [zoomLevel, currentPage])

  if (!pdfBase64 || pageCount === 0) return null

  const totalContentHeight = layoutManager.getTotalHeight()
  const maxContentWidth = layoutManager.getMaxWidth()

  return (
    <div
      ref={containerRef}
      className={`pdf-viewer-area ${panMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''} ${className || ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ overflowY: 'auto', position: 'relative', padding: '32px 0' }}
    >
      {/* Container tổng chứa chiều cao thật của cả tài liệu */}
      <div
        className="pdf-viewer-inner"
        style={{
          position: 'relative',
          height: `${totalContentHeight + 64}px`,
          width: '100%',
          minWidth: `${maxContentWidth + 64}px`
        }}
      >
        {/* Chỉ render các trang nằm trong cửa sổ hiển thị (Virtual Range) */}
        {visibleRange.visibleIndices.map((i) => {
          const layout = layoutManager.getLayout(i)
          if (!layout) return null

          const isCurrent = currentPage === i

          return (
            <div
              key={i}
              className={`pdf-page-container ${isCurrent ? 'current-page-focus' : ''}`}
              data-page-index={i}
              style={{
                position: 'absolute',
                top: `${layout.offsetTop + 32}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `${layout.displayWidth}px`,
                height: `${layout.displayHeight}px`,
                boxSizing: 'border-box'
              }}
              onClick={() => {
                setCurrentPage(i)
                useEditorObjectsStore.getState().setSelectedObjectId(null)
              }}
              onContextMenu={(e) => handleContextMenu(e, i)}
            >
              {/* LỚP 1: Bề mặt PDF Canvas */}
              <canvas
                ref={(el) => setCanvasRef(i, el)}
                className="pdf-page-canvas"
                style={{
                  width: `${layout.displayWidth}px`,
                  height: `${layout.displayHeight}px`,
                  display: 'block'
                }}
              />

              {/* LỚP 2, 3, 4: Editor Objects Overlay, Interaction & Selection Layer */}
              <EditorObjectOverlay
                pageIndex={i}
                displayWidth={layout.displayWidth}
                displayHeight={layout.displayHeight}
                zoomLevel={zoomLevel}
              />

              {/* Badge số trang góc trên */}
              <div className="pdf-page-badge" style={{ pointerEvents: 'none' }}>
                Trang {i + 1} / {pageCount}
              </div>
            </div>
          )
        })}
      </div>

      {/* Context Menu chuột phải trên trang */}
      {contextMenu && (
        <PdfContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          pageIndex={contextMenu.pageIndex}
          pageCount={pageCount}
          onRotateCw={() => onRotatePages?.(90)}
          onRotateCcw={() => onRotatePages?.(-90)}
          onDelete={() => onDeletePages?.()}
          onExtract={() => onExtractPages?.()}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
