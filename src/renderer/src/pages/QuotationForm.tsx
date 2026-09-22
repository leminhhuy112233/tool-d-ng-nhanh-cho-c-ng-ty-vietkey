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
  RotateCcw,
  Copy,
  ChevronUp,
  ChevronDown,
  Calculator,
  Receipt,
  CheckSquare,
  Square
} from 'lucide-react'
import type { QuotationData, QuotationItem, ExportFileType, PartnerProfile } from '../../../shared/types'
import { numberToVietnameseWords } from '../../../shared/number-to-words'
import { playSuccessChime } from '../lib/sound'
import { useFormDraftsStore } from '../stores/formDrafts.store'

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
  // Thuế VAT (0%, 8%, 10%)
  const [vatRate, setVatRate] = useState<number>(10)

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

  // Form Draft Persistence Store (giữ nguyên dữ liệu khi chuyển tab)
  const formData = useFormDraftsStore((s) => s.quotationDraft)
  const setFormData = useFormDraftsStore((s) => s.setQuotationDraft)
  const resetQuotationDraft = useFormDraftsStore((s) => s.resetQuotationDraft)

  const handleClearAllData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin đang điền trong bảng báo giá để làm mới?')) {
      resetQuotationDraft()
      setBatchPercent('')
      showToast('success', 'Đã xóa toàn bộ thông tin và làm mới bảng báo giá!')
    }
  }

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
        ghi_chu: '',
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

  const handleDuplicateItem = (id: string) => {
    setFormData((prev) => {
      const idx = prev.items.findIndex((item) => item.id === id)
      if (idx === -1) return prev
      const itemToClone = prev.items[idx]
      const cloned: QuotationItem = {
        ...itemToClone,
        id: String(Date.now() + Math.floor(Math.random() * 1000))
      }
      const newItems = [...prev.items]
      newItems.splice(idx + 1, 0, cloned)
      const renumbered = newItems.map((item, i) => ({
        ...item,
        stt: String(i + 1).padStart(2, '0')
      }))
      return { ...prev, items: renumbered }
    })
    showToast('success', 'Đã nhân bản dòng mặt hàng!')
  }

  const handleMoveItem = (idx: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= prev.items.length) return prev
      const newItems = [...prev.items]
      const temp = newItems[idx]
      newItems[idx] = newItems[targetIdx]
      newItems[targetIdx] = temp
      const renumbered = newItems.map((item, i) => ({
        ...item,
        stt: String(i + 1).padStart(2, '0')
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
              ghi_chu: it.ghi_chu || '',
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

      // Chuẩn bị dữ liệu xuất: gửi đơn giá cuối cùng sau tăng % và cột ghi chú (nếu bật) vào template Word/PDF
      const isWithNotes = Boolean(formData.co_ghi_chu)
      const preparedData: QuotationData = {
        ...formData,
        co_ghi_chu: isWithNotes,
        items: formData.items.map((it) => ({
          ...it,
          ghi_chu: it.ghi_chu || '',
          don_gia: (it.don_gia_sau_tang && it.don_gia_sau_tang.trim() !== '') ? it.don_gia_sau_tang : (it.don_gia || '0')
        }))
      }

      console.log(`[QuotationForm] Gửi yêu cầu xuất báo giá: co_ghi_chu = ${isWithNotes}`, preparedData)
      const res = await window.api.exportQuotation(preparedData, targetFilePath)

      if (res.success) {
        let msg = ''
        const templateBadge = isWithNotes ? ' (Mẫu 5 cột - Có Ghi chú)' : ' (Mẫu 4 cột tiêu chuẩn)'
        if (formData.export_type === 'word') {
          msg = `Đã xuất file Báo Giá Word thành công!${templateBadge}`
        } else if (formData.export_type === 'pdf') {
          msg = `Đã xuất file Báo Giá PDF thành công!${templateBadge}`
        } else {
          msg = `Đã xuất cả 2 file (Word & PDF) thành công!${templateBadge}`
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

  // Quotation Financial Totals
  const subtotal = formData.items.reduce((sum, it) => {
    const priceStr = (it.don_gia_sau_tang && it.don_gia_sau_tang.trim() !== '') ? it.don_gia_sau_tang : it.don_gia
    const cleanNum = Number((priceStr || '').replace(/[^0-9]/g, ''))
    return sum + (isNaN(cleanNum) ? 0 : cleanNum)
  }, 0)

  const vatAmount = Math.round((subtotal * vatRate) / 100)
  const grandTotal = subtotal + vatAmount
  const grandTotalInWords = grandTotal > 0 ? numberToVietnameseWords(grandTotal) + ' đồng' : 'Không đồng'

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleClearAllData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'var(--card)',
              color: 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Xóa toàn bộ thông tin đã điền và làm mới bảng báo giá"
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--destructive)'
              e.currentTarget.style.borderColor = 'var(--destructive)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--muted-foreground)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <RotateCcw size={15} />
            Xóa toàn bộ thông tin
          </button>

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
        </div>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Lựa chọn thêm cột Ghi chú */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !formData.co_ghi_chu
                  setFormData((prev) => ({ ...prev, co_ghi_chu: nextVal }))
                  showToast('success', nextVal ? 'Đã bật cột Ghi Chú (xuất bảng 5 cột)!' : 'Đã tắt cột Ghi Chú (xuất bảng 4 cột tiêu chuẩn)!')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 14px',
                  background: formData.co_ghi_chu ? 'var(--primary)' : 'var(--muted)',
                  border: formData.co_ghi_chu ? '1px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: formData.co_ghi_chu ? 'var(--primary-foreground)' : 'var(--foreground)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: formData.co_ghi_chu ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}
                title={formData.co_ghi_chu ? 'Đang bật: Xuất bảng 5 cột (có Ghi Chú). Nhấp để tắt.' : 'Đang tắt: Xuất bảng 4 cột tiêu chuẩn. Nhấp để bật.'}
              >
                {formData.co_ghi_chu ? (
                  <CheckSquare size={15} style={{ strokeWidth: 2.5 }} />
                ) : (
                  <Square size={15} style={{ opacity: 0.7 }} />
                )}
                <span>{formData.co_ghi_chu ? 'Cột Ghi Chú (Đang bật)' : '+ Cột Ghi Chú'}</span>
              </button>

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
          {/* Dynamic Table with Responsive Layout & MinWidth */}
          <div
            style={{
              overflowX: 'auto',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <table
              style={{
                width: '100%',
                minWidth: formData.co_ghi_chu ? '1150px' : '960px',
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
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '11px', width: '46px', textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '10px 10px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left', minWidth: '260px' }}>
                    Tên Hàng Hóa
                  </th>
                  {formData.co_ghi_chu && (
                    <th
                      style={{
                        padding: '10px 10px',
                        textTransform: 'uppercase',
                        fontSize: '11px',
                        width: '210px',
                        minWidth: '180px',
                        textAlign: 'left',
                        color: 'var(--primary)',
                        background: 'rgba(59, 130, 246, 0.05)',
                        borderLeft: '1px solid var(--border)'
                      }}
                    >
                      Ghi Chú (Quy Cách)
                    </th>
                  )}
                  <th style={{ padding: '10px 6px', textTransform: 'uppercase', fontSize: '11px', width: '105px', textAlign: 'center' }}>Đơn Vị</th>
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '11px', width: '130px', textAlign: 'right' }}>Đơn Giá (VNĐ)</th>
                  <th style={{ padding: '10px 6px', textTransform: 'uppercase', fontSize: '11px', width: '75px', textAlign: 'center' }}>+ % Tăng</th>
                  <th style={{ padding: '10px 8px', textTransform: 'uppercase', fontSize: '11px', width: '145px', textAlign: 'right', color: 'var(--foreground)' }}>Giá Sau Tăng (VNĐ)</th>
                  <th style={{ padding: '10px 6px', textTransform: 'uppercase', fontSize: '11px', width: '100px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* STT */}
                    <td style={{ padding: '8px 6px', textAlign: 'center', width: '46px' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{ width: '38px', textAlign: 'center', padding: '6px 2px', fontWeight: 600 }}
                        value={item.stt}
                        onChange={(e) => handleItemChange(item.id, 'stt', e.target.value)}
                      />
                    </td>

                    {/* Tên Hàng Hóa - Luôn rộng rãi, không bao giờ bị ép */}
                    <td style={{ padding: '8px 10px', minWidth: '260px' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{ width: '100%', fontWeight: 500, boxSizing: 'border-box' }}
                        value={item.ten_hang}
                        onChange={(e) => handleItemChange(item.id, 'ten_hang', e.target.value)}
                        placeholder="VD: Gạch không nung 40x80x180 mác 75..."
                      />
                    </td>

                    {/* Ghi Chú (Tùy chọn hiển thị) */}
                    {formData.co_ghi_chu && (
                      <td
                        style={{
                          padding: '8px 10px',
                          width: '210px',
                          minWidth: '180px',
                          background: 'rgba(59, 130, 246, 0.02)',
                          borderLeft: '1px solid var(--border)'
                        }}
                      >
                        <input
                          type="text"
                          className="setting-input"
                          style={{ width: '100%', fontSize: '12.5px', boxSizing: 'border-box' }}
                          value={item.ghi_chu || ''}
                          onChange={(e) => handleItemChange(item.id, 'ghi_chu', e.target.value)}
                          placeholder="Quy cách, mác, điều kiện..."
                        />
                      </td>
                    )}

                    {/* Đơn Vị */}
                    <td style={{ padding: '8px 6px', textAlign: 'center', width: '105px' }}>
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
                            padding: '6px 6px',
                            background: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontSize: '12px',
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                            boxSizing: 'border-box'
                          }}
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="setting-input"
                            style={{ width: '70px', textAlign: 'center', padding: '6px 2px', fontSize: '12px' }}
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
                              color: 'var(--muted-foreground)',
                              padding: '3px 4px'
                            }}
                            title="Chọn lại danh sách"
                          >
                            ↩
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Đơn Giá Gốc */}
                    <td style={{ padding: '8px 6px', textAlign: 'right', width: '130px' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{ width: '100%', textAlign: 'right', fontWeight: 600, boxSizing: 'border-box' }}
                        value={item.don_gia}
                        onChange={(e) => handleItemChange(item.id, 'don_gia', e.target.value)}
                        placeholder="1.340"
                      />
                    </td>

                    {/* + % Tăng */}
                    <td style={{ padding: '8px 4px', textAlign: 'center', width: '75px' }}>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                        <input
                          type="text"
                          className="setting-input"
                          style={{
                            width: '100%',
                            textAlign: 'center',
                            padding: '6px 16px 6px 2px',
                            fontWeight: 600,
                            boxSizing: 'border-box',
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
                            right: '5px',
                            fontSize: '10px',
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
                    <td style={{ padding: '8px 6px', textAlign: 'right', width: '145px' }}>
                      <input
                        type="text"
                        className="setting-input"
                        style={{
                          width: '100%',
                          textAlign: 'right',
                          fontWeight: 700,
                          fontSize: '13px',
                          boxSizing: 'border-box',
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

                    {/* Thao Tác (Nhân bản, Lên, Xuống, Xóa) */}
                    <td style={{ padding: '8px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--muted-foreground)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Nhân bản (sao chép) dòng này"
                          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveItem(idx, 'up')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === 0 ? 'var(--border)' : 'var(--muted-foreground)',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Di chuyển dòng lên trên"
                          onMouseOver={(e) => {
                            if (idx !== 0) e.currentTarget.style.color = 'var(--primary)'
                          }}
                          onMouseOut={(e) => {
                            if (idx !== 0) e.currentTarget.style.color = 'var(--muted-foreground)'
                          }}
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === formData.items.length - 1}
                          onClick={() => handleMoveItem(idx, 'down')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: idx === formData.items.length - 1 ? 'var(--border)' : 'var(--muted-foreground)',
                            cursor: idx === formData.items.length - 1 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Di chuyển dòng xuống dưới"
                          onMouseOver={(e) => {
                            if (idx !== formData.items.length - 1) e.currentTarget.style.color = 'var(--primary)'
                          }}
                          onMouseOut={(e) => {
                            if (idx !== formData.items.length - 1) e.currentTarget.style.color = 'var(--muted-foreground)'
                          }}
                        >
                          <ChevronDown size={15} />
                        </button>
                        <button
                          type="button"
                          disabled={formData.items.length === 1}
                          onClick={() => handleRemoveItem(item.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: formData.items.length === 1 ? 'var(--border)' : 'var(--muted-foreground)',
                            cursor: formData.items.length === 1 ? 'not-allowed' : 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Xóa dòng này"
                          onMouseOver={(e) => {
                            if (formData.items.length > 1) e.currentTarget.style.color = 'var(--destructive)'
                          }}
                          onMouseOut={(e) => {
                            if (formData.items.length > 1) e.currentTarget.style.color = 'var(--muted-foreground)'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Add Row & Table Actions Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: 'var(--muted)',
              borderTop: '1px solid var(--border)',
              borderRadius: '0 0 10px 10px'
            }}
          >
            <button
              type="button"
              onClick={handleAddItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} color="var(--primary-foreground)" />
              Thêm dòng hàng hóa
            </button>
            <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
              Đang có <strong>{formData.items.length}</strong> mặt hàng trong bảng báo giá
            </span>
          </div>

          {/* Quotation Totals & VAT Summary Card */}
          <div
            style={{
              marginTop: '16px',
              padding: '16px 20px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              alignItems: 'center'
            }}
          >
            {/* Left: VAT Selector & Words */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={16} color="var(--primary)" />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Tùy chọn thuế VAT:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { label: '0%', val: 0 },
                    { label: '8%', val: 8 },
                    { label: '10%', val: 10 }
                  ].map((v) => (
                    <button
                      key={v.val}
                      type="button"
                      onClick={() => setVatRate(v.val)}
                      style={{
                        padding: '4px 10px',
                        background: vatRate === v.val ? 'var(--primary)' : 'var(--muted)',
                        color: vatRate === v.val ? 'var(--primary-foreground)' : 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: vatRate === v.val ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  color: 'var(--muted-foreground)',
                  padding: '8px 12px',
                  background: 'var(--background)',
                  border: '1px dashed var(--border)',
                  borderRadius: '8px'
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Số tiền viết bằng chữ: </span>
                <span style={{ fontStyle: 'italic', color: 'var(--primary)' }}>{grandTotalInWords}</span>
              </div>
            </div>

            {/* Right: Detailed Totals */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingLeft: '16px',
                borderLeft: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Tổng tiền hàng (Đơn giá):</span>
                <span style={{ fontWeight: 600 }}>{subtotal.toLocaleString('vi-VN')} đ</span>
              </div>

              {vatRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>Thuế VAT ({vatRate}%):</span>
                  <span style={{ fontWeight: 600, color: '#f59e0b' }}>+{vatAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border)',
                  fontSize: '15px'
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>TỔNG CỘNG:</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981' }}>
                  {grandTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
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
