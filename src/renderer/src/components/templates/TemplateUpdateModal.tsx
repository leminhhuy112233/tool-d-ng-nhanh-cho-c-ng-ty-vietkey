/**
 * VietKey DocGen — TemplateUpdateModal
 * Hộp thoại cập nhật phiên bản mới cho mẫu Word có sẵn, tự động lưu snapshot phiên bản cũ
 */

import { useState, useEffect } from 'react'
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
  FolderOpen,
  GitBranch,
  ShieldCheck
} from 'lucide-react'
import type { AnalyzedTemplateResult, TemplateField, TemplateFieldType, CustomTemplateDef } from '../../../../shared/types'

interface TemplateUpdateModalProps {
  isOpen: boolean
  template: CustomTemplateDef | null
  onClose: () => void
  onTemplateUpdated: (updatedTemplate: CustomTemplateDef) => void
}

const FIELD_TYPES: Array<{ value: TemplateFieldType; label: string; icon: string }> = [
  { value: 'text', label: 'Văn bản ngắn (Tên, Mã số, Đơn vị)', icon: '📝' },
  { value: 'currency', label: 'Số tiền / Đơn giá (Tự format VNĐ)', icon: '💰' },
  { value: 'date', label: 'Ngày tháng (Chọn lịch)', icon: '📅' },
  { value: 'number', label: 'Số lượng / Tỷ lệ %', icon: '🔢' },
  { value: 'textarea', label: 'Đoạn văn bản dài (Nội dung, Điều khoản)', icon: '📄' },
  { value: 'table', label: 'Bảng danh sách lặp (Thêm/Xóa dòng)', icon: '📊' }
]

