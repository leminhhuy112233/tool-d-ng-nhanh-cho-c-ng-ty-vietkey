/**
 * PdfSecurityModal — Hộp Thoại Bảo Mật, Mật Khẩu & Quản Lý Metadata
 */

import React, { useState } from 'react'
import { Lock, Unlock, Shield, Trash2, Check, X, FileText, User, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'

export interface PdfMetadataInfo {
  title?: string
  author?: string
  subject?: string
  keywords?: string
  creator?: string
  producer?: string
}

interface PdfSecurityModalProps {
  initialTab?: 'password' | 'metadata'
  currentMetadata?: PdfMetadataInfo
  onSetPassword: (password: string, allowPrint: boolean, allowCopy: boolean) => Promise<void>
  onUpdateMetadata: (metadata: PdfMetadataInfo | null) => Promise<void>
  onClose: () => void
}

export function PdfSecurityModal({
  initialTab = 'password',
  currentMetadata,
  onSetPassword,
  onUpdateMetadata,
  onClose
}: PdfSecurityModalProps) {
  const [tab, setTab] = useState<'password' | 'metadata'>(initialTab)

  // Password state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [allowPrint, setAllowPrint] = useState(true)
  const [allowCopy, setAllowCopy] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Metadata state
  const [meta, setMeta] = useState<PdfMetadataInfo>({
    title: currentMetadata?.title || '',
    author: currentMetadata?.author || '',
    subject: currentMetadata?.subject || '',
    keywords: currentMetadata?.keywords || '',
    creator: currentMetadata?.creator || 'VietKey PDF Studio',
    producer: currentMetadata?.producer || 'VietKey Engine'
  })

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu!')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp!')
      return
    }
    setErrorMsg('')
    setIsProcessing(true)
    try {
      await onSetPassword(password, allowPrint, allowCopy)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveMetadata = async () => {
    setIsProcessing(true)
    try {
      await onUpdateMetadata(meta)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClearMetadata = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin tác giả, tiêu đề và phần mềm tạo file?')) {
      setIsProcessing(true)
      try {
        await onUpdateMetadata(null)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <div className="pdf-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <motion.div
        className="pdf-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92vw', padding: '24px' }}
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
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Bảo Mật Tài Liệu & Metadata</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
              Mã hóa bảo vệ mật khẩu hoặc xóa thông tin người tạo tệp
            </p>
          </div>
        </div>

        {/* Tab switch */}
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
            onClick={() => setTab('password')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'password' ? 'var(--card)' : 'transparent',
              color: tab === 'password' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: tab === 'password' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <Lock size={15} />
            Đặt mật khẩu bảo vệ
          </button>

          <button
            onClick={() => setTab('metadata')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: tab === 'metadata' ? 'var(--card)' : 'transparent',
              color: tab === 'metadata' ? 'var(--primary)' : 'var(--muted-foreground)',
              fontWeight: tab === 'metadata' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <FileText size={15} />
            Quản lý Metadata
          </button>
        </div>

        {/* TAB 1: MẬT KHẨU */}
        {tab === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Mật khẩu mở file:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="setting-input"
                  style={{ width: '100%', paddingRight: '36px' }}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrorMsg('')
                  }}
                  placeholder="Nhập mật khẩu..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted-foreground)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px' }}>
                Xác nhận lại mật khẩu:
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="setting-input"
                style={{ width: '100%' }}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrorMsg('')
                }}
                placeholder="Nhập lại mật khẩu..."
              />
            </div>

            {errorMsg && (
              <span style={{ fontSize: '12px', color: 'var(--destructive)', fontWeight: 600 }}>
                ⚠️ {errorMsg}
              </span>
            )}

            <div style={{ background: 'var(--muted)', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Quyền hạn cho phép người xem:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowPrint}
                    onChange={(e) => setAllowPrint(e.target.checked)}
                  />
                  Cho phép in ấn tài liệu (Allow Printing)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={allowCopy}
                    onChange={(e) => setAllowCopy(e.target.checked)}
                  />
                  Cho phép sao chép nội dung văn bản (Allow Copying)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: METADATA */}
        {tab === 'metadata' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Tiêu đề (Title):
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={meta.title}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                placeholder="Tiêu đề tài liệu..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Tác giả (Author):
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%' }}
                  value={meta.author}
                  onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                  placeholder="Người tạo..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Chủ đề (Subject):
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%' }}
                  value={meta.subject}
                  onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
                  placeholder="Chủ đề..."
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                Từ khóa (Keywords):
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={meta.keywords}
                onChange={(e) => setMeta({ ...meta, keywords: e.target.value })}
                placeholder="VD: BaoCao, HopDong, VietKey..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleClearMetadata}
                disabled={isProcessing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid var(--destructive)',
                  color: 'var(--destructive)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={13} /> Xóa sạch Metadata (Ẩn danh tài liệu)
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pdf-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="pdf-btn pdf-btn-ghost" onClick={onClose} disabled={isProcessing}>
            <X size={14} /> Hủy
          </button>
          {tab === 'password' ? (
            <button
              className="pdf-btn pdf-btn-primary"
              onClick={handlePasswordSubmit}
              disabled={isProcessing}
              style={{ padding: '8px 20px', fontWeight: 600 }}
            >
              <Check size={14} /> {isProcessing ? 'Đang xử lý...' : 'Áp Dụng Mật Khẩu'}
            </button>
          ) : (
            <button
              className="pdf-btn pdf-btn-primary"
              onClick={handleSaveMetadata}
              disabled={isProcessing}
              style={{ padding: '8px 20px', fontWeight: 600 }}
            >
              <Check size={14} /> {isProcessing ? 'Đang lưu...' : 'Lưu Metadata'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
