import { FileSpreadsheet, FolderOpen } from 'lucide-react'
import type { ExportFileType } from '../../../../shared/types'

interface ExportConfigSectionProps {
  fileName: string
  onChangeFileName: (val: string) => void
  exportType: ExportFileType
  onChangeExportType: (type: ExportFileType) => void
  exportDir: string
  onBrowseExportDir: () => void
  defaultFileNamePlaceholder?: string
}

export function ExportConfigSection({
  fileName,
  onChangeFileName,
  exportType,
  onChangeExportType,
  exportDir,
  onBrowseExportDir,
  defaultFileNamePlaceholder = 'TàiLiệu.docx'
}: ExportConfigSectionProps) {
  return (
    <div
      className="settings-section"
      style={{
        background: 'linear-gradient(135deg, rgba(178, 213, 229, 0.08), rgba(99, 102, 241, 0.05))',
        border: '1px solid rgba(178, 213, 229, 0.3)',
        borderRadius: '12px',
        padding: '18px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <FileSpreadsheet size={20} color="var(--primary)" />
        <div>
          <h3 style={{ color: 'var(--primary)', fontSize: '15px' }}>File xuất, Định dạng & Nơi lưu</h3>
          <p style={{ margin: 0, fontSize: '12px' }}>Chọn định dạng đầu ra (Word / PDF / Cả 2) và nơi lưu trữ</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '14px', alignItems: 'end' }}>
        {/* Tên file */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
            Tên file xuất
          </label>
          <input
            type="text"
            className="setting-input"
            style={{ width: '100%', fontWeight: 500 }}
            value={fileName}
            onChange={(e) => onChangeFileName(e.target.value)}
            placeholder={defaultFileNamePlaceholder}
          />
        </div>

        {/* Định dạng xuất (Word / PDF / Cả 2) */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
            Định dạng đầu ra
          </label>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '3px'
            }}
          >
            {(
              [
                { id: 'word', label: '📄 Word' },
                { id: 'pdf', label: '📕 PDF' },
                { id: 'both', label: '📦 Cả 2' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => onChangeExportType(opt.id as ExportFileType)}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  background: exportType === opt.id ? 'var(--primary)' : 'transparent',
                  color: exportType === opt.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thư mục lưu */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px' }}>
            Thư mục lưu file
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="setting-input"
              style={{ width: '100%', cursor: 'pointer' }}
              value={exportDir}
              readOnly
              placeholder="Chọn thư mục lưu..."
              onClick={onBrowseExportDir}
            />
            <button
              onClick={onBrowseExportDir}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: 'var(--foreground)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <FolderOpen size={15} />
              Chọn
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
