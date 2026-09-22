/**
 * PdfWatermarkModal — Đóng dấu mờ bản quyền tài liệu (Watermark Enterprise)
 * Cho phép tùy chỉnh chữ bản quyền, độ mờ, góc xoay, màu sắc và dải trang áp dụng.
 */

import React, { useState } from 'react'
import { Droplet, Check, X, RotateCw, Type, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PdfWatermarkOptions } from '../../../../shared/types'

interface PdfWatermarkModalProps {
  pageCount: number
  currentPage: number
  onConfirm: (options: PdfWatermarkOptions) => void
  onClose: () => void
}

const WATERMARK_PRESETS = [
  'VIETKEY SOLUTIONS',
  'BẢN NHÁP (DRAFT)',
  'BẢO MẬT (CONFIDENTIAL)',
  'TÀI LIỆU NỘI BỘ',
  'KHÔNG ĐƯỢC SAO CHÉP'
]

const COLOR_PRESETS = [
  { id: 'gray', label: 'Xám thanh lịch', r: 120, g: 120, b: 120, hex: '#787878' },
  { id: 'red', label: 'Đỏ bảo mật', r: 220, g: 38, b: 38, hex: '#dc2626' },
  { id: 'blue', label: 'Xanh doanh nghiệp', r: 0, g: 51, b: 153, hex: '#003399' }
]

export function PdfWatermarkModal({
  pageCount,
  currentPage,
  onConfirm,
  onClose
}: PdfWatermarkModalProps) {
  const [text, setText] = useState('VIETKEY SOLUTIONS')
  const [opacity, setOpacity] = useState(25) // percentage: 25 = 0.25
  const [fontSize, setFontSize] = useState(46)
  const [rotation, setRotation] = useState(-45)
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])
  const [scope, setScope] = useState<'all' | 'current' | 'range'>('all')
  const [rangeStart, setRangeStart] = useState('1')
  const [rangeEnd, setRangeEnd] = useState(pageCount.toString())

  const handleApply = () => {
    if (!text.trim()) return

    let pageIndices: number[] | undefined = undefined
    if (scope === 'current') {
      pageIndices = [currentPage]
    } else if (scope === 'range') {
      const s = Math.max(0, parseInt(rangeStart, 10) - 1)
      const e = Math.min(pageCount - 1, parseInt(rangeEnd, 10) - 1)
      if (!isNaN(s) && !isNaN(e) && s <= e) {
        pageIndices = []
        for (let i = s; i <= e; i++) pageIndices.push(i)
      }
    }

    onConfirm({
      text: text.trim(),
      opacity: opacity / 100,
      fontSize,
      rotationDegrees: rotation,
      color: { r: selectedColor.r, g: selectedColor.g, b: selectedColor.b },
      pageIndices
    })
    onClose()
  }

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <motion.div
        className="pdf-modal pdf-watermark-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
      >
        <div className="pdf-modal-header">
          <div className="pdf-modal-title">
            <Droplet size={20} className="text-cyan-400" />
            <span>Đóng Dấu Mờ Bản Quyền (Watermark)</span>
          </div>
          <button className="pdf-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="pdf-modal-body">
          <div className="pdf-wm-layout">
            {/* Cột trái: Cấu hình */}
            <div className="pdf-wm-form">
              {/* Nội dung chữ */}
              <div className="pdf-form-group">
                <label className="pdf-form-label">Nội dung chữ bản quyền:</label>
                <input
                  className="pdf-form-input"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập chữ bản quyền..."
                />
                <div className="pdf-wm-presets">
                  {WATERMARK_PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="pdf-wm-preset-tag"
                      onClick={() => setText(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Độ mờ & Cỡ chữ */}
              <div className="pdf-form-row">
                <div className="pdf-form-group">
                  <label className="pdf-form-label">Độ mờ: {opacity}%</label>
                  <input
                    type="range"
                    min={10}
                    max={70}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="pdf-slider"
                  />
                </div>
                <div className="pdf-form-group">
                  <label className="pdf-form-label">Cỡ chữ: {fontSize}pt</label>
                  <input
                    type="range"
                    min={24}
                    max={72}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="pdf-slider"
                  />
                </div>
              </div>

              {/* Góc nghiêng & Màu sắc */}
              <div className="pdf-form-row">
                <div className="pdf-form-group">
                  <label className="pdf-form-label">Góc xoay:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`pdf-btn pdf-btn-sm ${rotation === -45 ? 'pdf-btn-primary' : 'pdf-btn-ghost'}`}
                      onClick={() => setRotation(-45)}
                    >
                      Nghiêng -45°
                    </button>
                    <button
                      type="button"
                      className={`pdf-btn pdf-btn-sm ${rotation === 0 ? 'pdf-btn-primary' : 'pdf-btn-ghost'}`}
                      onClick={() => setRotation(0)}
                    >
                      Ngang 0°
                    </button>
                  </div>
                </div>

                <div className="pdf-form-group">
                  <label className="pdf-form-label">Màu sắc:</label>
                  <div className="pdf-sig-color-picker">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`pdf-color-dot ${selectedColor.id === c.id ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setSelectedColor(c)}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Phạm vi trang */}
              <div className="pdf-form-group">
                <label className="pdf-form-label">Phạm vi áp dụng:</label>
                <div className="flex gap-4">
                  <label className="pdf-radio-label">
                    <input
                      type="radio"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                    />
                    <span>Tất cả ({pageCount} trang)</span>
                  </label>
                  <label className="pdf-radio-label">
                    <input
                      type="radio"
                      checked={scope === 'current'}
                      onChange={() => setScope('current')}
                    />
                    <span>Trang {currentPage + 1}</span>
                  </label>
                  <label className="pdf-radio-label">
                    <input
                      type="radio"
                      checked={scope === 'range'}
                      onChange={() => setScope('range')}
                    />
                    <span>Tùy chọn trang</span>
                  </label>
                </div>

                {scope === 'range' && (
                  <div className="pdf-form-row mt-2">
                    <input
                      className="pdf-form-input"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      placeholder="Từ trang"
                    />
                    <input
                      className="pdf-form-input"
                      type="number"
                      min={1}
                      max={pageCount}
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      placeholder="Đến trang"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cột phải: Xem trước thu nhỏ (Live Preview Box) */}
            <div className="pdf-wm-preview-col">
              <span className="text-xs font-semibold text-muted-foreground mb-2 block">
                Mô phỏng hiển thị trên trang:
              </span>
              <div className="pdf-wm-mini-page">
                <div className="pdf-wm-dummy-lines">
                  <div className="pdf-wm-line w-3/4" />
                  <div className="pdf-wm-line w-full" />
                  <div className="pdf-wm-line w-5/6" />
                  <div className="pdf-wm-line w-full" />
                  <div className="pdf-wm-line w-2/3" />
                </div>

                {/* Simulated Watermark Text */}
                <div
                  className="pdf-wm-simulated-text"
                  style={{
                    color: selectedColor.hex,
                    opacity: opacity / 100,
                    fontSize: `${Math.max(12, Math.round(fontSize / 3.5))}px`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`
                  }}
                >
                  {text || 'PREVIEW'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pdf-modal-footer">
          <button className="pdf-btn pdf-btn-ghost" onClick={onClose}>
            Hủy bỏ
          </button>
          <button
            className="pdf-btn pdf-btn-primary"
            onClick={handleApply}
            disabled={!text.trim()}
          >
            <Check size={16} />
            <span>Đóng dấu bản quyền</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
