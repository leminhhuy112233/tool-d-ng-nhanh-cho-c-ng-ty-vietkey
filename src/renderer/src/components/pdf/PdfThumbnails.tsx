/**
 * PdfThumbnails — Sidebar danh sách trang + Chế độ Dàn trang trực quan (Organize Light-Table)
 * Hỗ trợ kéo thả sắp xếp, multi-select, hover quick actions, right-click context menu,
 * và Floating Batch Action Bar khi có trang được chọn.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Check,
  GripVertical,
  RotateCw,
  RotateCcw,
  Trash2,
  Download,
  Scissors,
  X,
  FileSignature,
  FileText,
  Layers,
  Info,
  ExternalLink,
  Search,
  MoreVertical,
  Copy
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePdfStore } from '../../stores/pdfTools.store'
import { PdfContextMenu } from './PdfContextMenu'
import { pdfjsLib, getSharedPdfDoc } from '../../utils/pdfConfig'

const SIDEBAR_THUMB_SCALE = 0.15
const GRID_THUMB_SCALE = 0.25

// ===== 1. SIDEBAR THUMBNAILS & DRAWER =====
interface SidebarProps {
  onDeletePage?: (index: number) => void
  onRotatePage?: (index: number, degrees: number) => void
  onExtractPage?: (index: number) => void
  onDuplicatePage?: (index: number) => void
}

export function PdfSidebarThumbnails({ onDeletePage, onRotatePage, onExtractPage, onDuplicatePage }: SidebarProps) {
  const {
    pdfBase64,
    pageCount,
    currentPage,
    setCurrentPage,
    selectedPages,
    togglePageSelect,
    sidebarOpen,
    sidebarTab,
    setSidebarTab,
    fileName,
    fileSize
  } = usePdfStore()

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderedThumbsRef = useRef<Set<number>>(new Set())
  const thumbTasksRef = useRef<Map<number, any>>(new Map())
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    pageIndex: number
  } | null>(null)

  const [thumbDocReady, setThumbDocReady] = useState(0)
  const [pageFilter, setPageFilter] = useState('')
  const [activeCardMenu, setActiveCardMenu] = useState<number | null>(null)

  // Đóng menu card khi click ra ngoài
  useEffect(() => {
    const handleGlobalClick = () => setActiveCardMenu(null)
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  // Load PDF document qua Shared Cache
  useEffect(() => {
    if (!pdfBase64) {
      pdfDocRef.current = null
      renderedThumbsRef.current.clear()
      thumbTasksRef.current.forEach((t) => {
        try { t.cancel?.() } catch {}
      })
      thumbTasksRef.current.clear()
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        renderedThumbsRef.current.clear()
        thumbTasksRef.current.forEach((t) => {
          try { t.cancel?.() } catch {}
        })
        thumbTasksRef.current.clear()

        const pdfDoc = await getSharedPdfDoc(pdfBase64)
        if (cancelled) return

        pdfDocRef.current = pdfDoc
        setThumbDocReady((c) => c + 1)
      } catch (err) {
        console.error('Lỗi load PDF cho thumbnails sidebar:', err)
      }
    }

    load()
    return () => {
      cancelled = true
      thumbTasksRef.current.forEach((t) => {
        try { t.cancel?.() } catch {}
      })
      thumbTasksRef.current.clear()
    }
  }, [pdfBase64])

  const renderThumb = useCallback(async (pageIndex: number) => {
    const pdfDoc = pdfDocRef.current
    if (!pdfDoc || pageIndex < 0 || pageIndex >= pdfDoc.numPages) return
    if (renderedThumbsRef.current.has(pageIndex)) return

    let canvas = canvasRefs.current.get(pageIndex)
    if (!canvas) {
      await new Promise((resolve) => setTimeout(resolve, 40))
      canvas = canvasRefs.current.get(pageIndex)
    }
    if (!canvas) return

    // Hủy tác vụ cũ nếu có
    const activeTask = thumbTasksRef.current.get(pageIndex)
    if (activeTask) {
      try { activeTask.cancel() } catch {}
      thumbTasksRef.current.delete(pageIndex)
    }

    try {
      const page = await pdfDoc.getPage(pageIndex + 1)
      // Clamped scale để không ngốn RAM
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      const viewport = page.getViewport({ scale: SIDEBAR_THUMB_SCALE * dpr })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`
      const ctx = canvas.getContext('2d', { alpha: false })
      if (ctx) {
        const task = page.render({ canvasContext: ctx, viewport })
        thumbTasksRef.current.set(pageIndex, task)
        await task.promise
        renderedThumbsRef.current.add(pageIndex)
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        // ignore
      }
    } finally {
      thumbTasksRef.current.delete(pageIndex)
    }
  }, [])

  // Lazy IntersectionObserver cho Sidebar Thumbnails: chỉ render thẻ khi cuộn tới
  useEffect(() => {
    if (!sidebarOpen || sidebarTab !== 'thumbnails' || !pdfDocRef.current || pageCount === 0) return

    // Render trang hiện tại trước
    renderThumb(currentPage)

    const container = scrollContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.thumbIndex)
            if (!isNaN(idx)) {
              renderThumb(idx)
            }
          }
        })
      },
      { root: container, rootMargin: '100px 0px', threshold: 0.05 }
    )

    const cards = container.querySelectorAll('[data-thumb-index]')
    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [sidebarOpen, sidebarTab, thumbDocReady, pageCount, currentPage, renderThumb])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    setDragFrom(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(index)
  }

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (dragFrom === null || dragFrom === toIndex) {
      setDragFrom(null)
      setDragOver(null)
      return
    }

    const { pdfBase64: currentBase64, pushUndo, updatePdfData } = usePdfStore.getState()
    if (!currentBase64) return

    pushUndo()
    const newOrder = Array.from({ length: pageCount }, (_, i) => i)
    const [moved] = newOrder.splice(dragFrom, 1)
    newOrder.splice(toIndex, 0, moved)

    try {
      const result = await window.api?.pdfReorderPages(currentBase64, newOrder)
      if (result?.base64 && result?.pages) {
        updatePdfData(result.base64, result.pages)
      }
    } catch (err) {
      console.error('Lỗi sắp xếp trang:', err)
    }

    setDragFrom(null)
    setDragOver(null)
  }

  if (!pdfBase64 || pageCount === 0 || !sidebarOpen) return null

  return (
    <aside className="pdf-sidebar-container">
      {/* Mini tab header */}
      <div className="pdf-sidebar-tabs">
        <button
          className={`pdf-sidebar-tab-btn ${sidebarTab === 'thumbnails' ? 'active' : ''}`}
          onClick={() => setSidebarTab('thumbnails')}
          title="Xem trang thu nhỏ"
        >
          <Layers size={14} />
          <span>Trang ({pageCount})</span>
        </button>
        <button
          className={`pdf-sidebar-tab-btn ${sidebarTab === 'signatures' ? 'active' : ''}`}
          onClick={() => setSidebarTab('signatures')}
          title="Kho chữ ký & con dấu mẫu"
        >
          <FileSignature size={14} />
          <span>Chữ ký</span>
        </button>
        <button
          className={`pdf-sidebar-tab-btn ${sidebarTab === 'info' ? 'active' : ''}`}
          onClick={() => setSidebarTab('info')}
          title="Thông tin tài liệu"
        >
          <Info size={14} />
          <span>Tài liệu</span>
        </button>
      </div>

      {/* Tab 1: Danh sách Thumbnail */}
      {sidebarTab === 'thumbnails' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Ô tìm kiếm / nhảy trang nhanh */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Đi đến trang... (VD: 5)"
                value={pageFilter}
                onChange={(e) => {
                  setPageFilter(e.target.value)
                  const num = parseInt(e.target.value, 10)
                  if (!isNaN(num) && num >= 1 && num <= pageCount) {
                    setCurrentPage(num - 1)
                  }
                }}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '5px 8px 5px 28px',
                  fontSize: '12px',
                  color: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div ref={scrollContainerRef} className="pdf-sidebar-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {Array.from({ length: pageCount }, (_, i) => {
              const isCurrent = currentPage === i
              const isSelected = selectedPages.includes(i)
              const isDropTarget = dragOver === i

              return (
                <div
                  key={i}
                  data-thumb-index={i}
                  className={`pdf-thumb-card ${isCurrent ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drag-over' : ''}`}
                  onClick={() => setCurrentPage(i)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMenu({ x: e.clientX, y: e.clientY, pageIndex: i })
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragLeave={() => setDragOver(null)}
                  style={{ position: 'relative' }}
                >
                  {/* Header card: Checkbox + Grip */}
                  <div className="pdf-thumb-header">
                    <div
                      className={`pdf-thumb-checkbox ${isSelected ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        togglePageSelect(i)
                      }}
                      title={isSelected ? 'Hủy chọn trang' : 'Chọn trang này'}
                    >
                      {isSelected && <Check size={11} color="white" />}
                    </div>

                    <span className="pdf-thumb-num">Trang {i + 1}</span>

                    <div className="pdf-thumb-drag-handle" title="Kéo để đổi vị trí">
                      <GripVertical size={13} />
                    </div>
                  </div>

                  {/* Canvas Render */}
                  <div className="pdf-thumb-canvas-wrapper">
                    <canvas
                      ref={(el) => {
                        if (el) canvasRefs.current.set(i, el)
                      }}
                      className="pdf-thumb-canvas"
                    />

                    {/* Nút hành động nổi trên thumbnail khi rê chuột */}
                    <div className="pdf-thumb-hover-actions">
                      <button
                        className="pdf-thumb-mini-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onRotatePage) onRotatePage(i, 90)
                        }}
                        title="Xoay 90°"
                      >
                        <RotateCw size={12} />
                      </button>
                      <button
                        className="pdf-thumb-mini-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onDuplicatePage) onDuplicatePage(i)
                        }}
                        title="Nhân bản trang"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        className="pdf-thumb-mini-btn danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onDeletePage) onDeletePage(i)
                        }}
                        title="Xóa trang này"
                      >
                        <Trash2 size={12} />
                      </button>
                      <button
                        className="pdf-thumb-mini-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveCardMenu(activeCardMenu === i ? null : i)
                        }}
                        title="Tùy chọn khác"
                      >
                        <MoreVertical size={12} />
                      </button>
                    </div>

                    {/* Menu xổ xuống khi click ⋮ */}
                    {activeCardMenu === i && (
                      <div
                        className="pdf-thumb-card-dropdown"
                        style={{
                          position: 'absolute',
                          right: 8,
                          bottom: 8,
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '8px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                          zIndex: 40,
                          padding: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          minWidth: '130px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            fontSize: '11px',
                            color: '#e2e8f0',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onClick={() => {
                            onRotatePage?.(i, 90)
                            setActiveCardMenu(null)
                          }}
                        >
                          <RotateCw size={12} /> Xoay 90°
                        </button>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            fontSize: '11px',
                            color: '#e2e8f0',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onClick={() => {
                            onDuplicatePage?.(i)
                            setActiveCardMenu(null)
                          }}
                        >
                          <Copy size={12} /> Nhân bản trang
                        </button>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            fontSize: '11px',
                            color: '#e2e8f0',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onClick={() => {
                            onExtractPage?.(i)
                            setActiveCardMenu(null)
                          }}
                        >
                          <Download size={12} /> Trích xuất trang
                        </button>
                        <button
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 8px',
                            fontSize: '11px',
                            color: '#f87171',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          onClick={() => {
                            onDeletePage?.(i)
                            setActiveCardMenu(null)
                          }}
                        >
                          <Trash2 size={12} /> Xóa trang
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Kho chữ ký & Con dấu mẫu */}
      {sidebarTab === 'signatures' && (
        <div className="pdf-sidebar-empty-tab">
          <div className="pdf-signature-preview-box">
            <FileSignature size={28} className="text-cyan-400 opacity-80" />
            <span className="font-semibold text-sm">Kho chữ ký điện tử</span>
            <p className="text-xs text-muted-foreground text-center">
              Vào tab <strong>Điền & Ký</strong> trên Ribbon để vẽ chữ ký mới hoặc tải con dấu doanh nghiệp lên.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Thông tin tệp tin */}
      {sidebarTab === 'info' && (
        <div className="pdf-sidebar-info-tab">
          <div className="pdf-info-row">
            <span className="pdf-info-label">Tên tài liệu:</span>
            <span className="pdf-info-val truncate">{fileName || 'Tài liệu không tên'}</span>
          </div>
          <div className="pdf-info-row">
            <span className="pdf-info-label">Tổng số trang:</span>
            <span className="pdf-info-val">{pageCount} trang</span>
          </div>
          <div className="pdf-info-row">
            <span className="pdf-info-label">Dung lượng:</span>
            <span className="pdf-info-val">{fileSize || 'Không rõ'}</span>
          </div>
          <div className="pdf-info-row">
            <span className="pdf-info-label">Trạng thái:</span>
            <span className="pdf-info-val text-emerald-400">Sẵn sàng chỉnh sửa</span>
          </div>
        </div>
      )}

      {/* Context Menu Chuột phải */}
      <AnimatePresence>
        {contextMenu && (
          <PdfContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            pageIndex={contextMenu.pageIndex}
            onClose={() => setContextMenu(null)}
            onRotate={(deg) => onRotatePage && onRotatePage(contextMenu.pageIndex, deg)}
            onDelete={() => onDeletePage && onDeletePage(contextMenu.pageIndex)}
            onExtract={() => onExtractPage && onExtractPage(contextMenu.pageIndex)}
            onPreview={() => setCurrentPage(contextMenu.pageIndex)}
          />
        )}
      </AnimatePresence>
    </aside>
  )
}

// ===== 2. ORGANIZE PAGES LIGHT-TABLE (CHẾ ĐỘ DÀN TRANG TRỰC QUAN) =====
interface OrganizeProps {
  onRotatePages: (degrees: number) => void
  onDeletePages: () => void
  onExtractPages: () => void
  onSplit: () => void
}

export function PdfThumbnailGrid({
  onRotatePages,
  onDeletePages,
  onExtractPages,
  onSplit
}: OrganizeProps) {
  const {
    pdfBase64,
    pageCount,
    selectedPages,
    togglePageSelect,
    selectAllPages,
    clearSelection,
    setCurrentPage,
    setViewMode
  } = usePdfStore()

  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const renderedGridThumbsRef = useRef<Set<number>>(new Set())
  const gridTasksRef = useRef<Map<number, any>>(new Map())
  const gridContainerRef = useRef<HTMLDivElement>(null)

  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    pageIndex: number
  } | null>(null)

  const [gridDocReady, setGridDocReady] = useState(0)

  // Load PDF document
  useEffect(() => {
    if (!pdfBase64) {
      pdfDocRef.current = null
      renderedGridThumbsRef.current.clear()
      gridTasksRef.current.forEach((t) => {
        try { t.cancel?.() } catch {}
      })
      gridTasksRef.current.clear()
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        renderedGridThumbsRef.current.clear()
        gridTasksRef.current.forEach((t) => {
          try { t.cancel?.() } catch {}
        })
        gridTasksRef.current.clear()

        const pdfDoc = await getSharedPdfDoc(pdfBase64)
        if (cancelled) return

        pdfDocRef.current = pdfDoc
        setGridDocReady((c) => c + 1)
      } catch (err) {
        console.error('Lỗi load PDF cho grid thumbnails:', err)
      }
    }

    load()
    return () => {
      cancelled = true
      gridTasksRef.current.forEach((t) => {
        try { t.cancel?.() } catch {}
      })
      gridTasksRef.current.clear()
    }
  }, [pdfBase64])

  const renderGridThumb = useCallback(async (pageIndex: number) => {
    const pdfDoc = pdfDocRef.current
    if (!pdfDoc || pageIndex < 0 || pageIndex >= pdfDoc.numPages) return
    if (renderedGridThumbsRef.current.has(pageIndex)) return

    let canvas = canvasRefs.current.get(pageIndex)
    if (!canvas) {
      await new Promise((resolve) => setTimeout(resolve, 40))
      canvas = canvasRefs.current.get(pageIndex)
    }
    if (!canvas) return

    const activeTask = gridTasksRef.current.get(pageIndex)
    if (activeTask) {
      try { activeTask.cancel() } catch {}
      gridTasksRef.current.delete(pageIndex)
    }

    try {
      const page = await pdfDoc.getPage(pageIndex + 1)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      const viewport = page.getViewport({ scale: GRID_THUMB_SCALE * dpr })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`
      const ctx = canvas.getContext('2d', { alpha: false })
      if (ctx) {
        const task = page.render({ canvasContext: ctx, viewport })
        gridTasksRef.current.set(pageIndex, task)
        await task.promise
        renderedGridThumbsRef.current.add(pageIndex)
      }
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        // ignore
      }
    } finally {
      gridTasksRef.current.delete(pageIndex)
    }
  }, [])

  // Lazy IntersectionObserver cho Grid Thumbnails: chỉ render các thẻ nhìn thấy trên màn hình
  useEffect(() => {
    if (!pdfDocRef.current || pageCount === 0) return

    const container = gridContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.gridIndex)
            if (!isNaN(idx)) {
              renderGridThumb(idx)
            }
          }
        })
      },
      { root: null, rootMargin: '150px 0px', threshold: 0.05 }
    )

    const cards = container.querySelectorAll('[data-grid-index]')
    cards.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [gridDocReady, pageCount, renderGridThumb])

  const handleDoubleClick = (pageIndex: number) => {
    setCurrentPage(pageIndex)
    setViewMode('page')
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    setDragFrom(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(index)
  }

  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    if (dragFrom === null || dragFrom === toIndex) {
      setDragFrom(null)
      setDragOver(null)
      return
    }

    const { pdfBase64: currentBase64, pushUndo, updatePdfData } = usePdfStore.getState()
    if (!currentBase64) return

    pushUndo()
    const newOrder = Array.from({ length: pageCount }, (_, i) => i)
    const [moved] = newOrder.splice(dragFrom, 1)
    newOrder.splice(toIndex, 0, moved)

    try {
      const result = await window.api?.pdfReorderPages(currentBase64, newOrder)
      if (result?.base64 && result?.pages) {
        updatePdfData(result.base64, result.pages)
      }
    } catch (err) {
      console.error('Lỗi sắp xếp trang grid:', err)
    }

    setDragFrom(null)
    setDragOver(null)
  }

  const hasSelection = selectedPages.length > 0

  return (
    <div className="pdf-organize-container">
      {/* Header bar của chế độ dàn trang */}
      <div className="pdf-organize-top-bar">
        <div className="pdf-organize-title-group">
          <h3 className="pdf-organize-title">Dàn trang trực quan (Organize Mode)</h3>
          <span className="pdf-organize-sub">
            Kéo thả để đổi thứ tự trang • Nháy đúp vào trang để mở xem chi tiết
          </span>
        </div>

        <div className="pdf-organize-quick-actions">
          <button className="pdf-btn pdf-btn-sm pdf-btn-ghost" onClick={selectAllPages}>
            <Check size={14} /> Chọn tất cả ({pageCount})
          </button>
          {hasSelection && (
            <button className="pdf-btn pdf-btn-sm pdf-btn-ghost" onClick={clearSelection}>
              <X size={14} /> Hủy chọn ({selectedPages.length})
            </button>
          )}
        </div>
      </div>

      {/* Lưới các thẻ trang PDF */}
      <div ref={gridContainerRef} className="pdf-organize-grid">
        {Array.from({ length: pageCount }, (_, i) => {
          const isSelected = selectedPages.includes(i)
          const isDropTarget = dragOver === i

          return (
            <motion.div
              key={i}
              data-grid-index={i}
              className={`pdf-grid-card ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drag-over' : ''}`}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              onClick={() => togglePageSelect(i)}
              onDoubleClick={() => handleDoubleClick(i)}
              onContextMenu={(e) => {
                e.preventDefault()
                setContextMenu({ x: e.clientX, y: e.clientY, pageIndex: i })
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Checkbox */}
              <div className={`pdf-grid-card-checkbox ${isSelected ? 'checked' : ''}`}>
                {isSelected && <Check size={13} color="white" />}
              </div>

              {/* Số trang */}
              <div className="pdf-grid-card-badge">Trang {i + 1}</div>

              {/* Canvas Preview */}
              <div className="pdf-grid-canvas-box">
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(i, el)
                  }}
                  className="pdf-grid-canvas"
                />

                {/* Card hover action overlay */}
                <div className="pdf-grid-card-overlay">
                  <button
                    className="pdf-grid-overlay-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRotatePages(90)
                    }}
                    title="Xoay 90°"
                  >
                    <RotateCw size={14} />
                  </button>
                  <button
                    className="pdf-grid-overlay-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDoubleClick(i)
                    }}
                    title="Xem chi tiết"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 3. Floating Batch Action Bar (Thanh tác vụ hàng loạt nổi khi có trang được chọn) */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            className="pdf-batch-bar"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          >
            <div className="pdf-batch-badge">
              <Check size={14} className="text-cyan-400" />
              <span>Đã chọn {selectedPages.length} trang</span>
            </div>

            <div className="pdf-batch-separator" />

            <button
              className="pdf-batch-btn"
              onClick={() => onRotatePages(90)}
              title="Xoay các trang đã chọn"
            >
              <RotateCw size={15} />
              <span>Xoay 90°</span>
            </button>

            <button
              className="pdf-batch-btn"
              onClick={onExtractPages}
              title="Trích xuất các trang đã chọn thành file mới"
            >
              <Download size={15} />
              <span>Trích xuất</span>
            </button>

            <button
              className="pdf-batch-btn"
              onClick={onSplit}
              title="Tách tài liệu"
            >
              <Scissors size={15} />
              <span>Tách file</span>
            </button>

            <button
              className="pdf-batch-btn danger"
              onClick={onDeletePages}
              title="Xóa các trang đã chọn"
            >
              <Trash2 size={15} />
              <span>Xóa trang</span>
            </button>

            <div className="pdf-batch-separator" />

            <button
              className="pdf-batch-close-btn"
              onClick={clearSelection}
              title="Bỏ chọn tất cả"
            >
              <X size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu Chuột phải */}
      <AnimatePresence>
        {contextMenu && (
          <PdfContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            pageIndex={contextMenu.pageIndex}
            onClose={() => setContextMenu(null)}
            onRotate={(deg) => onRotatePages(deg)}
            onDelete={onDeletePages}
            onExtract={onExtractPages}
            onPreview={() => handleDoubleClick(contextMenu.pageIndex)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
