/**
 * PdfViewer — Render PDF pages bằng pdfjs-dist trên canvas với giao diện Studio
 * Đổ bóng đa tầng (ambient paper shadow), badge số trang nổi, chế độ Bàn tay kéo cuộn (Pan mode),
 * và Context Menu chuột phải trên trang.
 *
 * FIX: Sử dụng pdfDocReady counter state để đảm bảo render được kích hoạt
 *      sau khi PDF document hoàn tất việc giải mã (async), giải quyết race condition
 *      khi file lớn từ Electron IPC cần nhiều thời gian decode.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Trash2, Move, Sparkles } from 'lucide-react'
import { usePdfStore } from '../../stores/pdfTools.store'
import { PdfContextMenu } from './PdfContextMenu'
import { pdfjsLib, getSharedPdfDoc } from '../../utils/pdfConfig'

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
  // Quản lý RenderTask dở dang và tỉ lệ scale đã render của từng trang
  const renderTasksRef = useRef<Map<number, any>>(new Map())
  const renderedScaleRef = useRef<Map<number, number>>(new Map())
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  // Counter tăng mỗi khi PDF doc tải xong → kích hoạt re-render effect
  const [pdfDocReady, setPdfDocReady] = useState(0)

  // Dragging & Resizing active annotation
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    isResizing: string | null
    startX: number
    startY: number
    initX: number
    initY: number
    initW: number
    initH: number
  } | null>(null)

  const handleAnnMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!activeAnnotation) return
    setDragState({
      isDragging: true,
      isResizing: null,
      startX: e.clientX,
      startY: e.clientY,
      initX: activeAnnotation.x,
      initY: activeAnnotation.y,
      initW: activeAnnotation.width,
      initH: activeAnnotation.height
    })
  }

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation()
    if (!activeAnnotation) return
    setDragState({
      isDragging: false,
      isResizing: handle,
      startX: e.clientX,
      startY: e.clientY,
      initX: activeAnnotation.x,
      initY: activeAnnotation.y,
      initW: activeAnnotation.width,
      initH: activeAnnotation.height
    })
  }

  useEffect(() => {
    if (!dragState || !activeAnnotation) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX
      const dy = e.clientY - dragState.startY

      if (dragState.isDragging) {
        onUpdateAnnotation?.({
          ...activeAnnotation,
          x: Math.max(0, dragState.initX + dx),
          y: Math.max(0, dragState.initY + dy)
        })
      } else if (dragState.isResizing) {
        let newW = dragState.initW
        let newH = dragState.initH
        let newX = dragState.initX
        let newY = dragState.initY

        if (dragState.isResizing.includes('e')) {
          newW = Math.max(40, dragState.initW + dx)
        }
        if (dragState.isResizing.includes('s')) {
          newH = Math.max(20, dragState.initH + dy)
        }
        if (dragState.isResizing.includes('w')) {
          const diff = Math.min(dx, dragState.initW - 40)
          newW = dragState.initW - diff
          newX = dragState.initX + diff
        }
        if (dragState.isResizing.includes('n')) {
          const diff = Math.min(dy, dragState.initH - 20)
          newH = dragState.initH - diff
          newY = dragState.initY + diff
        }

        onUpdateAnnotation?.({
          ...activeAnnotation,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
          width: newW,
          height: newH
        })
      }
    }

    const handleGlobalMouseUp = () => {
      setDragState(null)
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [dragState, activeAnnotation, onUpdateAnnotation])

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

  // ===== 1. Load PDF document qua Shared Cache =====
  useEffect(() => {
    if (!pdfBase64) {
      pdfDocRef.current = null
      renderTasksRef.current.forEach((t) => {
        try { t.cancel?.() } catch {}
      })
      renderTasksRef.current.clear()
      renderedScaleRef.current.clear()
      return
    }

    let cancelled = false

    const loadPdf = async () => {
      try {
        // Hủy bỏ các render task cũ
        renderTasksRef.current.forEach((t) => {
          try { t.cancel?.() } catch {}
        })
        renderTasksRef.current.clear()
        renderedScaleRef.current.clear()

        const pdfDoc = await getSharedPdfDoc(pdfBase64)
        if (cancelled) return

        pdfDocRef.current = pdfDoc
        // Kích hoạt re-render bằng cách tăng counter
        setPdfDocReady((c) => c + 1)
      } catch (err) {
        console.error('Lỗi load PDF document:', err)
      }
    }

    loadPdf()

    return () => {
      cancelled = true
      renderTasksRef.current.forEach((t) => {
        try { t.cancel?.() } catch {}
      })
      renderTasksRef.current.clear()
    }
  }, [pdfBase64])

  // Xóa cache scale khi thay đổi zoomLevel để vẽ lại theo độ phóng mới
  useEffect(() => {
    renderedScaleRef.current.clear()
  }, [zoomLevel])

  // ===== 2. Render a single page onto its canvas với Hủy Task dở dang & Cache Zoom =====
  const renderPage = useCallback(
    async (pageIndex: number) => {
      const pdfDoc = pdfDocRef.current
      if (!pdfDoc) return
      if (pageIndex < 0 || pageIndex >= pageCount) return

      const targetScale = zoomLevel / 100
      // Bỏ qua nếu trang này đã vẽ xong ở đúng tỉ lệ zoom hiện tại
      if (renderedScaleRef.current.get(pageIndex) === targetScale) {
        return
      }

      let canvas = canvasRefs.current.get(pageIndex)
      if (!canvas) {
        await new Promise((resolve) => setTimeout(resolve, 40))
        canvas = canvasRefs.current.get(pageIndex)
      }
      if (!canvas) return

      // Hủy renderTask dở dang trước đó nếu có cho trang này
      const activeTask = renderTasksRef.current.get(pageIndex)
      if (activeTask) {
        try {
          activeTask.cancel()
        } catch {}
        renderTasksRef.current.delete(pageIndex)
      }

      try {
        const page = await pdfDoc.getPage(pageIndex + 1)
        // Giới hạn max DPR = 1.5 để ngăn ngừa bùng nổ GPU VRAM trên màn hình 2K/4K/Retina
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
        const viewport = page.getViewport({ scale: targetScale * dpr })

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = `${viewport.width / dpr}px`
        canvas.style.height = `${viewport.height / dpr}px`

        const ctx = canvas.getContext('2d', { alpha: false })
        if (!ctx) return

        const renderTask = page.render({
          canvasContext: ctx,
          viewport
        })
        renderTasksRef.current.set(pageIndex, renderTask)

        await renderTask.promise
        renderedScaleRef.current.set(pageIndex, targetScale)
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Lỗi render trang ${pageIndex + 1}:`, err)
        }
      } finally {
        renderTasksRef.current.delete(pageIndex)
      }
    },
    [zoomLevel, pageCount]
  )

  // ===== 3. Trigger rendering ưu tiên trang hiện tại + trang lân cận =====
  useEffect(() => {
    if (!pdfDocRef.current || !pdfBase64 || pageCount === 0) return

    // Render trang hiện tại ngay lập tức, các trang kề bên sau 50ms
    renderPage(currentPage)
    const timer = setTimeout(() => {
      if (currentPage > 0) renderPage(currentPage - 1)
      if (currentPage < pageCount - 1) renderPage(currentPage + 1)
    }, 50)

    return () => clearTimeout(timer)
  }, [pdfBase64, pdfDocReady, zoomLevel, currentPage, viewMode, pageCount, renderPage])

  // ===== 4. IntersectionObserver cho lazy rendering (chỉ render trang trong viewport) =====
  useEffect(() => {
    if (viewMode !== 'page' || !containerRef.current || !pdfDocRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.pageIndex)
            if (!isNaN(idx)) {
              renderPage(idx)
            }
          }
        })
      },
      { root: containerRef.current, rootMargin: '200px 0px', threshold: 0.05 }
    )

    const pageElements = containerRef.current.querySelectorAll('[data-page-index]')
    pageElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [viewMode, pageCount, pdfDocReady, renderPage])

  // ===== 5. Scroll đến trang hiện tại khi thay đổi =====
  useEffect(() => {
    if (viewMode !== 'page') return
    const pageEl = containerRef.current?.querySelector(`[data-page-index="${currentPage}"]`)
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [currentPage, viewMode])

  // Set canvas ref
  const setCanvasRef = useCallback((pageIndex: number, el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(pageIndex, el)
    } else {
      canvasRefs.current.delete(pageIndex)
    }
  }, [])

  // ===== Pan Mode (Bàn tay kéo cuộn chuột) =====
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

  if (!pdfBase64 || pageCount === 0) return null

  if (viewMode === 'page') {
    return (
      <div
        ref={containerRef}
        className={`pdf-viewer-area ${panMode ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''} ${className || ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="pdf-viewer-inner">
          {Array.from({ length: pageCount }, (_, i) => {
            const pageInfo = pages[i]
            const baseW = pageInfo?.width || 595
            const baseH = pageInfo?.height || 842
            const isRotated = (pageInfo?.rotation || 0) % 180 !== 0
            const actualW = isRotated ? baseH : baseW
            const actualH = isRotated ? baseW : baseH
            const scale = zoomLevel / 100
            const displayW = Math.round(actualW * scale)
            const displayH = Math.round(actualH * scale)

            return (
              <motion.div
                key={i}
                className={`pdf-page-container ${currentPage === i ? 'current-page-focus' : ''}`}
                data-page-index={i}
                style={{
                  width: `${displayW}px`,
                  minHeight: `${displayH}px`,
                  aspectRatio: `${actualW} / ${actualH}`
                }}
                onClick={() => {
                  setCurrentPage(i)
                  if (activeAnnotation && activeAnnotation.pageIndex !== i) {
                    onUpdateAnnotation?.({
                      ...activeAnnotation,
                      pageIndex: i
                    })
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ x: e.clientX, y: e.clientY, pageIndex: i })
                }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
              {/* Badge số trang lơ lửng */}
              <div className="pdf-page-number-badge">
                <span>Trang {i + 1}</span>
                <span className="pdf-page-badge-dot" />
                <span className="opacity-70">{zoomLevel}%</span>
              </div>

              {/* Canvas trang PDF */}
              <canvas
                ref={(el) => setCanvasRef(i, el)}
                className="pdf-page-canvas"
              />

              {/* Lớp phủ tương tác Chữ ký & Con dấu (Annotation Overlay) */}
              {activeAnnotation && activeAnnotation.pageIndex === i && (
                <div
                  className="pdf-active-annotation-box"
                  style={{
                    left: `${activeAnnotation.x}px`,
                    top: `${activeAnnotation.y}px`,
                    width: `${activeAnnotation.width}px`,
                    height: `${activeAnnotation.height}px`
                  }}
                  onMouseDown={handleAnnMouseDown}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Floating Action Bar */}
                  <div className="pdf-ann-toolbar" onMouseDown={(e) => e.stopPropagation()}>
                    <span className="pdf-ann-tag">{activeAnnotation.label}</span>
                    <button
                      className="pdf-ann-btn apply"
                      onClick={() => onApplyAnnotation?.(activeAnnotation)}
                      title="Áp dụng vào tài liệu (Cố định vĩnh viễn)"
                    >
                      <Check size={13} />
                      <span>Áp dụng</span>
                    </button>
                    <button
                      className="pdf-ann-btn delete"
                      onClick={() => onUpdateAnnotation?.(null)}
                      title="Hủy bỏ"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Nội dung ảnh con dấu / chữ ký */}
                  {activeAnnotation.imageBase64 ? (
                    <img
                      src={activeAnnotation.imageBase64}
                      alt="Annotation"
                      className="pdf-ann-img"
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="pdf-ann-text"
                      style={{
                        fontSize: `${activeAnnotation.fontSize || 16}px`,
                        color: activeAnnotation.color
                          ? `rgb(${activeAnnotation.color.r}, ${activeAnnotation.color.g}, ${activeAnnotation.color.b})`
                          : '#000000'
                      }}
                    >
                      {activeAnnotation.text}
                    </div>
                  )}

                  {/* 4 Corner Resize Handles */}
                  <div className="pdf-ann-handle nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                  <div className="pdf-ann-handle ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                  <div className="pdf-ann-handle sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                  <div className="pdf-ann-handle se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
                </div>
              )}
            </motion.div>
            )
          })}
        </div>

        {/* Context Menu Chuột phải trên trang */}
        <AnimatePresence>
          {contextMenu && (
            <PdfContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              pageIndex={contextMenu.pageIndex}
              onClose={() => setContextMenu(null)}
              onRotate={(deg) => onRotatePages && onRotatePages(deg)}
              onDelete={() => onDeletePages && onDeletePages()}
              onExtract={() => onExtractPages && onExtractPages()}
              onPreview={() => setCurrentPage(contextMenu.pageIndex)}
            />
          )}
        </AnimatePresence>
      </div>
    )
  }

  return null
}
