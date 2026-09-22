import { useState } from 'react'
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react'
import type { AnalyzedTemplateResult, TemplateField, TemplateFieldType, CustomTemplateDef } from '../../../../shared/types'

interface TemplateUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onTemplateCreated: (template: CustomTemplateDef) => void
}

const FIELD_TYPES: Array<{ value: TemplateFieldType; label: string; icon: string }> = [
  { value: 'text', label: 'Văn bản ngắn (Tên, Mã số, Đơn vị)', icon: '📝' },
  { value: 'currency', label: 'Số tiền / Đơn giá (Tự format VNĐ)', icon: '💰' },
  { value: 'date', label: 'Ngày tháng (Chọn lịch)', icon: '📅' },
  { value: 'number', label: 'Số lượng / Tỷ lệ %', icon: '🔢' },
  { value: 'textarea', label: 'Đoạn văn bản dài (Nội dung, Điều khoản)', icon: '📄' },
  { value: 'table', label: 'Bảng danh sách lặp (Thêm/Xóa dòng)', icon: '📊' }
]

export function TemplateUploadModal({ isOpen, onClose, onTemplateCreated }: TemplateUploadModalProps) {
  const [step, setStep] = useState<'select' | 'analyzing' | 'review' | 'saving'>('select')
  const [selectedFilePath, setSelectedFilePath] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalyzedTemplateResult | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [fields, setFields] = useState<TemplateField[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSelectFile = async () => {
    if (!window.api?.openFileDialog) return
    setErrorMessage(null)

    const path = await window.api.openFileDialog([
      { name: 'Word Document (*.docx)', extensions: ['docx'] }
    ])

    if (!path) return

    setSelectedFilePath(path)
    runAnalysis(path)
  }

  const runAnalysis = async (path: string) => {
    setStep('analyzing')
    try {
      if (!window.api?.analyzeTemplate) {
        throw new Error('API phân tích template chưa sẵn sàng.')
      }

      const res = await window.api.analyzeTemplate(path)
      if (!res.success) {
        setErrorMessage(res.error || 'Không thể phân tích file Word này.')
        setStep('select')
        return
      }

      setAnalysisResult(res)
      setTemplateName(res.templateName || 'Mẫu Văn Bản Mới')
      setFields(res.fields || [])
      setStep('review')
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi phân tích tài liệu.')
      setStep('select')
    }
  }

  const handleFieldChange = (id: string, field: keyof TemplateField, val: any) => {
    setFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    )
  }

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((item) => item.id !== id))
  }

  const handleAddField = () => {
    const newField: TemplateField = {
      id: String(Date.now()),
      key: `truong_moi_${fields.length + 1}`,
      label: `Trường mới ${fields.length + 1}`,
      type: 'text',
      section: 'Thông tin bổ sung',
      required: false,
      placeholder: 'Nhập thông tin...'
    }
    setFields((prev) => [...prev, newField])
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setErrorMessage('Vui lòng nhập tên cho mẫu văn bản!')
      return
    }

    if (fields.length === 0) {
      setErrorMessage('Mẫu cần có ít nhất 1 trường dữ liệu để tạo form.')
      return
    }

    setStep('saving')
    try {
      if (!window.api?.saveCustomTemplate) {
        throw new Error('API lưu template chưa sẵn sàng.')
      }

      const rawFileName = selectedFilePath.split(/[\\/]/).pop() || 'template.docx'
      const res = await window.api.saveCustomTemplate(
        {
          name: templateName.trim(),
          description: templateDescription.trim(),
          fileName: rawFileName,
          docxFilePath: selectedFilePath,
          fields,
          isFromRedHighlight: Boolean(analysisResult?.isRedTextDetected),
          category: 'custom'
        },
        analysisResult?.processedDocxBase64
      )

      if (res.success && res.template) {
        onTemplateCreated(res.template)
        onClose()
      } else {
        setErrorMessage(res.error || 'Không thể lưu mẫu vào hệ thống.')
        setStep('review')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu mẫu.')
      setStep('review')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: step === 'review' ? '900px' : '620px',
          maxHeight: '90vh',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
                Tải Lên Mẫu Word & Tự Động Tạo Form Điền
              </h3>
              <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--muted-foreground)' }}>
                Hỗ trợ cả file mẫu bôi chữ ĐỎ hoặc thẻ placeholder {'{...}'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              margin: '12px 20px 0',
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* STEP 1: Select File */}
          {step === 'select' && (
            <div>
              {/* Dropzone / Upload Box */}
              <div
                onClick={handleSelectFile}
                style={{
                  border: '2px dashed rgba(178, 213, 229, 0.35)',
                  borderRadius: '14px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(178, 213, 229, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)'
                  e.currentTarget.style.background = 'rgba(178, 213, 229, 0.09)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(178, 213, 229, 0.35)'
                  e.currentTarget.style.background = 'rgba(178, 213, 229, 0.04)'
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: 'rgba(178, 213, 229, 0.12)',
                    color: 'var(--primary)',
                    border: '1px solid rgba(178, 213, 229, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  <Upload size={26} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '15.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Bấm vào đây để chọn file Word (.docx) mẫu
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted-foreground)' }}>
                  Hệ thống sẽ quét sâu toàn bộ nội dung và phân tích các ô cần điền
                </p>
              </div>

              {/* Tips & Instructions */}
              <div
                style={{
                  marginTop: '18px',
                  padding: '14px 16px',
                  background: 'rgba(59, 130, 246, 0.06)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '10px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--primary)', fontWeight: 600, fontSize: '13px' }}>
                  <Sparkles size={16} />
                  <span>Cách chuẩn bị file Word cực nhanh:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--foreground)', lineHeight: '1.7' }}>
                  <li>
                    <strong>Cách 1 (Khuyên dùng):</strong> Bạn lấy bất kỳ văn bản Word thật nào của công ty, dùng chuột <strong>bôi chữ màu ĐỎ</strong> vào các chỗ cần thay đổi (tên khách hàng cũ, số hợp đồng, ngày tháng, tiền...). AI sẽ đọc ngữ cảnh xung quanh và tự động gán nhãn chính xác!
                  </li>
                  <li>
                    <strong>Cách 2:</strong> Bạn gõ sẵn các thẻ dạng <code>{'{ten_khach_hang}'}</code>, <code>{'{so_hd}'}</code>, <code>{'{tong_tien}'}</code> vào văn bản. Nếu là bảng lặp thì đặt <code>{'{#items}'}</code> ở đầu và <code>{'{/items}'}</code> ở cuối.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP 2: Analyzing Loading State */}
          {step === 'analyzing' && (
            <div style={{ textAlign: 'center', padding: '45px 20px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--primary)',
                  animation: 'spin 1s linear infinite'
                }}
              />
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>
                Đang phân tích cấu trúc văn bản...
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted-foreground)' }}>
                Đang quét các vùng bôi đỏ, thẻ placeholder và phân loại ngữ nghĩa trường...
              </p>
            </div>
          )}

          {/* STEP 3: Review & Configure Fields */}
          {step === 'review' && (
            <div>
              {/* Detection Banner */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: analysisResult?.isRedTextDetected
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${analysisResult?.isRedTextDetected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {analysisResult?.isRedTextDetected ? (
                    <Sparkles size={18} style={{ color: '#ef4444' }} />
                  ) : (
                    <CheckCircle2 size={18} style={{ color: '#10b981' }} />
                  )}
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>
                      {analysisResult?.isRedTextDetected
                        ? `🎉 AI đã phát hiện ${analysisResult.redFieldCount} vùng chữ bôi ĐỎ và đọc ngữ cảnh tự động!`
                        : `✨ Đã phát hiện ${analysisResult?.fields.length} trường từ thẻ trong văn bản!`}
                    </strong>
                    <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)' }}>
                      File gốc: <code>{selectedFilePath.split(/[\\/]/).pop()}</code>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSelectFile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 10px',
                    fontSize: '11.5px',
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--foreground)',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} />
                  Chọn file khác
                </button>
              </div>

              {/* Template Meta Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--foreground)' }}>
                    Tên mẫu văn bản <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="setting-input"
                    style={{ width: '100%', fontWeight: 600, fontSize: '13px' }}
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="VD: Biên Bản Nghiệm Thu & Bàn Giao..."
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '5px', color: 'var(--foreground)' }}>
                    Ghi chú / Mô tả mẫu (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    className="setting-input"
                    style={{ width: '100%', fontSize: '13px' }}
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="VD: Dùng cho các dự án cung cấp bê tông..."
                  />
                </div>
              </div>

              {/* Fields Table Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Danh Sách Các Trường Nhập Liệu ({fields.length} trường)
                </span>
                <button
                  type="button"
                  onClick={handleAddField}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
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
                  Thêm trường
                </button>
              </div>

              {/* Fields List */}
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  background: 'var(--background)'
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', width: '160px' }}>Mã biến (Tag)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', minWidth: '180px' }}>Nhãn hiển thị tiếng Việt</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', width: '200px' }}>Kiểu dữ liệu</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', width: '140px' }}>Nhóm</th>
                      <th style={{ padding: '8px 8px', textAlign: 'center', width: '50px' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field) => (
                      <tr key={field.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* Key */}
                        <td style={{ padding: '8px 10px' }}>
                          <code style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600 }}>
                            {`{${field.key}}`}
                          </code>
                        </td>

                        {/* Label */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="setting-input"
                            style={{ width: '100%', fontSize: '12px', padding: '5px 8px' }}
                            value={field.label}
                            onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                            placeholder="Nhãn tiếng Việt..."
                          />
                        </td>

                        {/* Type */}
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            value={field.type}
                            onChange={(e) => handleFieldChange(field.id, 'type', e.target.value as TemplateFieldType)}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '11.5px',
                              cursor: 'pointer'
                            }}
                          >
                            {FIELD_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.icon} {t.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Section */}
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            className="setting-input"
                            style={{ width: '100%', fontSize: '11.5px', padding: '5px 8px' }}
                            value={field.section || 'Thông tin chung'}
                            onChange={(e) => handleFieldChange(field.id, 'section', e.target.value)}
                          />
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(field.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--muted-foreground)',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px'
                            }}
                            title="Xóa trường này"
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
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
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--muted)'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 16px',
              fontSize: '12.5px',
              fontWeight: 500,
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              cursor: 'pointer'
            }}
          >
            Hủy bỏ
          </button>

          {step === 'review' && (
            <button
              type="button"
              onClick={handleSaveTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
            >
              <span>Lưu Mẫu & Bắt Đầu Điền Form</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
