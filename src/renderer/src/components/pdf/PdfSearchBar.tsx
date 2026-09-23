/**
 * PdfSearchBar — Thanh tìm kiếm văn bản nổi phong cách trình duyệt / Figma
 * Phím tắt kích hoạt: Ctrl + F
 * Duyệt toàn bộ văn bản trong PDF bằng pdfjs-dist, đếm kết quả và nhảy trang.
 */

import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronUp, ChevronDown, X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { pdfjsLib, getSharedPdfDoc } from '../../utils/pdfConfig'

export interface SearchMatch {
  pageIndex: number
  text: string
}

interface PdfSearchBarProps {
  pdfBase64: string | null
  pageCount: number
  onJumpToPage: (pageIndex: number) => void
  onClose: () => void
}

export function PdfSearchBar({
  pdfBase64,
  pageCount,
  onJumpToPage,
  onClose
}: PdfSearchBarProps) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<SearchMatch[]>([])
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(-1)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Tự động focus vào ô tìm kiếm khi mở
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Tìm kiếm khi query thay đổi (debounce 300ms)
  useEffect(() => {
    if (!query.trim() || !pdfBase64) {
      setMatches([])
      setCurrentMatchIdx(-1)
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const doc = await getSharedPdfDoc(pdfBase64)
        const cleanQuery = query.trim().toLowerCase()
        const foundMatches: SearchMatch[] = []

        for (let i = 0; i < doc.numPages; i++) {
          const page = await doc.getPage(i + 1)
          const textContent = await page.getTextContent()
          const fullText = textContent.items
            .map((item: any) => item.str || '')
            .join(' ')
            .toLowerCase()

          // Kiểm tra xem trang có chứa từ khóa không
          if (fullText.includes(cleanQuery)) {
            // Đếm số lần xuất hiện trên trang
            let pos = fullText.indexOf(cleanQuery)
            while (pos !== -1) {
              foundMatches.push({
                pageIndex: i,
                text: query.trim()
              })
              pos = fullText.indexOf(cleanQuery, pos + cleanQuery.length)
            }
          }
        }

        setMatches(foundMatches)
        if (foundMatches.length > 0) {
          setCurrentMatchIdx(0)
          onJumpToPage(foundMatches[0].pageIndex)
        } else {
          setCurrentMatchIdx(-1)
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm text PDF:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, pdfBase64, onJumpToPage])

  const handleNext = () => {
    if (matches.length === 0) return
    const nextIdx = (currentMatchIdx + 1) % matches.length
    setCurrentMatchIdx(nextIdx)
    onJumpToPage(matches[nextIdx].pageIndex)
  }

  const handlePrev = () => {
    if (matches.length === 0) return
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length
    setCurrentMatchIdx(prevIdx)
    onJumpToPage(matches[prevIdx].pageIndex)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        handlePrev()
      } else {
        handleNext()
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        top: '68px',
        right: '24px',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '6px 12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        minWidth: '320px'
      }}
    >
      <Search size={16} color="var(--primary)" />

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tìm từ khóa trong tài liệu..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          fontSize: '13px',
          color: 'var(--foreground)',
          fontFamily: "'Inter', sans-serif"
        }}
      />

      {/* Loading hoặc Match Counter */}
      {isSearching ? (
        <Loader2 size={14} className="animate-spin" color="var(--primary)" />
      ) : query.trim() !== '' ? (
        <span
          style={{
            fontSize: '11.5px',
            color: matches.length > 0 ? 'var(--muted-foreground)' : 'var(--destructive)',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          {matches.length > 0
            ? `${currentMatchIdx + 1} / ${matches.length} kết quả (Trang ${matches[currentMatchIdx].pageIndex + 1})`
            : 'Không tìm thấy'}
        </span>
      ) : null}

      {/* Prev / Next buttons */}
      <button
        onClick={handlePrev}
        disabled={matches.length <= 1}
        className="pdf-btn pdf-btn-ghost pdf-btn-icon"
        style={{ width: '26px', height: '26px', padding: 0 }}
        title="Kết quả trước (Shift + Enter)"
      >
        <ChevronUp size={15} />
      </button>

      <button
        onClick={handleNext}
        disabled={matches.length <= 1}
        className="pdf-btn pdf-btn-ghost pdf-btn-icon"
        style={{ width: '26px', height: '26px', padding: 0 }}
        title="Kết quả tiếp theo (Enter)"
      >
        <ChevronDown size={15} />
      </button>

      <div style={{ width: '1px', height: '18px', background: 'var(--border)' }} />

      <button
        onClick={onClose}
        className="pdf-btn pdf-btn-ghost pdf-btn-icon"
        style={{ width: '26px', height: '26px', padding: 0 }}
        title="Đóng tìm kiếm (Esc)"
      >
        <X size={15} />
      </button>
    </motion.div>
  )
}
