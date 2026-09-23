/**
 * PdfCompressModal — Hộp Thoại Nén Giảm Dung Lượng PDF Chuyên Nghiệp
 * 3 cấp độ nén kèm bảng hiển thị dung lượng trước/sau nén và % MB tiết kiệm.
 */

import React, { useState } from 'react'
import { FileArchive, Check, X, Sparkles, ArrowRight, Gauge, ShieldCheck, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export type CompressLevel = 'low' | 'medium' | 'high'

interface PdfCompressModalProps {
  originalSizeBytes: number
  originalSizeFormatted: string
  onCompress: (level: CompressLevel) => Promise<void>
  onClose: () => void
}

const COMPRESS_LEVELS = [
  {
    id: 'low' as CompressLevel,
    title: 'Nén Nhẹ (High Quality)',
    desc: 'Giữ nguyên 100% độ sắc nét hình ảnh, chỉ nén cấu trúc luồng đối tượng (Object Streams).',
    ratio: 0.8,
    saveEstimate: '15% – 25%',
    badge: 'Khuyên dùng cho in ấn',
    icon: ShieldCheck
  },
  {
    id: 'medium' as CompressLevel,
    title: 'Nén Vừa (Standard)',
    desc: 'Cân bằng hoàn hảo giữa độ nét văn bản và dung lượng nhẹ để gửi Email/Zalo.',
    ratio: 0.45,
    saveEstimate: '45% – 60%',
    badge: 'Khuyên dùng phổ thông',
    icon: Gauge,
    recommended: true
  },
  {
    id: 'high' as CompressLevel,
    title: 'Nén Tối Đa (Max Savings)',
    desc: 'Thu nhỏ dung lượng đến mức tối đa, phù hợp cho tài liệu scan nhiều trang dung lượng lớn.',
    ratio: 0.25,
    saveEstimate: '65% – 80%',
    badge: 'Tiết kiệm dung lượng nhất',
    icon: Zap
  }
]

export function PdfCompressModal({
  originalSizeBytes,
  originalSizeFormatted,
  onCompress,
  onClose
}: PdfCompressModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<CompressLevel>('medium')
  const [isProcessing, setIsProcessing] = useState(false)

  const activeLevelConfig = COMPRESS_LEVELS.find((l) => l.id === selectedLevel) || COMPRESS_LEVELS[1]

  const estimatedNewSizeBytes = Math.round(originalSizeBytes * activeLevelConfig.ratio)
  const estimatedNewSizeMB = (estimatedNewSizeBytes / (1024 * 1024)).toFixed(2) + ' MB'
  const savedPercent = Math.round((1 - activeLevelConfig.ratio) * 100)

  const handleApply = async () => {
    setIsProcessing(true)
    try {
      await onCompress(selectedLevel)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="pdf-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <motion.div
        className="pdf-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92vw', padding: '24px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="pdf-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileArchive size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Nén Giảm Dung Lượng Tệp PDF</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
              Tối ưu hóa bảng luồng dữ liệu & hình ảnh nhúng trực tiếp trên máy tính
            </p>
          </div>
        </div>

        {/* Bảng so sánh dung lượng trực quan */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            background: 'var(--muted)',
            padding: '16px',
            borderRadius: '12px',
            margin: '16px 0',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', display: 'block' }}>Dung lượng gốc:</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--foreground)' }}>{originalSizeFormatted}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <ArrowRight size={20} color="var(--primary)" />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: '#10b981',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              -{savedPercent}%
            </span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', display: 'block' }}>Ước tính sau nén:</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{estimatedNewSizeMB}</span>
          </div>
        </div>

        {/* 3 Cấp độ nén */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}>
            Chọn cấp độ nén phù hợp:
          </label>

          {COMPRESS_LEVELS.map((level) => {
            const Icon = level.icon
            const isSelected = selectedLevel === level.id

            return (
              <div
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(178, 213, 229, 0.12)' : 'var(--card)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--primary)' : 'var(--muted)',
                    color: isSelected ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px'
                  }}
                >
                  <Icon size={18} />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {level.title}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: level.recommended ? 'rgba(16, 185, 129, 0.15)' : 'var(--muted)',
                        color: level.recommended ? '#10b981' : 'var(--muted-foreground)',
                        fontWeight: 600
                      }}
                    >
                      {level.badge}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    {level.desc}
                  </p>
                </div>

                <div style={{ alignSelf: 'center' }}>
                  <input
                    type="radio"
                    name="compressLevel"
                    checked={isSelected}
                    onChange={() => setSelectedLevel(level.id)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="pdf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="pdf-btn pdf-btn-ghost" onClick={onClose} disabled={isProcessing}>
            <X size={14} /> Hủy
          </button>
          <button
            className="pdf-btn pdf-btn-primary"
            onClick={handleApply}
            disabled={isProcessing}
            style={{ padding: '8px 22px', fontWeight: 600 }}
          >
            <Check size={15} /> {isProcessing ? 'Đang nén file...' : 'Tiến hành Nén & Lưu File'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
