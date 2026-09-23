/**
 * PdfAddPageModal — Hộp thoại Thêm Trang Trắng hoặc Nhập Trang từ PDF Khác
 */

import React, { useState } from 'react'
import { PlusCircle, FilePlus, Upload, X, Check, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

interface PdfAddPageModalProps {
  pageCount: number
  currentPage: number
  onAddBlankPage: (position: 'before' | 'after' | 'end') => void
  onImportPdf: (fileBytes: Uint8Array, position: 'before' | 'after' | 'end', selectedRange?: string) => void
  onClose: () => void
}

export function PdfAddPageModal({
  pageCount,
  currentPage,
  onAddBlankPage,
  onImportPdf,
  onClose
}: PdfAddPageModalProps) {
  const [mode, setMode] = useState<'blank' | 'import'>('blank')
  const [position, setPosition] = useState<'after' | 'before' | 'end'>('after')
  const [importFile, setImportFile] = useState<{ name: string; bytes: Uint8Array } | null>(null)
  const [rangeMode, setRangeMode] = useState<'all' | 'custom'>('all')
  const [customRange, setCustomRange] = useState('')

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    setImportFile({
      name: file.name,
      bytes: new Uint8Array(buffer)
    })
  }

  const handleSubmit = () => {
    if (mode === 'blank') {
      onAddBlankPage(position)
    } else {
      if (!importFile) return
      onImportPdf(importFile.bytes, position, rangeMode === 'custom' ? customRange : undefined)
    }
  }

  return (
    <div className="pdf-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <motion.div
        className="pdf-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92vw', padding: '24px' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className="pdf-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={20} color="var(--primary)" />
          <span>Thêm Trang Mới Vào Tài Liệu</span>
        </div>

        {/* Tab switch giữa Trang trắng và Nhập file PDF */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            background: 'var(--muted)',
            padding: '4px',
            borderRadius: '10px',
            margin: '16px 0'
          }}
        >
          <button
            onClick={() => setMode('blank')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'blank' ? 'var(--card)' : 'transparent',
              color: mode === 'blank' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: mode === 'blank' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <FilePlus size={16} />
            Trang trắng (Blank Page)
          </button>

          <button
            onClick={() => setMode('import')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'import' ? 'var(--card)' : 'transparent',
              color: mode === 'import' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: mode === 'import' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Upload size={16} />
            Nhập từ PDF khác (Import)
          </button>
        </div>

        {/* Vị trí chèn */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
            Vị trí chèn trang:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { id: 'after', label: `Sau trang hiện tại (Trang ${currentPage + 1})` },
              { id: 'before', label: `Trước trang hiện tại (Trang ${currentPage + 1})` },
              { id: 'end', label: `Ở cuối tài liệu (Sau trang ${pageCount})` }
            ].map((pos) => (
              <label
                key={pos.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: position === pos.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: position === pos.id ? 'rgba(178, 213, 229, 0.15)' : 'var(--card)'
                }}
              >
                <input
                  type="radio"
                  name="pagePosition"
                  checked={position === pos.id}
                  onChange={() => setPosition(pos.id as any)}
                />
                {pos.label}
              </label>
            ))}
          </div>
        </div>

        {/* Chi tiết cho Nhập PDF khác */}
        {mode === 'import' && (
          <div
            style={{
              background: 'var(--muted)',
              padding: '14px',
              borderRadius: '10px',
              marginBottom: '16px',
              border: '1px dashed var(--border)'
            }}
          >
            {!importFile ? (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <Upload size={24} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Click để chọn file PDF cần nhập</span>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Hỗ trợ trích xuất toàn bộ hoặc dải trang chỉ định
                </span>
                <input type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />
              </label>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="var(--primary)" />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{importFile.name}</span>
                  </div>
                  <button
                    onClick={() => setImportFile(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--destructive)', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Chọn file khác
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="rangeMode"
                      checked={rangeMode === 'all'}
                      onChange={() => setRangeMode('all')}
                    />
                    Tất cả các trang
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="rangeMode"
                      checked={rangeMode === 'custom'}
                      onChange={() => setRangeMode('custom')}
                    />
                    Dải trang:
                  </label>

                  {rangeMode === 'custom' && (
                    <input
                      type="text"
                      className="setting-input"
                      placeholder="VD: 1-3, 5"
                      value={customRange}
                      onChange={(e) => setCustomRange(e.target.value)}
                      style={{ width: '110px', padding: '4px 8px', fontSize: '12px' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pdf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button className="pdf-btn pdf-btn-ghost" onClick={onClose}>
            <X size={14} /> Hủy
          </button>
          <button
            className="pdf-btn pdf-btn-primary"
            onClick={handleSubmit}
            disabled={mode === 'import' && !importFile}
          >
            <Check size={14} /> {mode === 'blank' ? 'Thêm trang trắng' : 'Nhập trang vào tài liệu'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
