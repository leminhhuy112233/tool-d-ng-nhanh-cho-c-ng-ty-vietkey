/**
 * PageManager — Dialogs cho Split, Delete, Extract pages
 */

import { useState } from 'react'
import { Scissors, Trash2, Download, X } from 'lucide-react'

// ===== Delete Pages Dialog =====
interface DeleteDialogProps {
  pageCount: number
  selectedPages: number[]
  currentPage: number
  onConfirm: (pageIndices: number[]) => void
  onClose: () => void
}

export function DeletePagesDialog({
  pageCount,
  selectedPages,
  currentPage,
  onConfirm,
  onClose
}: DeleteDialogProps) {
  const [mode, setMode] = useState<'selected' | 'range' | 'current'>(
    selectedPages.length > 0 ? 'selected' : 'current'
  )
  const [rangeStart, setRangeStart] = useState('1')
  const [rangeEnd, setRangeEnd] = useState(pageCount.toString())

  const handleConfirm = () => {
    let indices: number[] = []
    if (mode === 'selected') {
      indices = [...selectedPages]
    } else if (mode === 'current') {
      indices = [currentPage]
    } else {
      const start = parseInt(rangeStart, 10) - 1
      const end = parseInt(rangeEnd, 10) - 1
      if (!isNaN(start) && !isNaN(end) && start >= 0 && end < pageCount && start <= end) {
        for (let i = start; i <= end; i++) indices.push(i)
      }
    }

    if (indices.length > 0 && indices.length < pageCount) {
      onConfirm(indices)
    }
  }

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-title">
          <Trash2 size={18} /> Xóa trang
        </div>
        <div className="pdf-modal-body">
          <div className="pdf-form-group">
            <label className="pdf-form-label">Chọn trang cần xóa:</label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={mode === 'current'}
                  onChange={() => setMode('current')}
                />
                <span style={{ fontSize: '0.875rem' }}>Trang hiện tại ({currentPage + 1})</span>
              </label>

              {selectedPages.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={mode === 'selected'}
                    onChange={() => setMode('selected')}
                  />
                  <span style={{ fontSize: '0.875rem' }}>
                    {selectedPages.length} trang đã chọn ({selectedPages.map((p) => p + 1).join(', ')})
                  </span>
                </label>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={mode === 'range'}
                  onChange={() => setMode('range')}
                />
                <span style={{ fontSize: '0.875rem' }}>Phạm vi trang</span>
              </label>

              {mode === 'range' && (
                <div className="pdf-form-row" style={{ marginLeft: '1.5rem' }}>
                  <div className="pdf-form-group">
                    <label className="pdf-form-label">Từ trang</label>
                    <input
                      className="pdf-form-input"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                    />
                  </div>
                  <div className="pdf-form-group">
                    <label className="pdf-form-label">Đến trang</label>
                    <input
                      className="pdf-form-input"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.75rem' }}>
            ⚠️ Không thể xóa tất cả trang. File PDF cần ít nhất 1 trang.
          </p>
        </div>

        <div className="pdf-modal-footer">
          <button className="pdf-btn pdf-btn-sm" onClick={onClose}>
            <X size={14} /> Hủy
          </button>
          <button className="pdf-btn pdf-btn-sm pdf-btn-danger" onClick={handleConfirm}>
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Split PDF Dialog =====
interface SplitDialogProps {
  pageCount: number
  onConfirm: (ranges: { start: number; end: number }[]) => void
  onClose: () => void
}

export function SplitPdfDialog({ pageCount, onConfirm, onClose }: SplitDialogProps) {
  const [mode, setMode] = useState<'each' | 'half' | 'custom'>('half')
  const [customRanges, setCustomRanges] = useState([
    { start: '1', end: Math.floor(pageCount / 2).toString() },
    { start: (Math.floor(pageCount / 2) + 1).toString(), end: pageCount.toString() }
  ])

  const handleConfirm = () => {
    let ranges: { start: number; end: number }[] = []

    if (mode === 'each') {
      // Tách mỗi trang thành 1 file
      ranges = Array.from({ length: pageCount }, (_, i) => ({ start: i, end: i }))
    } else if (mode === 'half') {
      const mid = Math.floor(pageCount / 2)
      ranges = [
        { start: 0, end: mid - 1 },
        { start: mid, end: pageCount - 1 }
      ]
    } else {
      ranges = customRanges
        .map((r) => ({
          start: parseInt(r.start, 10) - 1,
          end: parseInt(r.end, 10) - 1
        }))
        .filter((r) => !isNaN(r.start) && !isNaN(r.end) && r.start >= 0 && r.end < pageCount)
    }

    if (ranges.length > 0) {
      onConfirm(ranges)
    }
  }

  const addCustomRange = () => {
    setCustomRanges([...customRanges, { start: '1', end: pageCount.toString() }])
  }

  const removeCustomRange = (index: number) => {
    setCustomRanges(customRanges.filter((_, i) => i !== index))
  }

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <div className="pdf-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-modal-title">
          <Scissors size={18} /> Tách PDF ({pageCount} trang)
        </div>
        <div className="pdf-modal-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'half'} onChange={() => setMode('half')} />
              <span style={{ fontSize: '0.875rem' }}>Chia đôi (2 phần bằng nhau)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'each'} onChange={() => setMode('each')} />
              <span style={{ fontSize: '0.875rem' }}>Mỗi trang thành 1 file riêng</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'custom'} onChange={() => setMode('custom')} />
              <span style={{ fontSize: '0.875rem' }}>Tùy chỉnh phạm vi</span>
            </label>
          </div>

          {mode === 'custom' && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {customRanges.map((range, idx) => (
                <div key={idx} className="pdf-form-row" style={{ alignItems: 'end' }}>
                  <div className="pdf-form-group">
                    <label className="pdf-form-label">Phần {idx + 1}: Từ</label>
                    <input
                      className="pdf-form-input"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={range.start}
                      onChange={(e) => {
                        const updated = [...customRanges]
                        updated[idx].start = e.target.value
                        setCustomRanges(updated)
                      }}
                    />
                  </div>
                  <div className="pdf-form-group">
                    <label className="pdf-form-label">Đến</label>
                    <input
                      className="pdf-form-input"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={range.end}
                      onChange={(e) => {
                        const updated = [...customRanges]
                        updated[idx].end = e.target.value
                        setCustomRanges(updated)
                      }}
                    />
                  </div>
                  {customRanges.length > 1 && (
                    <button
                      className="pdf-btn pdf-btn-sm pdf-btn-icon"
                      onClick={() => removeCustomRange(idx)}
                      style={{ marginBottom: '0.75rem' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button className="pdf-btn pdf-btn-sm" onClick={addCustomRange}>
                + Thêm phần
              </button>
            </div>
          )}
        </div>

        <div className="pdf-modal-footer">
          <button className="pdf-btn pdf-btn-sm" onClick={onClose}>
            <X size={14} /> Hủy
          </button>
          <button className="pdf-btn pdf-btn-sm pdf-btn-primary" onClick={handleConfirm}>
            <Scissors size={14} /> Tách
          </button>
        </div>
      </div>
    </div>
  )
}
