import { useState, useMemo } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { LoadingOverlay } from '../components/common/LoadingOverlay'
import { ExportConfigSection } from '../components/common/ExportConfigSection'
import { FloatingExportBar } from '../components/common/FloatingExportBar'
import { DocumentToast } from '../components/common/DocumentToast'
import { DateInputGroup } from '../components/common/DateInputGroup'
import { PartnerAutocompleteInput } from '../components/common/PartnerAutocompleteInput'
import { DocxNativePreviewPane } from '../components/preview/DocxNativePreviewPane'
import {
  FileText,
  Calendar,
  Building2,
  Plus,
  Trash2,
  Copy,
  Download,
  RotateCcw,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Percent,
  Check
} from 'lucide-react'
import type { AdvanceRequestData, AdvanceRequestItem, PartnerProfile } from '../../../shared/types'
import { numberToVietnameseWords } from '../../../shared/number-to-words'
import { useFormDraftsStore } from '../stores/formDrafts.store'
import { useDocumentToast } from '../hooks/useDocumentToast'
import { usePartnerSuggestions } from '../hooks/usePartnerSuggestions'
import { useExportShortcut, useDefaultExportDir } from '../hooks/useFormShortcuts'

const COMMON_MATERIALS = [
  'Cấp phối đá dăm Dmax 37,5',
  'Đá BTN 1,9*2,5',
  'Đá 1x2 (Xanh Biên Hòa)',
  'Đá 0x5 (Bụi sàng)',
  'Đá 4x6',
  'Cát vàng sàng',
  'Cát san lấp'
]

const COMMON_UNITS = ['M3', 'Tấn', 'Chuyến', 'Bộ', 'Kg', 'Lô']

const PERCENT_PRESETS = [
  { label: '100% Đơn hàng', percent: 100, text: 'Thanh toán trước 100% đơn hàng' },
  { label: 'Tạm ứng 80%', percent: 80, text: 'Tạm ứng 80% giá trị đơn hàng' },
  { label: 'Tạm ứng 70%', percent: 70, text: 'Tạm ứng 70% giá trị đơn hàng' },
  { label: 'Tạm ứng 50%', percent: 50, text: 'Tạm ứng 50% giá trị đơn hàng' }
]