export function TemplateUpdateModal({
  isOpen,
  template,
  onClose,
  onTemplateUpdated
}: TemplateUpdateModalProps) {
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [fields, setFields] = useState<TemplateField[]>([])
  const [changeNote, setChangeNote] = useState('')
  const [selectedFilePath, setSelectedFilePath] = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalyzedTemplateResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      setTemplateName(template.name || '')
      setTemplateDescription(template.description || '')
      setFields(template.fields ? JSON.parse(JSON.stringify(template.fields)) : [])
      setChangeNote('')
      setSelectedFilePath('')
      setAnalysisResult(null)
      setErrorMessage(null)
    }
  }, [template, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !template) return null

  const currentVersion = template.currentVersion || 1
  const nextVersion = currentVersion + 1

  const handleSelectNewFile = async () => {
    if (!window.api?.openFileDialog) return
    setErrorMessage(null)

    const path = await window.api.openFileDialog([
      { name: 'Word Document (*.docx)', extensions: ['docx'] }
    ])

    if (!path) return

    setSelectedFilePath(path)
    setIsAnalyzing(true)
    try {
      if (!window.api?.analyzeTemplate) {
        throw new Error('API phân tích template chưa sẵn sàng.')
      }

      const res = await window.api.analyzeTemplate(path)
      if (!res.success) {
        setErrorMessage(res.error || 'Không thể phân tích file Word mới này.')
        setIsAnalyzing(false)
        return
      }

      setAnalysisResult(res)
      if (res.fields && res.fields.length > 0) {
        // Tự động merge hoặc bổ sung trường mới
        setFields(res.fields)
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi phân tích file Word mới.')
    } finally {
      setIsAnalyzing(false)
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

  const handleSaveUpdate = async () => {
    if (!templateName.trim()) {
      setErrorMessage('Vui lòng nhập tên cho mẫu văn bản!')
      return
    }

    if (fields.length === 0) {
      setErrorMessage('Mẫu cần có ít nhất 1 trường dữ liệu để tạo form.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      if (!window.api?.updateCustomTemplate) {
        throw new Error('API cập nhật template chưa sẵn sàng.')
      }

      const rawFileName = selectedFilePath
        ? selectedFilePath.split(/[\\/]/).pop() || template.fileName
        : template.fileName

      const res = await window.api.updateCustomTemplate(
        template.id,
        {
          name: templateName.trim(),
          description: templateDescription.trim(),
          fileName: rawFileName,
          docxFilePath: selectedFilePath || template.docxFilePath,
          fields,
          isFromRedHighlight: analysisResult ? Boolean(analysisResult.isRedTextDetected) : template.isFromRedHighlight
        },
        analysisResult?.processedDocxBase64,
        changeNote.trim() || `Cập nhật mẫu lên phiên bản v${nextVersion}.0`
      )

      if (res.success && res.template) {
        onTemplateUpdated(res.template)
        onClose()
      } else {
        setErrorMessage(res.error || 'Không thể cập nhật phiên bản mới.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu phiên bản mới.')
    } finally {
      setIsSaving(false)
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
        padding: '24px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #1B365D 0%, #2A4D7D 100%)',
            color: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <GitBranch size={22} color="#FFB800" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                  Cập Nhật Phiên Bản Mẫu Mới
                </h3>
                <span
                  style={{
                    background: '#FFB800',
                    color: '#1B365D',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  v{currentVersion}.0 → v{nextVersion}.0
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.85 }}>
                Mẫu hiện tại: {template.name} • Tự động lưu snapshot phiên bản cũ để có thể rollback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                color: '#991B1B',
                fontSize: '13px'
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Thay đổi file Word (Tùy chọn) */}
          <div
            style={{
              padding: '16px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FileText size={22} color="#1B365D" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  {selectedFilePath ? selectedFilePath.split(/[\\/]/).pop() : template.fileName}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {selectedFilePath ? 'Đã chọn file Word mới để thay thế' : 'Đang sử dụng file Word hiện tại'}
                </div>
              </div>
            </div>

            <button
              onClick={handleSelectNewFile}
              disabled={isAnalyzing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#1B365D',
                fontSize: '13px',
                fontWeight: 600,
                cursor: isAnalyzing ? 'not-allowed' : 'pointer'
              }}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang phân tích...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Thay bằng File Word Khác</span>
                </>
              )}
            </button>
          </div>

          {/* Ghi chú thay đổi (Change Note) */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Ghi chú phiên bản v{nextVersion}.0 <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="VD: Cập nhật điều khoản thanh toán, bổ sung số điện thoại liên hệ..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b' }}>
              Ghi chú giúp bạn và đồng nghiệp nhận biết sự khác biệt giữa các phiên bản khi cần xem lại lịch sử hoặc Rollback.
            </p>
          </div>

          {/* Tên và Mô tả */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Tên Mẫu Văn Bản <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Mô tả vắn tắt
              </label>
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Nhập ghi chú hoặc mô tả mẫu..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Danh sách trường dữ liệu */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="#1B365D" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                  Danh Sách Trường Dữ Liệu ({fields.length} trường)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddField}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  color: '#1B365D',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                <span>Thêm trường dữ liệu</span>
              </button>
            </div>

            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                overflow: 'hidden',
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '8px 12px', width: '30%' }}>Mã biến (Tag trong Word)</th>
                    <th style={{ padding: '8px 12px', width: '30%' }}>Tên nhãn hiển thị</th>
                    <th style={{ padding: '8px 12px', width: '25%' }}>Loại trường</th>
                    <th style={{ padding: '8px 12px', width: '15%', textAlign: 'center' }}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 12px' }}>
                        <code style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                          {`{${field.key}}`}
                        </code>
                      </td>
                      <td style={{ padding: '6px 12px' }}>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 12px' }}>
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(field.id, 'type', e.target.value as TemplateFieldType)}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: '#ffffff'
                          }}
                        >
                          {FIELD_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.icon} {t.label.split(' ')[0]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
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

          <div
            style={{
              padding: '12px 16px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: '#166534'
            }}
          >
            <ShieldCheck size={18} color="#16a34a" />
            <span>
              <strong>Bảo đảm an toàn:</strong> Phiên bản hiện tại (v{currentVersion}.0) sẽ được tự động lưu trữ trong thư mục lịch sử và bạn có thể khôi phục lại bất kỳ lúc nào nếu phiên bản mới có sự cố.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            background: '#f8fafc'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSaveUpdate}
            disabled={isSaving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #1B365D 0%, #2A4D7D 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(27, 54, 93, 0.2)'
            }}
          >
            {isSaving ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Đang nâng cấp...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Lưu & Nâng Cấp Lên v{nextVersion}.0</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
