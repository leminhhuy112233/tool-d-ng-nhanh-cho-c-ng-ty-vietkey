import { useState, useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { LoadingOverlay } from '../components/common/LoadingOverlay'
import { ExportConfigSection } from '../components/common/ExportConfigSection'
import { FloatingExportBar } from '../components/common/FloatingExportBar'
import {
  FileText,
  Sparkles,
  Download,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Layers,
  ExternalLink,
  Folder,
  Percent,
  RotateCcw
} from 'lucide-react'
import type { QuotationData, QuotationItem, ExportFileType, PartnerProfile } from '../../../shared/types'
import { playSuccessChime } from '../lib/sound'

// Common Quotation Units
const COMMON_UNITS = ['M³', 'Tấn', 'Bao', 'Cái', 'Bộ', 'Kg', 'Chuyến', 'Khác...']

// Helper tính đơn giá sau khi tăng % (làm tròn số nguyên chuẩn VNĐ)
export const calculatePriceWithPercent = (basePrice: string, percentStr: string): string => {
  const cleanDigits = (basePrice || '').replace(/[^0-9]/g, '')
  if (!cleanDigits) return ''
  const baseNum = Number(cleanDigits)
  const pct = parseFloat((percentStr || '').replace(',', '.'))
  if (isNaN(pct) || pct === 0) {
    return baseNum.toLocaleString('vi-VN')
  }
  const finalPrice = Math.round(baseNum * (1 + pct / 100))
  return finalPrice.toLocaleString('vi-VN')
}

export function QuotationForm() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual')
  const [rawText, setRawText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Tăng % đồng loạt cho toàn bảng
  const [batchPercent, setBatchPercent] = useState('')

  // Partner Memory Suggestions
  const [savedPartners, setSavedPartners] = useState<PartnerProfile[]>([])
  const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false)

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error'
    text: string
    filePath?: string
    pdfPath?: string
  } | null>(null)

  // Current date
  const today = new Date()
  const currentDay = String(today.getDate()).padStart(2, '0')
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
  const currentYear = String(today.getFullYear())

  // Initial clean empty quotation item
  const initialItems: QuotationItem[] = [
    { id: '1', stt: '01', ten_hang: '', don_vi: 'M³', don_gia: '', phan_tram_tang: '', don_gia_sau_tang: '' }
  ]

  const [formData, setFormData] = useState<QuotationData>({
    ngay: currentDay,
    thang: currentMonth,
    nam: currentYear,
    ten_khach_hang: '',
    file_name: 'BaoGia.docx',
    export_dir: '',
    export_type: 'word',
    items: initialItems
  })

  // Load saved partners & export directory
  useEffect(() => {
    const initData = async () => {
      if (window.api?.getSetting) {
        try {
          const dir = await window.api.getSetting('defaultExportDir')
          if (dir) {
            setFormData((prev) => ({ ...prev, export_dir: dir }))
          }
        } catch (err) {
          console.error('Lỗi đọc settings:', err)
        }
      }
      if (window.api?.getPartners) {
        try {
          const partners = await window.api.getPartners()
          setSavedPartners(partners || [])
        } catch (err) {
          console.error('Lỗi đọc danh sách khách hàng cũ:', err)
        }
      }
    }
    initData()
  }, [])

  // Keyboard Shortcut Listener: Ctrl + Enter to Export
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        handleExportDocx()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formData])

  const showToast = (
    type: 'success' | 'error',
    text: string,
    filePath?: string,
    pdfPath?: string
  ) => {
    setToastMessage({ type, text, filePath, pdfPath })
    if (type === 'success') {
      playSuccessChime()
    }
    setTimeout(() => setToastMessage(null), 7000)
  }

  const handleFillToday = () => {
    setFormData((prev) => ({
      ...prev,
      ngay: currentDay,
      thang: currentMonth,
      nam: currentYear
    }))
    showToast('success', 'Đã cập nhật ngày báo giá hôm nay!')
  }

  const handleCustomerChange = (val: string) => {
    setFormData((prev) => {
      const cleanName = val.replace(/CÔNG TY/gi, '').replace(/[\\/:*?"<>|]/g, '').trim()
      const suggestedName = cleanName ? `BaoGia_${cleanName}.docx` : 'BaoGia.docx'
      return {
        ...prev,
        ten_khach_hang: val,
        file_name: prev.file_name && !prev.file_name.includes('BaoGia') ? prev.file_name : suggestedName
      }
    })
    setShowPartnerSuggestions(true)
  }

  const selectPartnerSuggestion = (partner: PartnerProfile) => {
    handleCustomerChange(partner.ten_cong_ty)
    setShowPartnerSuggestions(false)
  }

  // Row Management
  const handleAddItem = () => {
    setFormData((prev) => {
      const nextStt = String(prev.items.length + 1).padStart(2, '0')
      const newItem: QuotationItem = {
        id: String(Date.now()),
        stt: nextStt,
        ten_hang: '',
        don_vi: 'M³',
        don_gia: '',
        phan_tram_tang: batchPercent || '',
        don_gia_sau_tang: ''
      }
      return { ...prev, items: [...prev.items, newItem] }
    })
  }

  const handleRemoveItem = (id: string) => {
    setFormData((prev) => {
      const filtered = prev.items.filter((item) => item.id !== id)
      const renumbered = filtered.map((item, idx) => ({
        ...item,
        stt: String(idx + 1).padStart(2, '0')
      }))
      return { ...prev, items: renumbered }
    })
  }

  const handleItemChange = (id: string, field: keyof QuotationItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== id) return item

        if (field === 'don_gia') {
          const cleanNum = value.replace(/[^0-9]/g, '')
          const formatted = cleanNum ? Number(cleanNum).toLocaleString('vi-VN') : ''
          const computedFinal = calculatePriceWithPercent(formatted, item.phan_tram_tang || '')
          return {
            ...item,
            don_gia: formatted,
            don_gia_sau_tang: computedFinal
          }
        }

        if (field === 'phan_tram_tang') {
          const cleanPct = value.replace(/[^0-9.,-]/g, '')
          const computedFinal = calculatePriceWithPercent(item.don_gia, cleanPct)
          return {
            ...item,
            phan_tram_tang: cleanPct,
            don_gia_sau_tang: computedFinal
          }
        }

        if (field === 'don_gia_sau_tang') {
          const cleanNum = value.replace(/[^0-9]/g, '')
          const formatted = cleanNum ? Number(cleanNum).toLocaleString('vi-VN') : ''
          return {
            ...item,
            don_gia_sau_tang: formatted
          }
        }

        return { ...item, [field]: value }
      })
    }))
  }

  // Tăng % đồng loạt cho tất cả các hàng hóa
  const handleApplyBatchPercent = (pctValue: string) => {
    if (pctValue === '') return
    const cleanPct = pctValue.trim()
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const computedFinal = calculatePriceWithPercent(item.don_gia, cleanPct)
        return {
          ...item,
          phan_tram_tang: cleanPct,
          don_gia_sau_tang: computedFinal
        }
      })
    }))
    showToast('success', `Đã áp dụng tăng ${cleanPct}% cho toàn bộ ${formData.items.length} mặt hàng!`)
  }

  // Đặt lại giá gốc (0% tăng)
  const handleResetPercent = () => {
    setBatchPercent('')
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        phan_tram_tang: '',
        don_gia_sau_tang: item.don_gia
      }))
    }))
    showToast('success', 'Đã đặt lại % tăng về 0 (khôi phục giá gốc)!')
  }

  const handleBrowseExportDir = async () => {
    if (!window.api?.openDirectoryDialog) {
      showToast('error', 'Ứng dụng cần chạy trong Desktop Client Electron.')
      return
    }
    const dir = await window.api.openDirectoryDialog()
    if (dir) {
      setFormData((prev) => ({ ...prev, export_dir: dir }))
      showToast('success', `Đã chọn thư mục: ${dir}`)
    }
  }

  // AI Parse Quotation
  const handleAIParse = async () => {
    if (!rawText.trim()) {
      showToast('error', 'Vui lòng dán danh sách hàng hóa vào trước!')
      return
    }

    if (!window.api?.parseQuotationTextWithAI) {
      showToast('error', 'Chức năng AI cần chạy trong Desktop Client Electron.')
      return
    }

    setIsParsing(true)
    try {
      const parsed = await window.api.parseQuotationTextWithAI(rawText)

      setFormData((prev) => {
        const next = { ...prev }
        if (parsed.ten_khach_hang) next.ten_khach_hang = parsed.ten_khach_hang
        if (parsed.items && parsed.items.length > 0) {
          next.items = parsed.items.map((it, idx) => {
            const pct = batchPercent || ''
            const finalPrice = it.don_gia ? calculatePriceWithPercent(it.don_gia, pct) : ''
            return {
              ...it,
              id: String(Date.now() + idx),
              stt: String(idx + 1).padStart(2, '0'),
              phan_tram_tang: pct,
              don_gia_sau_tang: finalPrice || it.don_gia || ''
            }
          })
        }
        return next
      })

      showToast('success', 'AI đã bóc tách danh sách hàng hóa thành công!')
    } catch (err) {
      showToast('error', 'Có lỗi xảy ra khi phân tích dữ liệu.')
    } finally {
      setIsParsing(false)
    }
  }

  // Export Document Handler (Word / PDF / Both)
  const handleExportDocx = async () => {
    if (!formData.items || formData.items.length === 0) {
      showToast('error', 'Vui lòng thêm ít nhất 1 hàng hóa vào danh sách!')
      return
    }

    if (!window.api?.exportQuotation) {
      showToast('error', 'Vui lòng chạy ứng dụng bằng lệnh "npm run dev" trong Terminal!')
      return
    }

    setIsExporting(true)

    // Pre-Export Validation Check
    const newErrors: Record<string, boolean> = {}
    if (!formData.ten_khach_hang.trim()) newErrors.ten_khach_hang = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showToast('error', '⚠️ Vui lòng kiểm tra các ô màu đỏ chưa điền thông tin trước khi xuất!')
      setIsExporting(false)
      return
    }
    setErrors({})
    try {
      let targetFilePath = ''
      let fileName = formData.file_name.trim() || 'BaoGia.docx'
      if (!fileName.toLowerCase().endsWith('.docx')) {
        fileName += '.docx'
      }

      if (formData.export_dir && formData.export_dir.trim()) {
        targetFilePath = `${formData.export_dir.replace(/[\/\\]+$/, '')}\\${fileName}`
      } else {
        const selectedPath = await window.api.saveFileDialog(fileName, [
          { name: 'Word Document (*.docx)', extensions: ['docx'] }
        ])

        if (!selectedPath) {
          setIsExporting(false)
          return
        }
        targetFilePath = selectedPath
      }

      // Save partner profile to memory store
      if (formData.ten_khach_hang && window.api?.savePartner) {
        window.api.savePartner({
          ten_cong_ty: formData.ten_khach_hang,
          mst: '',
          dai_dien: '',
          xung_danh: 'Ông',
          chuc_vu: 'Giám đốc',
          dia_chi: '',
          tai_khoan: ''
        })
      }

      // Chuẩn bị dữ liệu xuất: gửi đơn giá cuối cùng sau tăng % vào template Word/PDF
      const preparedData: QuotationData = {
        ...formData,
        items: formData.items.map((it) => ({
          ...it,
          don_gia: (it.don_gia_sau_tang && it.don_gia_sau_tang.trim() !== '') ? it.don_gia_sau_tang : (it.don_gia || '0')
        }))
      }

      const res = await window.api.exportQuotation(preparedData, targetFilePath)

      if (res.success) {
        let msg = ''
        if (formData.export_type === 'word') {
          msg = `Đã xuất file Báo Giá Word thành công!`
        } else if (formData.export_type === 'pdf') {
          msg = `Đã xuất file Báo Giá PDF thành công!`
        } else {
          msg = `Đã xuất cả 2 file (Word & PDF) thành công!`
        }
        showToast('success', msg, res.filePath || targetFilePath, res.pdfPath)
      } else {
        showToast('error', res.error || 'Lỗi khi xuất file Báo giá.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Có lỗi xảy ra khi tạo file Báo giá.')
    } finally {
      setIsExporting(false)
    }
  }

  // Filter partner suggestions
  const filteredPartners = savedPartners.filter((p) =>
    p.ten_cong_ty.toLowerCase().includes(formData.ten_khach_hang.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* High-tech Animated Loading Overlay */}
      <LoadingOverlay
        isVisible={isExporting}
        title="Đang tạo file Báo Giá..."
        subtitle={`Đang xử lý xuất file định dạng ${formData.export_type.toUpperCase()}...`}
        type="export"
      />
      <LoadingOverlay
        isVisible={isParsing}
        title="AI đang bóc tách văn bản..."
        subtitle="Vui lòng chờ AI tự động phân tích và tạo danh sách..."
        type="ai"
      />

      <PageHeader
        title="Bảng Báo Giá"
        description="Quản lý danh sách hàng hóa, đơn giá và xuất file Báo giá (Word / PDF / Cả 2) chuyên nghiệp"
      >
        <button
          onClick={handleExportDocx}
          disabled={isExporting}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(178, 213, 229, 0.4)',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <Download size={18} color="var(--primary-foreground)" />
          {isExporting ? 'Đang xuất file...' : `Xuất Báo Giá (${formData.export_type.toUpperCase()})`}
        </button>
      </PageHeader>

      {/* Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '8px 12px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'manual' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'manual' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <FileText size={16} />
            Nhập bảng thủ công
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'ai' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
              color: activeTab === 'ai' ? '#ffffff' : 'var(--muted-foreground)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} />
            Dán văn bản (AI điền nhanh)
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginRight: '4px' }}>
            Phím tắt: <kbd style={{ background: 'var(--muted)', padding: '2px 5px', borderRadius: '4px' }}>Ctrl+Enter</kbd> để xuất
          </span>
          <button
            onClick={handleFillToday}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Calendar size={14} />
            Hôm nay
          </button>
        </div>
      </div>

      {/* AI Assistant Section */}
      {activeTab === 'ai' && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08))',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                color: '#fff'
              }}
            >
              <Wand2 size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                AI Bóc tách bảng báo giá
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Dán danh sách vật tư (ví dụ: Đá 1x2 - M3 - 580.000) vào đây để AI tự tạo bảng
              </p>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Dán nội dung Zalo, email hoặc thông tin đối tác vào đây..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '13px',
              fontFamily: "'Inter', sans-serif",
              resize: 'vertical',
              outline: 'none',
              lineHeight: 1.5,
              marginBottom: '12px'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              onClick={() => setRawText('')}
              style={{
                padding: '7px 14px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12.5px',
                color: 'var(--muted-foreground)',
                cursor: 'pointer'
              }}
            >
              Xóa
            </button>
            <button
              onClick={handleAIParse}
              disabled={isParsing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={15} />
              {isParsing ? 'Đang phân tích...' : 'Phân tích & Tự điền bảng'}
            </button>
          </div>
        </div>
      )}

      {/* Main Quotation Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* GROUP 0: CẤU HÌNH FILE & ĐỊNH DẠNG XUẤT */}
        <ExportConfigSection
          fileName={formData.file_name}
          onChangeFileName={(val) => setFormData((prev) => ({ ...prev, file_name: val }))}
          exportType={formData.export_type}
          onChangeExportType={(type) => setFormData((prev) => ({ ...prev, export_type: type }))}
          exportDir={formData.export_dir}
          onBrowseExportDir={handleBrowseExportDir}
          defaultFileNamePlaceholder="BaoGia.docx"
        />

        {/* GROUP 1: Thông tin khách hàng & Ngày báo giá */}
        <div className="settings-section" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Layers size={18} color="var(--primary)" />
            <div>
              <h3>1. Thông tin chung Báo Giá</h3>
              <p style={{ margin: 0 }}>Tên khách hàng và ngày báo giá (Tự nhớ khách hàng cũ)</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Kính gửi (Tên khách hàng / Đơn vị nhận báo giá) <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                type="text"
                className={errors.ten_khach_hang ? 'setting-input input-error' : 'setting-input'}
                style={{ width: '100%', fontWeight: 600 }}
                value={formData.ten_khach_hang}
                onChange={(e) => {
                  if (errors.ten_khach_hang) setErrors((prev) => ({ ...prev, ten_khach_hang: false }))
                  handleCustomerChange(e.target.value)
                }}
                onFocus={() => setShowPartnerSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPartnerSuggestions(false), 200)}
                placeholder="Nhập tên khách hàng..."
              />

              {/* Partner Memory Autocomplete Dropdown */}
              {showPartnerSuggestions && filteredPartners.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    zIndex: 100
                  }}
                >
                  <div style={{ padding: '6px 12px', fontSize: '11px', color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
                    💡 Khách hàng từng lưu trong hệ thống (Click để chọn nhanh):
                  </div>
                  {filteredPartners.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => selectPartnerSuggestion(p)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {p.ten_cong_ty}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Ngày báo giá
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '55px', textAlign: 'center' }}
                  value={formData.ngay}
                  onChange={(e) => setFormData((p) => ({ ...p, ngay: e.target.value }))}
                />
                <span style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>/</span>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '55px', textAlign: 'center' }}
                  value={formData.thang}
                  onChange={(e) => setFormData((p) => ({ ...p, thang: e.target.value }))}
                />
                <span style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>/</span>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '75px', textAlign: 'center' }}
                  value={formData.nam}
                  onChange={(e) => setFormData((p) => ({ ...p, nam: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GROUP 2: BẢNG DANH SÁCH HÀNG HÓA */}
        <div className="settings-section">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '15px' }}>2. Bảng Danh Sách Hàng Hóa ({formData.items.length} hạng mục)</h3>
              <p style={{ margin: 0, fontSize: '12px' }}>Chỉnh sửa tên hàng hóa, chọn đơn vị, nhập đơn giá và tỷ lệ tăng %</p>
            </div>

            <button
              onClick={handleAddItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={16} color="var(--primary-foreground)" />
              Thêm hàng hóa
            </button>
          </div>

          {/* Thanh công cụ Tăng % đồng loạt cho toàn bảng */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '10px 14px',
              marginBottom: '16px',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--foreground)'
                }}
              >
                <Percent size={15} color="var(--accent)" />
                <span>Tăng % đồng loạt toàn bảng:</span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  className="setting-input"
                  style={{
                    width: '75px',
                    textAlign: 'center',
                    padding: '4px 22px 4px 6px',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                  value={batchPercent}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9.,-]/g, '')
                    setBatchPercent(clean)
                  }}
                  placeholder="20"
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '8px',
                    fontSize: '12px',
                    color: 'var(--muted-foreground)',
                    fontWeight: 600,
                    pointerEvents: 'none'
                  }}
                >
                  %
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleApplyBatchPercent(batchPercent)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 12px',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Áp dụng tất cả
              </button>

              {/* Nút chọn nhanh % */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Chọn nhanh:</span>
                {['5', '10', '15', '20', '25'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setBatchPercent(p)
                      handleApplyBatchPercent(p)
                    }}
                    style={{
                      padding: '2px 7px',
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      cursor: 'pointer'
                    }}
                    title={`Tăng +${p}% cho toàn bộ danh sách`}
                  >
                    +{p}%
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetPercent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                cursor: 'pointer'
              }}
              title="Khôi phục tất cả về đơn giá gốc (0% tăng)"
            >
              <RotateCcw size={13} />
              Đặt lại giá gốc (0%)
            </button>
          </div>

          {/* Dynamic Table */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--muted)',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <th style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', width: '50px', textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left' }}>Tên Hàng Hóa</th>
                  <th style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', width: '130px', textAlign: 'center' }}>Đơn Vị (Chọn)</th>
                  <th style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', width: '145px', textAlign: 'right' }}>Đơn Giá (VNĐ)</th>
                  <th style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', width: '85px', textAlign: 'center' }}>+ % Tăng</th>
                  <th style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', width: '165px', textAlign: 'right', color: 'var(--foreground)' }}>Giá Sau Tăng (VNĐ)</th>
                  <th style={{ padding: '10px', textTransform: 'uppercase', fontSize: '11px', width: '45px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    {/* STT */}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{ width: '42px', textAlign: 'center', padding: '6px 2px' }}
                        value={item.stt}
                        onChange={(e) => handleItemChange(item.id, 'stt', e.target.value)}
                      />
                    </td>

                    {/* Tên Hàng Hóa */}
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{ width: '100%', fontWeight: 500 }}
                        value={item.ten_hang}
                        onChange={(e) => handleItemChange(item.id, 'ten_hang', e.target.value)}
                        placeholder="VD: Gạch không nung 40x80x180"
                      />
                    </td>

                    {/* Đơn Vị */}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      {COMMON_UNITS.includes(item.don_vi) ? (
                        <select
                          value={item.don_vi}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === 'Khác...') {
                              handleItemChange(item.id, 'don_vi', '')
                            } else {
                              handleItemChange(item.id, 'don_vi', val)
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '7px 8px',
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontSize: '12.5px',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="text"
                            className="setting-input"
                            style={{ width: '80px', textAlign: 'center' }}
                            value={item.don_vi}
                            onChange={(e) => handleItemChange(item.id, 'don_vi', e.target.value)}
                            placeholder="Nhập..."
                          />
                          <button
                            onClick={() => handleItemChange(item.id, 'don_vi', 'M³')}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              color: 'var(--muted-foreground)'
                            }}
                            title="Chọn lại danh sách"
                          >
                            ↩
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Đơn Giá Gốc */}
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{ width: '135px', textAlign: 'right', fontWeight: 600 }}
                        value={item.don_gia}
                        onChange={(e) => handleItemChange(item.id, 'don_gia', e.target.value)}
                        placeholder="1.340"
                      />
                    </td>

                    {/* + % Tăng */}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', width: '75px' }}>
                        <input
                          type="text"
                          className="setting-input"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '6px 18px 6px 4px',
                            fontWeight: 600,
                            color: item.phan_tram_tang && Number(item.phan_tram_tang) !== 0 ? 'var(--primary-foreground)' : 'var(--foreground)',
                            background: item.phan_tram_tang && Number(item.phan_tram_tang) !== 0 ? 'var(--primary)' : 'var(--background)'
                          }}
                          value={item.phan_tram_tang || ''}
                          onChange={(e) => handleItemChange(item.id, 'phan_tram_tang', e.target.value)}
                          placeholder="0"
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: item.phan_tram_tang && Number(item.phan_tram_tang) !== 0 ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                            pointerEvents: 'none'
                          }}
                        >
                          %
                        </span>
                      </div>
                    </td>

                    {/* Giá Sau Tăng (Tự động tính) */}
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{
                          width: '150px',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          color: (item.phan_tram_tang && Number(item.phan_tram_tang) > 0) ? '#10b981' : 'var(--foreground)',
                          background: (item.phan_tram_tang && Number(item.phan_tram_tang) > 0) ? 'rgba(16, 185, 129, 0.08)' : 'var(--background)',
                          borderColor: (item.phan_tram_tang && Number(item.phan_tram_tang) > 0) ? 'rgba(16, 185, 129, 0.35)' : 'var(--border)'
                        }}
                        value={(item.don_gia_sau_tang !== undefined && item.don_gia_sau_tang !== '') ? item.don_gia_sau_tang : item.don_gia}
                        onChange={(e) => handleItemChange(item.id, 'don_gia_sau_tang', e.target.value)}
                        placeholder="1.608"
                        title={item.phan_tram_tang ? `Giá gốc ${item.don_gia} + ${item.phan_tram_tang}%` : 'Giá xuất báo giá'}
                      />
                    </td>

                    {/* Xóa Row */}
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--muted-foreground)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title="Xóa dòng này"
                        onMouseOver={(e) => (e.currentTarget.style.color = 'var(--destructive)')}
                        onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Export Button Bar */}
      <FloatingExportBar
        title={`Báo Giá: ${formData.ten_khach_hang || 'Quý khách hàng!'}`}
        itemBadge={`${formData.items.length} mặt hàng`}
        exportType={formData.export_type}
        fileName={formData.file_name}
        isExporting={isExporting}
        onExport={handleExportDocx}
        buttonLabel={isExporting ? 'Đang tạo file...' : `Tạo & Xuất Báo Giá (${formData.export_type.toUpperCase()})`}
      />

      {/* Rich Interactive Toast Notification with Quick Actions */}
      {toastMessage && (
        <div
          className="toast"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderColor: toastMessage.type === 'error' ? 'var(--destructive)' : '#10b981',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : (
              <AlertCircle size={18} color="var(--destructive)" />
            )}
            <span style={{ fontWeight: 600 }}>{toastMessage.text}</span>
          </div>

          {/* Action buttons if export succeeded */}
          {toastMessage.type === 'success' && (toastMessage.filePath || toastMessage.pdfPath) && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {toastMessage.filePath && (
                <button
                  onClick={() => window.api?.openPath(toastMessage.filePath!)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={14} color="var(--primary-foreground)" /> Mở file Word
                </button>
              )}

              {toastMessage.pdfPath && (
                <button
                  onClick={() => window.api?.openPath(toastMessage.pdfPath!)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={14} color="#ffffff" /> Mở file PDF
                </button>
              )}

              <button
                onClick={() => window.api?.showItemInFolder(toastMessage.filePath || toastMessage.pdfPath!)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  background: 'var(--muted)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <Folder size={14} /> Mở thư mục
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