export function AdvanceRequestForm() {
  const [isExporting, setIsExporting] = useState(false)
  const [showPreview, setShowPreview] = useState<boolean>(true)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Shared Toast & Sound
  const { toast, showToast } = useDocumentToast()

  // Partner Memory Suggestions
  const { filterPartners } = usePartnerSuggestions()

  // Form Draft Persistence Store (giữ nguyên dữ liệu khi chuyển tab)
  const formData = useFormDraftsStore((s) => s.advanceRequestDraft)
  const setFormData = useFormDraftsStore((s) => s.setAdvanceRequestDraft)
  const resetAdvanceRequestDraft = useFormDraftsStore((s) => s.resetAdvanceRequestDraft)

  // Nạp thư mục xuất mặc định
  useDefaultExportDir((dir) => setFormData((prev) => ({ ...prev, export_dir: dir })))

  // Đảm bảo formData.items luôn là mảng hợp lệ
  const items = useMemo<AdvanceRequestItem[]>(() => {
    if (formData.items && formData.items.length > 0) {
      const hasContent = formData.items.some((it) => it.ten_vat_tu?.trim() || it.so_luong)
      if (hasContent) return formData.items
    }
    return [
      {
        id: '1',
        stt: 1,
        ten_vat_tu: 'Cấp phối đá dăm Dmax 37,5',
        don_vi: 'M3',
        so_luong: '2.000',
        don_gia: '363.000',
        thanh_tien: '726.000.000 ₫',
        ghi_chu: 'Mỏ Hòn Ngang'
      },
      {
        id: '2',
        stt: 2,
        ten_vat_tu: 'Đá BTN 1,9*2,5',
        don_vi: 'M3',
        so_luong: '500',
        don_gia: '625.000',
        thanh_tien: '312.500.000 ₫',
        ghi_chu: ''
      }
    ]
  }, [formData.items])

  // Tính tổng thành tiền từ các dòng vật tư
  const totalItemSum = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = Number(String(it.so_luong || '').replace(/[^0-9]/g, '')) || 0
      const p = Number(String(it.don_gia || '').replace(/[^0-9]/g, '')) || 0
      return sum + q * p
    }, 0)
  }, [items])

  const handleClearAllData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin đang điền trong giấy đề nghị tạm ứng để làm mới?')) {
      resetAdvanceRequestDraft()
      showToast('success', 'Đã xóa toàn bộ thông tin và làm mới giấy đề nghị tạm ứng!')
    }
  }

  const handleFillToday = () => {
    const today = new Date()
    const d = String(today.getDate()).padStart(2, '0')
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const y = String(today.getFullYear())
    setFormData((prev) => ({
      ...prev,
      ngay: d,
      thang: m,
      nam: y,
      ngay_don_hang: prev.ngay_don_hang || d,
      thang_don_hang: prev.thang_don_hang || m,
      nam_don_hang: prev.nam_don_hang || y
    }))
    showToast('success', 'Đã cập nhật ngày lập đề nghị hôm nay!')
  }

  const handleSyncOrderDate = () => {
    setFormData((prev) => ({
      ...prev,
      ngay_don_hang: prev.ngay,
      thang_don_hang: prev.thang,
      nam_don_hang: prev.nam
    }))
    showToast('success', 'Đã đồng bộ ngày căn cứ đơn hàng theo ngày lập!')
  }

  const handleCustomerChange = (val: string) => {
    const upperVal = val.toUpperCase()
    setFormData((prev) => {
      const cleanName = upperVal.replace(/CÔNG TY/gi, '').replace(/[\/:*?"<>|]/g, '').trim()
      const suggestedName = cleanName ? `DeNghiTamUng_${cleanName}.docx` : 'DeNghiTamUng.docx'
      return {
        ...prev,
        ten_cong_ty_khach: upperVal,
        file_name: prev.file_name && !prev.file_name.includes('DeNghiTamUng') ? prev.file_name : suggestedName
      }
    })
  }

  const selectPartnerSuggestion = (partner: PartnerProfile) => {
    handleCustomerChange(partner.ten_cong_ty)
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

  // Row Item Handlers
  const handleAddItem = () => {
    const nextStt = items.length + 1
    const newItem: AdvanceRequestItem = {
      id: String(Date.now()),
      stt: nextStt,
      ten_vat_tu: '',
      don_vi: 'M3',
      so_luong: '',
      don_gia: '',
      thanh_tien: '',
      ghi_chu: ''
    }
    setFormData((prev) => ({
      ...prev,
      items: [...items, newItem]
    }))
  }

  const handleRemoveItem = (id: string) => {
    const filtered = items.filter((it) => it.id !== id)
    const renumbered = filtered.map((it, idx) => ({ ...it, stt: idx + 1 }))
    setFormData((prev) => ({
      ...prev,
      items: renumbered
    }))
  }

  const handleDuplicateItem = (id: string) => {
    const idx = items.findIndex((it) => it.id === id)
    if (idx === -1) return
    const target = items[idx]
    const cloned: AdvanceRequestItem = {
      ...target,
      id: String(Date.now() + Math.random())
    }
    const newItems = [...items]
    newItems.splice(idx + 1, 0, cloned)
    const renumbered = newItems.map((it, i) => ({ ...it, stt: i + 1 }))
    setFormData((prev) => ({
      ...prev,
      items: renumbered
    }))
    showToast('success', 'Đã nhân bản dòng vật tư!')
  }

  const handleItemChange = (id: string, field: keyof AdvanceRequestItem, val: string) => {
    const updated = items.map((it) => {
      if (it.id !== id) return it

      if (field === 'so_luong' || field === 'don_gia') {
        const cleanNum = val.replace(/[^0-9]/g, '')
        const formatted = cleanNum ? Number(cleanNum).toLocaleString('vi-VN') : ''
        const nextItem = { ...it, [field]: formatted }

        // Tự động tính Thành tiền = Số lượng * Đơn giá
        const q = Number(String(nextItem.so_luong || '').replace(/[^0-9]/g, '')) || 0
        const p = Number(String(nextItem.don_gia || '').replace(/[^0-9]/g, '')) || 0
        const subtotal = q * p
        nextItem.thanh_tien = subtotal > 0 ? `${subtotal.toLocaleString('vi-VN')} ₫` : ''

        return nextItem
      }

      return { ...it, [field]: val }
    })

    // Cập nhật items và tính lại tổng tiền nếu cần
    setFormData((prev) => {
      const nextTotalSum = updated.reduce((sum, it) => {
        const q = Number(String(it.so_luong || '').replace(/[^0-9]/g, '')) || 0
        const p = Number(String(it.don_gia || '').replace(/[^0-9]/g, '')) || 0
        return sum + q * p
      }, 0)

      const formattedTotal = nextTotalSum > 0 ? `${nextTotalSum.toLocaleString('vi-VN')} ₫` : ''
      const words = nextTotalSum > 0 ? numberToVietnameseWords(nextTotalSum) : prev.so_tien_bang_chu

      return {
        ...prev,
        items: updated,
        gia_tri_don_hang: formattedTotal,
        tong_tien: prev.tong_tien && !prev.tong_tien.includes('₫') ? formattedTotal : (prev.tong_tien || formattedTotal),
        so_tien_bang_chu: prev.so_tien_bang_chu ? prev.so_tien_bang_chu : words
      }
    })
  }

  // Áp dụng tỷ lệ tạm ứng (100%, 80%, 70%, 50%)
  const handleApplyPreset = (preset: typeof PERCENT_PRESETS[0]) => {
    const currentSum = totalItemSum > 0 ? totalItemSum : Number(String(formData.tong_tien || '').replace(/[^0-9]/g, ''))
    if (currentSum === 0) {
      showToast('error', 'Vui lòng nhập số lượng và đơn giá của các vật tư trước khi chọn tỷ lệ!')
      return
    }

    const calculatedAmount = Math.round((currentSum * preset.percent) / 100)
    const formattedAmount = `${calculatedAmount.toLocaleString('vi-VN')} ₫`
    const words = numberToVietnameseWords(calculatedAmount)

    setFormData((prev) => ({
      ...prev,
      dieu_kien_thanh_toan: preset.text,
      tong_tien: formattedAmount,
      gia_tri_tam_ung: formattedAmount,
      gia_tri_don_hang: `${currentSum.toLocaleString('vi-VN')} ₫`,
      so_tien_bang_chu: words
    }))

    showToast('success', `Đã áp dụng ${preset.label}: ${formattedAmount}`)
  }

  // Tùy chỉnh tổng tiền thủ công
  const handleTotalAmountChange = (val: string) => {
    const cleanNum = val.replace(/[^0-9]/g, '')
    const num = Number(cleanNum)
    const formatted = cleanNum ? `${num.toLocaleString('vi-VN')} ₫` : ''

    setFormData((prev) => ({
      ...prev,
      tong_tien: formatted,
      gia_tri_tam_ung: formatted,
      so_tien_bang_chu: cleanNum ? numberToVietnameseWords(num) : ''
    }))
  }

  // Export Advance Request Document Handler (Word / PDF / Both)
  const handleExportDocx = async () => {
    if (!formData.ten_cong_ty_khach.trim()) {
      showToast('error', 'Vui lòng nhập Tên công ty đối tác khách hàng!')
      return
    }

    if (!window.api?.exportAdvanceRequest) {
      showToast('error', 'Chức năng xuất file chỉ khả dụng trong ứng dụng Desktop VietKey DocGen.')
      return
    }

    setIsExporting(true)

    // Pre-Export Validation Check
    const newErrors: Record<string, boolean> = {}
    if (!formData.ten_cong_ty_khach.trim()) newErrors.ten_cong_ty_khach = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showToast('error', '⚠️ Vui lòng kiểm tra các ô màu đỏ chưa điền thông tin trước khi xuất!')
      setIsExporting(false)
      return
    }
    setErrors({})
    try {
      let targetFilePath = ''
      let fileName = formData.file_name.trim() || 'DeNghiTamUng.docx'
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
      if (formData.ten_cong_ty_khach && window.api?.savePartner) {
        window.api.savePartner({
          ten_cong_ty: formData.ten_cong_ty_khach,
          mst: '',
          dai_dien: '',
          xung_danh: 'Ông',
          chuc_vu: 'Giám đốc',
          dia_chi: '',
          tai_khoan: ''
        })
      }

      // Chuẩn bị payload đầy đủ bao gồm items
      const payload: AdvanceRequestData = {
        ...formData,
        items,
        tong_tien: formData.tong_tien || (totalItemSum > 0 ? `${totalItemSum.toLocaleString('vi-VN')} ₫` : '0 ₫'),
        gia_tri_don_hang: formData.gia_tri_don_hang || (totalItemSum > 0 ? `${totalItemSum.toLocaleString('vi-VN')} ₫` : '0 ₫'),
        gia_tri_tam_ung: formData.tong_tien || (totalItemSum > 0 ? `${totalItemSum.toLocaleString('vi-VN')} ₫` : '0 ₫'),
        dieu_kien_thanh_toan: formData.dieu_kien_thanh_toan || 'Thanh toán trước 100% đơn hàng',
        so_tien_bang_chu: formData.so_tien_bang_chu || (totalItemSum > 0 ? numberToVietnameseWords(totalItemSum) : 'Không đồng./.')
      }

      const res = await window.api.exportAdvanceRequest(payload, targetFilePath)

      if (res.success) {
        let msg = ''
        if (formData.export_type === 'word') {
          msg = `Đã xuất file Đề Nghị Tạm Ứng Word thành công!`
        } else if (formData.export_type === 'pdf') {
          msg = `Đã xuất file Đề Nghị Tạm Ứng PDF thành công!`
        } else {
          msg = `Đã xuất cả 2 file (Word & PDF) thành công!`
        }
        showToast('success', msg, res.filePath || targetFilePath, res.pdfPath)
      } else {
        showToast('error', res.error || 'Lỗi khi xuất file Đề Nghị Tạm Ứng.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Có lỗi xảy ra khi tạo file Đề Nghị Tạm Ứng.')
    } finally {
      setIsExporting(false)
    }
  }

  // Phím tắt Ctrl + Enter để xuất file
  useExportShortcut(handleExportDocx, isExporting)

  return (
    <div style={{ maxWidth: showPreview ? '100%' : '1100px', margin: '0 auto', paddingBottom: '80px', transition: 'max-width 0.2s ease' }}>
      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isExporting}
        title="Đang tạo Đề Nghị Tạm Ứng..."
        subtitle={`Đang xử lý xuất file định dạng ${formData.export_type.toUpperCase()}...`}
        type="export"
      />

      <PageHeader
        title="Đề Nghị Tạm Ứng (Bản Mới Nâng Cấp)"
        description="Lập giấy đề nghị tạm ứng kinh phí mua sắm vật tư theo bảng chi tiết vật tư, tự động tính tổng tiền, đổi số thành chữ và xuất file (Word / PDF / Cả 2)"
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
            title="Xóa toàn bộ thông tin đã điền và làm mới đề nghị tạm ứng"
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
            Làm mới
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPreview(!showPreview)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: 600 }}
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showPreview ? 'Ẩn xem trước' : 'Xem trước DOCX'}</span>
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
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(178, 213, 229, 0.4)',
              fontFamily: "'Inter', sans-serif",
              transition: 'all 0.15s ease'
            }}
          >
            {isExporting ? (
              <RefreshCw size={18} className="animate-spin" color="var(--primary-foreground)" />
            ) : (
              <Download size={18} color="var(--primary-foreground)" />
            )}
            {isExporting ? 'Đang xuất file...' : `Xuất Giấy Tạm Ứng (${formData.export_type.toUpperCase()})`}
          </button>
        </div>
      </PageHeader>

      {/* Quick Action Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="var(--primary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
            Biểu mẫu Giấy Đề Nghị Tạm Ứng Mới — Có Bảng Vật Tư & Dấu Mộc Giám Đốc Vietkey
          </span>
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

      {/* Main Container: Split-Screen Side-by-Side Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1.05fr' : '1fr', gap: '20px', alignItems: 'start' }}>
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          {/* GROUP 0: CẤU HÌNH FILE & ĐỊNH DẠNG XUẤT */}
          <ExportConfigSection
            fileName={formData.file_name}
            onChangeFileName={(val) => setFormData((prev) => ({ ...prev, file_name: val }))}
            exportType={formData.export_type}
            onChangeExportType={(type) => setFormData((prev) => ({ ...prev, export_type: type }))}
            exportDir={formData.export_dir}
            onBrowseExportDir={handleBrowseExportDir}
            defaultFileNamePlaceholder="DeNghiTamUng.docx"
          />

          {/* GROUP 1: THÔNG TIN ĐỐI TÁC KHÁCH HÀNG & CĂN CỨ ĐƠN HÀNG */}
          <div className="settings-section" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Building2 size={18} color="var(--primary)" />
              <div>
                <h3>1. Thông tin Đối Tác & Căn Cứ Đơn Hàng</h3>
                <p style={{ margin: 0 }}>Thông tin đối tác khách hàng và căn cứ đơn đặt hàng theo mẫu nâng cấp</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <PartnerAutocompleteInput
                label="Kính gửi (Tên Công ty Đối tác)"
                required
                value={formData.ten_cong_ty_khach}
                placeholder="VD: CÔNG TY CỔ PHẦN TẬP ĐOÀN CIENC04..."
                isError={errors.ten_cong_ty_khach}
                onChange={(val) => {
                  if (errors.ten_cong_ty_khach) setErrors((prev) => ({ ...prev, ten_cong_ty_khach: false }))
                  handleCustomerChange(val)
                }}
                onSelectPartner={selectPartnerSuggestion}
              />

              <DateInputGroup
                label="Ngày lập đề nghị"
                day={formData.ngay}
                month={formData.thang}
                year={formData.nam}
                onChangeDay={(val) => setFormData((p) => ({ ...p, ngay: val }))}
                onChangeMonth={(val) => setFormData((p) => ({ ...p, thang: val }))}
                onChangeYear={(val) => setFormData((p) => ({ ...p, nam: val }))}
              />
            </div>

            {/* CĂN CỨ ĐƠN ĐẶT HÀNG & NỘI DUNG CUNG CẤP */}
            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Căn cứ đơn đặt hàng:
                </span>
                <button
                  type="button"
                  onClick={handleSyncOrderDate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    background: 'var(--muted)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--muted-foreground)'
                  }}
                  title="Sao chép ngày lập đề nghị vào ngày đơn hàng"
                >
                  <Copy size={12} /> Đồng bộ ngày lập
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                    Đợt tạm ứng
                  </label>
                  <input
                    type="text"
                    className="setting-input"
                    style={{ width: '100%', textAlign: 'center', fontWeight: 700 }}
                    value={formData.dot_tam_ung}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dot_tam_ung: e.target.value }))}
                    placeholder="VD: 2"
                  />
                </div>

                <div>
                  <DateInputGroup
                    label="Ngày đơn đặt hàng"
                    day={formData.ngay_don_hang || formData.ngay}
                    month={formData.thang_don_hang || formData.thang}
                    year={formData.nam_don_hang || formData.nam}
                    onChangeDay={(val) => setFormData((p) => ({ ...p, ngay_don_hang: val }))}
                    onChangeMonth={(val) => setFormData((p) => ({ ...p, thang_don_hang: val }))}
                    onChangeYear={(val) => setFormData((p) => ({ ...p, nam_don_hang: val }))}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>
                    Nội dung hàng hóa cung cấp
                  </label>
                  <input
                    type="text"
                    className="setting-input"
                    style={{ width: '100%' }}
                    value={formData.noi_dung_cung_cap}
                    onChange={(e) => setFormData((prev) => ({ ...prev, noi_dung_cung_cap: e.target.value }))}
                    placeholder="VD: đá các loại, VLXD các loại..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 2: BẢNG CHI TIẾT VẬT TƯ ĐỀ NGHỊ TẠM ỨNG (UPGRADED CORE FEATURE) */}
          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={18} color="var(--primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px' }}>2. Bảng Chi Tiết Vật Tư Tạm Ứng</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
                    Bảng danh mục vật tư sẽ được đưa chính xác vào file Word mẫu mới
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} color="var(--primary-foreground)" /> Thêm dòng vật tư
              </button>
            </div>

            {/* Quick Material Suggestions Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', alignSelf: 'center', marginRight: '4px' }}>
                Gợi ý nhanh:
              </span>
              {COMMON_MATERIALS.map((mat) => (
                <button
                  key={mat}
                  type="button"
                  onClick={() => {
                    const emptyRow = items.find((r) => !r.ten_vat_tu.trim())
                    if (emptyRow) {
                      handleItemChange(emptyRow.id, 'ten_vat_tu', mat)
                    } else {
                      const nextStt = items.length + 1
                      const newItem: AdvanceRequestItem = {
                        id: String(Date.now()),
                        stt: nextStt,
                        ten_vat_tu: mat,
                        don_vi: 'M3',
                        so_luong: '',
                        don_gia: '',
                        thanh_tien: '',
                        ghi_chu: ''
                      }
                      setFormData((p) => ({ ...p, items: [...items, newItem] }))
                    }
                  }}
                  style={{
                    fontSize: '11.5px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                    cursor: 'pointer'
                  }}
                >
                  + {mat}
                </button>
              ))}
            </div>

            {/* Items Table Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((row, idx) => {
                return (
                  <div
                    key={row.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 2.2fr 85px 95px 125px 135px 1.5fr 60px',
                      gap: '8px',
                      alignItems: 'center',
                      background: 'var(--card)',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted-foreground)', textAlign: 'center' }}>
                      #{idx + 1}
                    </span>

                    {/* Tên vật tư */}
                    <input
                      type="text"
                      className="setting-input"
                      style={{ width: '100%', fontSize: '13px' }}
                      value={row.ten_vat_tu}
                      onChange={(e) => handleItemChange(row.id, 'ten_vat_tu', e.target.value)}
                      placeholder="Tên vật tư..."
                    />

                    {/* Đơn vị */}
                    <input
                      type="text"
                      className="setting-input"
                      style={{ width: '100%', textAlign: 'center', fontSize: '12.5px' }}
                      value={row.don_vi}
                      onChange={(e) => handleItemChange(row.id, 'don_vi', e.target.value)}
                      placeholder="M3"
                      list={`units-${row.id}`}
                    />
                    <datalist id={`units-${row.id}`}>
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>

                    {/* Số lượng */}
                    <input
                      type="text"
                      className="setting-input"
                      style={{ width: '100%', textAlign: 'center', fontSize: '13px' }}
                      value={row.so_luong}
                      onChange={(e) => handleItemChange(row.id, 'so_luong', e.target.value)}
                      placeholder="Số lượng"
                    />

                    {/* Đơn giá */}
                    <input
                      type="text"
                      className="setting-input"
                      style={{ width: '100%', textAlign: 'right', fontSize: '13px' }}
                      value={row.don_gia}
                      onChange={(e) => handleItemChange(row.id, 'don_gia', e.target.value)}
                      placeholder="Đơn giá"
                    />

                    {/* Thành tiền (Tự động) */}
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      className="setting-input"
                      style={{
                        width: '100%',
                        textAlign: 'right',
                        fontWeight: 700,
                        fontSize: '13px',
                        color: 'var(--primary)',
                        background: 'rgba(178, 213, 229, 0.08)'
                      }}
                      value={row.thanh_tien || '0 ₫'}
                      placeholder="Thành tiền"
                    />

                    {/* Ghi chú */}
                    <input
                      type="text"
                      className="setting-input"
                      style={{ width: '100%', fontSize: '12px' }}
                      value={row.ghi_chu || ''}
                      onChange={(e) => handleItemChange(row.id, 'ghi_chu', e.target.value)}
                      placeholder="Ghi chú (VD: Mỏ Hòn Ngang)..."
                    />

                    {/* Thao tác dòng */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(row.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--muted-foreground)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                        title="Nhân bản dòng"
                      >
                        <Copy size={13} />
                      </button>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(row.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--destructive)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Xóa dòng"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Total items sum display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                  Tổng cộng giá trị các vật tư ({items.length} mặt hàng):
                </span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                  {totalItemSum.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>

          {/* GROUP 3: ĐIỀU KIỆN THANH TOÁN, TỔNG TIỀN VÀ ĐỔI CHỮ */}
          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Percent size={18} color="var(--primary)" />
              <div>
                <h3>3. Điều Kiện Thanh Toán & Đề Nghị Tạm Ứng</h3>
                <p style={{ margin: 0 }}>Chọn tỷ lệ tạm ứng hoặc tự nhập điều kiện thanh toán và số tiền</p>
              </div>
            </div>

            {/* Presets Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {PERCENT_PRESETS.map((p) => {
                const isActive = formData.dieu_kien_thanh_toan === p.text
                return (
                  <button
                    key={p.percent}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                      background: isActive ? 'var(--primary)' : 'var(--card)',
                      color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isActive && <Check size={14} />}
                    {p.label}
                  </button>
                )
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Ghi chú điều kiện tạm ứng (Hiển thị tại dòng Tổng tiền)
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%', fontWeight: 600 }}
                  value={formData.dieu_kien_thanh_toan || 'Thanh toán trước 100% đơn hàng'}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dieu_kien_thanh_toan: e.target.value }))}
                  placeholder="VD: Thanh toán trước 100% đơn hàng..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Tổng tiền đề nghị thanh toán
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%', fontWeight: 800, fontSize: '14px', color: '#10b981' }}
                  value={formData.tong_tien || (totalItemSum > 0 ? `${totalItemSum.toLocaleString('vi-VN')} ₫` : '')}
                  onChange={(e) => handleTotalAmountChange(e.target.value)}
                  placeholder="VD: 1.038.500.000 ₫"
                />
              </div>
            </div>

            {/* Auto Words Result Preview Box */}
            <div
              style={{
                marginTop: '14px',
                padding: '12px 16px',
                background: 'var(--muted)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}
            >
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                Bằng chữ (Tự động chuyển đổi chuẩn Tiếng Việt theo số tiền trên):
              </label>
              <input
                type="text"
                className="setting-input"
                style={{
                  width: '100%',
                  fontWeight: 600,
                  fontStyle: 'italic',
                  fontSize: '13.5px',
                  color: 'var(--foreground)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0
                }}
                value={formData.so_tien_bang_chu}
                onChange={(e) => setFormData((prev) => ({ ...prev, so_tien_bang_chu: e.target.value }))}
                placeholder="Một tỷ không trăm ba mươi tám triệu năm trăm nghìn đồng./."
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: BẢN XEM TRƯỚC DOCX NGUYÊN BẢN (CHÍNH XÁC 1:1 WORD) */}
        {showPreview && (
          <div style={{ position: 'sticky', top: '16px', height: 'calc(100vh - 100px)', minWidth: 0 }}>
            <DocxNativePreviewPane
              title={`Đề Nghị Tạm Ứng: ${formData.ten_cong_ty_khach || 'Xem trước'}`}
              docType="advance"
              data={{
                ...formData,
                items,
                tong_tien: formData.tong_tien || (totalItemSum > 0 ? `${totalItemSum.toLocaleString('vi-VN')} ₫` : '0 ₫'),
                dieu_kien_thanh_toan: formData.dieu_kien_thanh_toan || 'Thanh toán trước 100% đơn hàng',
                so_tien_bang_chu: formData.so_tien_bang_chu || (totalItemSum > 0 ? numberToVietnameseWords(totalItemSum) : 'Không đồng./.')
              }}
              onClosePreview={() => setShowPreview(false)}
              onExportWord={handleExportDocx}
            />
          </div>
        )}
      </div>

      {/* Floating Export Button Bar */}
      <FloatingExportBar
        title={`Tạm ứng: ${formData.ten_cong_ty_khach || 'Chưa nhập công ty'}`}
        itemBadge={formData.tong_tien || (totalItemSum > 0 ? `${totalItemSum.toLocaleString('vi-VN')} ₫` : undefined)}
        exportType={formData.export_type}
        fileName={formData.file_name}
        isExporting={isExporting}
        onExport={handleExportDocx}
        buttonLabel={isExporting ? 'Đang tạo file...' : `Tạo & Xuất Tạm Ứng (${formData.export_type.toUpperCase()})`}
        onTogglePreview={() => setShowPreview(!showPreview)}
        isPreviewOpen={showPreview}
      />

      {/* Toast Notification */}
      <DocumentToast toast={toast} />
    </div>
  )
}
