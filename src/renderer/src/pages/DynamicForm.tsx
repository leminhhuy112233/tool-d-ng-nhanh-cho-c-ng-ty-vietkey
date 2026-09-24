import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { FloatingExportBar } from '../components/common/FloatingExportBar'
import { ExportConfigSection } from '../components/common/ExportConfigSection'
import { LoadingOverlay } from '../components/common/LoadingOverlay'
import {
  FileText,
  Save,
  RotateCcw,
  Sparkles,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Folder,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowLeft
} from 'lucide-react'
import type { CustomTemplateDef, TemplateField, ExportFileType, PartnerProfile } from '../../../shared/types'
import { numberToVietnameseWords } from '../../../shared/number-to-words'
import { playSuccessChime } from '../lib/sound'

export function DynamicForm() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<CustomTemplateDef | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [exportFileName, setExportFileName] = useState('')
  const [exportDir, setExportDir] = useState('')
  const [exportType, setExportType] = useState<ExportFileType>('word')
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error'
    text: string
    filePath?: string
    pdfPath?: string
  } | null>(null)

  // Load Template Schema & Draft
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      if (!templateId || !window.api?.getCustomTemplateById) {
        setIsLoading(false)
        return
      }

      try {
        const tpl = await window.api.getCustomTemplateById(templateId)
        if (!tpl) {
          showToast('error', 'Không tìm thấy mẫu tài liệu này trong hệ thống.')
          setIsLoading(false)
          return
        }

        setTemplate(tpl)
        const defaultName = `${tpl.name.replace(/[\\/:*?"<>|]/g, '').trim() || 'TaiLieu'}.docx`
        setExportFileName(defaultName)

        // Load draft from localStorage or initialize with defaults
        const storageKey = `vk_custom_draft_${tpl.id}`
        const savedRaw = localStorage.getItem(storageKey)
        if (savedRaw) {
          try {
            const parsed = JSON.parse(savedRaw)
            setFormData(parsed)
          } catch (e) {
            initDefaultValues(tpl)
          }
        } else {
          initDefaultValues(tpl)
        }

        // Load default export directory
        if (window.api?.getSetting) {
          const dir = await window.api.getSetting('defaultExportDir')
          if (dir) setExportDir(dir)
        }
      } catch (err) {
        console.error('Lỗi tải template:', err)
        showToast('error', 'Không thể nạp cấu hình mẫu.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [templateId])

  // Helper khởi tạo giá trị mặc định cho form
  const initDefaultValues = (tpl: CustomTemplateDef) => {
    const initial: Record<string, any> = {}
    for (const f of tpl.fields) {
      if (f.type === 'table') {
        const defaultRow: Record<string, string> = {}
        for (const sub of f.subFields || []) {
          defaultRow[sub.key] = sub.key === 'stt' ? '01' : ''
        }
        initial[f.key] = [defaultRow]
      } else if (f.type === 'date') {
        const today = new Date()
        const dd = String(today.getDate()).padStart(2, '0')
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const yyyy = today.getFullYear()
        initial[f.key] = `${yyyy}-${mm}-${dd}`
      } else {
        initial[f.key] = f.defaultValue || ''
      }
    }
    setFormData(initial)
  }

  // Tự động lưu bản nháp vào localStorage mỗi khi form thay đổi
  useEffect(() => {
    if (!template?.id || Object.keys(formData).length === 0) return
    const storageKey = `vk_custom_draft_${template.id}`
    localStorage.setItem(storageKey, JSON.stringify(formData))
  }, [formData, template])

  const showToast = (
    type: 'success' | 'error',
    text: string,
    filePath?: string,
    pdfPath?: string
  ) => {
    setToastMessage({ type, text, filePath, pdfPath })
    if (type === 'success') playSuccessChime()
    setTimeout(() => setToastMessage(null), 6000)
  }

  const handleFieldChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: false }))
    }
  }

  // Quản lý Bảng dữ liệu lặp (Table rows)
  const handleAddTableRow = (tableKey: string, subFields?: Array<{ key: string }>) => {
    setFormData((prev) => {
      const rows = prev[tableKey] || []
      const nextStt = String(rows.length + 1).padStart(2, '0')
      const newRow: Record<string, string> = {}
      for (const sub of subFields || []) {
        newRow[sub.key] = sub.key === 'stt' ? nextStt : ''
      }
      return {
        ...prev,
        [tableKey]: [...rows, newRow]
      }
    })
  }

  const handleRemoveTableRow = (tableKey: string, index: number) => {
    setFormData((prev) => {
      const rows = prev[tableKey] || []
      const updated = rows.filter((_: any, i: number) => i !== index)
      return {
        ...prev,
        [tableKey]: updated.map((r: any, idx: number) => ({
          ...r,
          stt: String(idx + 1).padStart(2, '0')
        }))
      }
    })
  }

  const handleTableCellChange = (tableKey: string, index: number, colKey: string, val: string) => {
    setFormData((prev) => {
      const rows = [...(prev[tableKey] || [])]
      rows[index] = { ...rows[index], [colKey]: val }
      return { ...prev, [tableKey]: rows }
    })
  }

  const handleClearAll = () => {
    if (!template) return
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin đang điền trên form này để làm mới?')) {
      const storageKey = `vk_custom_draft_${template.id}`
      localStorage.removeItem(storageKey)
      initDefaultValues(template)
      showToast('success', 'Đã xóa toàn bộ thông tin đang điền!')
    }
  }

  // Xuất tài liệu
  const handleExport = async () => {
    if (!template || !templateId) return
    if (!window.api?.exportCustomDocument) {
      showToast('error', 'Ứng dụng cần chạy trong môi trường Desktop Client Electron.')
      return
    }

    // Kiểm tra các trường bắt buộc
    const newErrors: Record<string, boolean> = {}
    for (const f of template.fields) {
      if (f.required && f.type !== 'table' && (!formData[f.key] || !String(formData[f.key]).trim())) {
        newErrors[f.key] = true
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showToast('error', '⚠️ Vui lòng điền các ô thông tin bắt buộc trước khi xuất!')
      return
    }

    setIsExporting(true)
    try {
      let targetFilePath = ''
      let fileName = exportFileName.trim() || `${template.name}.docx`
      if (!fileName.toLowerCase().endsWith('.docx')) {
        fileName += '.docx'
      }

      if (exportDir && exportDir.trim()) {
        targetFilePath = `${exportDir.replace(/[/\\]+$/, '')}\\${fileName}`
      } else {
        const selected = await window.api.saveFileDialog(fileName, [
          { name: 'Word Document (*.docx)', extensions: ['docx'] }
        ])
        if (!selected) {
          setIsExporting(false)
          return
        }
        targetFilePath = selected
      }

      const res = await window.api.exportCustomDocument(
        templateId,
        formData,
        targetFilePath,
        exportType
      )

      if (res.success) {
        showToast('success', `Đã xuất "${template.name}" thành công!`, res.filePath || targetFilePath, res.pdfPath)
      } else {
        showToast('error', res.error || 'Có lỗi xảy ra khi tạo văn bản.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Lỗi khi xuất file.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return <LoadingOverlay isVisible={true} title="Đang nạp cấu hình mẫu văn bản..." />
  }

  if (!template) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>Không tìm thấy mẫu tài liệu</h3>
        <button onClick={() => navigate('/templates')} className="btn-primary" style={{ marginTop: '12px' }}>
          Quay lại Quản lý mẫu
        </button>
      </div>
    )
  }

  // Nhóm các trường theo section
  const sectionsMap = new Map<string, TemplateField[]>()
  for (const f of template.fields) {
    const sec = f.section || 'Thông tin chung'
    if (!sectionsMap.has(sec)) sectionsMap.set(sec, [])
    sectionsMap.get(sec)!.push(f)
  }

  return (
    <div style={{ paddingBottom: '120px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '14px 18px',
            background: 'var(--card)',
            color: 'var(--foreground)',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
            border: `1px solid ${toastMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
            maxWidth: '420px',
            animation: 'slideUp 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#ef4444' }} />
            )}
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{toastMessage.text}</span>
          </div>
          {toastMessage.filePath && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => window.api?.openPath(toastMessage.filePath!)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '6px',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Mở file Word
              </button>
              <button
                onClick={() => window.api?.showItemInFolder(toastMessage.filePath!)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
              >
                Mở thư mục
              </button>
            </div>
          )}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title={template.name}
        description={template.description || `Mẫu văn bản tùy biến gồm ${template.fields.length} trường thông tin`}
      >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/templates')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--foreground)',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={15} />
              Trở về
            </button>

            <button
              onClick={handleClearAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Xóa toàn bộ dữ liệu đang điền"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.borderColor = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--muted-foreground)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <RotateCcw size={15} />
              Làm mới form
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                opacity: isExporting ? 0.7 : 1
              }}
            >
              <Save size={16} />
              {isExporting ? 'Đang xuất...' : 'Xuất Văn Bản Word'}
            </button>
          </div>
      </PageHeader>

      {/* Main Form Fields Container */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Array.from(sectionsMap.entries()).map(([sectionName, secFields]) => (
          <div key={sectionName} className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <Layers size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
                {sectionName}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {secFields.map((field) => {
                // Trường Bảng danh sách lặp (Table)
                if (field.type === 'table') {
                  const rows = formData[field.key] || []
                  return (
                    <div key={field.id} style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                          {field.label} ({rows.length} hàng)
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddTableRow(field.key, field.subFields)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            background: 'var(--primary)',
                            color: 'var(--primary-foreground)',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={13} />
                          Thêm dòng
                        </button>
                      </div>

                      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                          <thead>
                            <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                              {(field.subFields || []).map((col) => (
                                <th key={col.key} style={{ padding: '8px 10px', textAlign: col.key === 'stt' ? 'center' : 'left' }}>
                                  {col.label}
                                </th>
                              ))}
                              <th style={{ width: '50px', textAlign: 'center', padding: '8px' }}>Xóa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((row: any, rIdx: number) => (
                              <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                                {(field.subFields || []).map((col) => (
                                  <td key={col.key} style={{ padding: '6px 8px' }}>
                                    <input
                                      type="text"
                                      className="setting-input"
                                      style={{
                                        width: '100%',
                                        fontSize: '12px',
                                        textAlign: col.type === 'currency' ? 'right' : col.key === 'stt' ? 'center' : 'left'
                                      }}
                                      value={row[col.key] || ''}
                                      onChange={(e) => handleTableCellChange(field.key, rIdx, col.key, e.target.value)}
                                    />
                                  </td>
                                ))}
                                <td style={{ textAlign: 'center', padding: '6px' }}>
                                  <button
                                    type="button"
                                    disabled={rows.length <= 1}
                                    onClick={() => handleRemoveTableRow(field.key, rIdx)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: rows.length <= 1 ? 'var(--border)' : 'var(--muted-foreground)',
                                      cursor: rows.length <= 1 ? 'not-allowed' : 'pointer',
                                      padding: '4px'
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                }

                // Trường Textarea
                if (field.type === 'textarea') {
                  return (
                    <div key={field.id} style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <textarea
                        className="setting-input"
                        rows={3}
                        style={{
                          width: '100%',
                          fontSize: '13px',
                          borderColor: errors[field.key] ? '#ef4444' : 'var(--border)'
                        }}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                      />
                    </div>
                  )
                }

                // Trường Tiền tệ (Currency)
                if (field.type === 'currency') {
                  const val = formData[field.key] || ''
                  const inWords = val ? numberToVietnameseWords(val) : ''
                  return (
                    <div key={field.id}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="setting-input"
                          style={{
                            width: '100%',
                            textAlign: 'right',
                            fontWeight: 700,
                            paddingRight: '36px',
                            borderColor: errors[field.key] ? '#ef4444' : 'var(--border)'
                          }}
                          value={val}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, '')
                            const formatted = digits ? Number(digits).toLocaleString('vi-VN') : ''
                            handleFieldChange(field.key, formatted)
                          }}
                          placeholder="0"
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                          VNĐ
                        </span>
                      </div>
                      {inWords && (
                        <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px', fontStyle: 'italic' }}>
                          ✍️ {inWords}
                        </div>
                      )}
                    </div>
                  )
                }

                // Trường Ngày tháng (Date)
                if (field.type === 'date') {
                  return (
                    <div key={field.id}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      <input
                        type="date"
                        className="setting-input"
                        style={{
                          width: '100%',
                          borderColor: errors[field.key] ? '#ef4444' : 'var(--border)'
                        }}
                        value={formData[field.key] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      />
                    </div>
                  )
                }

                // Trường Text mặc định
                return (
                  <div key={field.id}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '5px' }}>
                      {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    <input
                      type="text"
                      className="setting-input"
                      style={{
                        width: '100%',
                        borderColor: errors[field.key] ? '#ef4444' : 'var(--border)'
                      }}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}...`}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Export Configuration Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
            Cấu Hình Xuất File Văn Bản
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>
                Tên file xuất ra (.docx)
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder="VD: BienBanNghiemThu_Vietkey.docx"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>
                Thư mục lưu trữ (Để trống sẽ hỏi khi xuất)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%', fontSize: '12px' }}
                  value={exportDir}
                  onChange={(e) => setExportDir(e.target.value)}
                  placeholder="Mặc định: Hỏi vị trí lưu"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const dir = await window.api?.openDirectoryDialog()
                    if (dir) setExportDir(dir)
                  }}
                  style={{
                    padding: '0 12px',
                    background: 'var(--muted)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Chọn thư mục"
                >
                  <Folder size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
