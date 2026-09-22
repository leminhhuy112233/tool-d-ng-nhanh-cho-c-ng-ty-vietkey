/**
 * PdfContextMenu — Menu ngữ cảnh chuột phải chuẩn Enterprise
 * Xuất hiện khi click chuột phải lên Thumbnail hoặc Trang PDF
 */

import { useEffect, useRef } from 'react'
import {
  RotateCw,
  RotateCcw,
  Trash2,
  Download,
  Copy,
  ArrowDownUp,
  Maximize2
} from 'lucide-react'
import { motion } from 'framer-motion'

interface PdfContextMenuProps {
  x: number
  y: number
  pageIndex: number
  onClose: () => void
  onRotate: (degrees: number) => void
  onDelete: () => void
  onExtract: () => void
  onDuplicate?: () => void
  onPreview?: () => void
}

export function PdfContextMenu({
  x,
  y,
  pageIndex,
  onClose,
  onRotate,
  onDelete,
  onExtract,
  onDuplicate,
  onPreview
}: PdfContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Đóng khi click ngoài menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // Giới hạn menu trong viewport
  const adjustedX = Math.min(x, window.innerWidth - 220)
  const adjustedY = Math.min(y, window.innerHeight - 260)

  return (
    <motion.div
      ref={menuRef}
      className="pdf-context-menu"
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.12 }}
    >
      <div className="pdf-context-menu-header">
        <span>Trang {pageIndex + 1}</span>
      </div>

      {onPreview && (
        <button
          className="pdf-context-menu-item"
          onClick={() => {
            onPreview()
            onClose()
          }}
        >
          <Maximize2 size={14} />
          <span>Xem chi tiết trang</span>
        </button>
      )}

      <button
        className="pdf-context-menu-item"
        onClick={() => {
          onRotate(90)
          onClose()
        }}
      >
        <RotateCw size={14} />
        <span>Xoay phải 90°</span>
        <span className="pdf-context-shortcut">R</span>
      </button>

      <button
        className="pdf-context-menu-item"
        onClick={() => {
          onRotate(-90)
          onClose()
        }}
      >
        <RotateCcw size={14} />
        <span>Xoay trái 90°</span>
      </button>

      <button
        className="pdf-context-menu-item"
        onClick={() => {
          onRotate(180)
          onClose()
        }}
      >
        <ArrowDownUp size={14} />
        <span>Lật ngược 180°</span>
      </button>

      <div className="pdf-context-menu-divider" />

      {onDuplicate && (
        <button
          className="pdf-context-menu-item"
          onClick={() => {
            onDuplicate()
            onClose()
          }}
        >
          <Copy size={14} />
          <span>Nhân bản trang</span>
        </button>
      )}

      <button
        className="pdf-context-menu-item"
        onClick={() => {
          onExtract()
          onClose()
        }}
      >
        <Download size={14} />
        <span>Trích xuất trang này</span>
      </button>

      <div className="pdf-context-menu-divider" />

      <button
        className="pdf-context-menu-item danger"
        onClick={() => {
          onDelete()
          onClose()
        }}
      >
        <Trash2 size={14} />
        <span>Xóa trang</span>
        <span className="pdf-context-shortcut">Del</span>
      </button>
    </motion.div>
  )
}
