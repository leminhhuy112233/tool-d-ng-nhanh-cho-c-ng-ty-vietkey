/**
 * VietKey DocGen — DocumentToast Component
 * Thông báo nổi glassmorphism sau khi xuất tài liệu kèm các nút hành động nhanh
 */

import { CheckCircle2, AlertCircle, ExternalLink, Folder, X } from 'lucide-react'
import type { DocumentToastState } from '../../hooks/useDocumentToast'

interface DocumentToastProps {
  toast: DocumentToastState | null
  onClose?: () => void
}

export function DocumentToast({ toast, onClose }: DocumentToastProps) {
  if (!toast) return null

  const isSuccess = toast.type === 'success'

  return (
    <div
      className="toast glass-effect"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderColor: isSuccess ? '#10b981' : 'var(--destructive)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        borderRadius: '12px',
        padding: '14px 18px',
        maxWidth: '460px',
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSuccess ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <AlertCircle size={18} color="var(--destructive)" />
          )}
          <span style={{ fontWeight: 600, fontSize: '13px' }}>{toast.text}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Đóng thông báo"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Action buttons if export succeeded */}
      {isSuccess && (toast.filePath || toast.pdfPath) && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
          {toast.filePath && (
            <button
              onClick={() => window.api?.openPath(toast.filePath!)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ExternalLink size={13} color="var(--primary-foreground)" />
              Mở file Word
            </button>
          )}

          {toast.pdfPath && (
            <button
              onClick={() => window.api?.openPath(toast.pdfPath!)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <ExternalLink size={13} color="#ffffff" />
              Mở file PDF
            </button>
          )}

          <button
            onClick={() => window.api?.showItemInFolder(toast.filePath || toast.pdfPath!)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              background: 'var(--muted)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Folder size={13} />
            Mở thư mục
          </button>
        </div>
      )}
    </div>
  )
}
