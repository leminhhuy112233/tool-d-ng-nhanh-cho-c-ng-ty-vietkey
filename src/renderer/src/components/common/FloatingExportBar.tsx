import { Download, RefreshCw, Eye, EyeOff } from 'lucide-react'
import type { ExportFileType } from '../../../../shared/types'

interface FloatingExportBarProps {
  title: string
  itemBadge?: string
  exportType: ExportFileType
  fileName: string
  isExporting: boolean
  onExport: () => void
  buttonLabel?: string
  onTogglePreview?: () => void
  isPreviewOpen?: boolean
}

export function FloatingExportBar({
  title,
  itemBadge,
  exportType,
  fileName,
  isExporting,
  onExport,
  buttonLabel,
  onTogglePreview,
  isPreviewOpen
}: FloatingExportBarProps) {
  const getFormatLabel = () => {
    if (exportType === 'word') return '📄 Word'
    if (exportType === 'pdf') return '📕 PDF'
    return '📦 Cả 2'
  }

  const defaultButtonText = isExporting
    ? 'Đang tạo file...'
    : `Tạo & Xuất (${exportType.toUpperCase()})`

  return (
    <div
      style={{
        position: 'sticky',
        bottom: '20px',
        marginTop: '32px',
        background: 'var(--floating-bar-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--floating-bar-border)',
        borderRadius: '16px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
        zIndex: 50
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--foreground)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </span>
          {itemBadge && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(178, 213, 229, 0.15)',
                color: 'var(--primary)',
                border: '1px solid rgba(178, 213, 229, 0.3)',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              {itemBadge}
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--muted-foreground)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            Định dạng: <strong style={{ color: 'var(--primary)' }}>{getFormatLabel()}</strong>
          </span>
          <span style={{ flexShrink: 0 }}>•</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            File: <span style={{ color: 'var(--foreground)', fontFamily: 'monospace' }}>{fileName || 'TaiLieu.docx'}</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {onTogglePreview && (
          <button
            type="button"
            onClick={onTogglePreview}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 18px',
              background: isPreviewOpen ? 'var(--primary)' : 'var(--card)',
              color: isPreviewOpen ? 'var(--primary-foreground)' : 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}
            title={isPreviewOpen ? 'Đóng xem trước' : 'Bật xem trước và sửa trực tiếp'}
          >
            {isPreviewOpen ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{isPreviewOpen ? 'Đóng xem trước' : 'Xem trước'}</span>
          </button>
        )}

        <button
          onClick={onExport}
          disabled={isExporting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            opacity: isExporting ? 0.7 : 1,
            boxShadow: '0 4px 16px rgba(178, 213, 229, 0.4)',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.15s ease'
          }}
        >
          {isExporting ? (
            <RefreshCw size={18} className="animate-spin" color="var(--primary-foreground)" />
          ) : (
            <Download size={18} color="var(--primary-foreground)" />
          )}
          {buttonLabel || defaultButtonText}
        </button>
      </div>
    </div>
  )
}
