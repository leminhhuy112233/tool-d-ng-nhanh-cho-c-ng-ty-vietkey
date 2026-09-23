/**
 * PdfCommandPalette — Hộp tìm kiếm lệnh nhanh toàn cục (Ctrl + K)
 * Tìm kiếm nhanh bất kỳ tính năng nào trong ứng dụng kèm phím tắt và kích hoạt bằng Enter.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Command,
  X,
  Type,
  Image as ImageIcon,
  Square,
  Highlighter,
  PenTool,
  StickyNote,
  FileSignature,
  Stamp,
  RotateCw,
  Scissors,
  FileArchive,
  Lock,
  FileText,
  FileDown,
  Printer,
  Save,
  FolderOpen
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CommandItem {
  id: string
  title: string
  subtitle?: string
  shortcut?: string
  icon: any
  action: () => void
}

interface PdfCommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands: CommandItem[]
}

export function PdfCommandPalette({ isOpen, onClose, commands }: PdfCommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Lọc danh sách lệnh theo từ khóa
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true
    const q = query.toLowerCase().trim()
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))
    )
  })

  // Điều hướng bằng phím mũi tên lên/xuống và Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const target = filteredCommands[selectedIndex]
      if (target) {
        target.action()
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="pdf-command-palette-overlay" onClick={onClose}>
      <motion.div
        className="pdf-command-palette-box"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.96, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -20 }}
        transition={{ duration: 0.12 }}
      >
        {/* Header tìm kiếm */}
        <div className="pdf-command-input-row">
          <Search size={18} className="pdf-command-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="pdf-command-input"
            placeholder="Tìm kiếm lệnh, công cụ hoặc tài liệu... (ví dụ: chữ ký, nén, xoay)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <span className="pdf-command-esc-badge">ESC</span>
        </div>

        {/* Danh sách kết quả */}
        <div className="pdf-command-list">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={cmd.id}
                  className={`pdf-command-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    cmd.action()
                    onClose()
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="pdf-command-item-left">
                    <div className="pdf-command-icon-wrap">
                      <Icon size={16} />
                    </div>
                    <div className="pdf-command-info">
                      <span className="pdf-command-title">{cmd.title}</span>
                      {cmd.subtitle && <span className="pdf-command-subtitle">{cmd.subtitle}</span>}
                    </div>
                  </div>
                  {cmd.shortcut && <span className="pdf-command-shortcut">{cmd.shortcut}</span>}
                </div>
              )
            })
          ) : (
            <div className="pdf-command-empty">
              <span>Không tìm thấy lệnh phù hợp với "{query}"</span>
            </div>
          )}
        </div>

        {/* Footer phím tắt */}
        <div className="pdf-command-footer">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> để di chuyển
          </span>
          <span>
            <kbd>Enter</kbd> để thực thi
          </span>
          <span>
            <kbd>Esc</kbd> để đóng
          </span>
        </div>
      </motion.div>
    </div>
  )
}
