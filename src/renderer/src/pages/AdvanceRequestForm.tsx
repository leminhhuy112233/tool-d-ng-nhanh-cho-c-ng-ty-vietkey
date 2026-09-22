import { useState, useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { LoadingOverlay } from '../components/common/LoadingOverlay'
import { ExportConfigSection } from '../components/common/ExportConfigSection'
import { FloatingExportBar } from '../components/common/FloatingExportBar'
import {
  FileText,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  Folder,
  RotateCcw
} from 'lucide-react'
import type { AdvanceRequestData, ExportFileType, PartnerProfile } from '../../../shared/types'
import { playSuccessChime } from '../lib/sound'
import { numberToVietnameseWords } from '../../../shared/number-to-words'
import { useFormDraftsStore } from '../stores/formDrafts.store'

interface CalcRow {
  id: string
  name: string
  qty: string
  price: string
}

export function AdvanceRequestForm() {
  const [isExporting, setIsExporting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
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

  // Initial clean calculator state
  const [calcRows, setCalcRows] = useState<CalcRow[]>([
    { id: '1', name: '', qty: '', price: '' }
  ])

  // Form Draft Persistence Store (giữ nguyên dữ liệu khi chuyển tab)
  const formData = useFormDraftsStore((s) => s.advanceRequestDraft)
  const setFormData = useFormDraftsStore((s) => s.setAdvanceRequestDraft)
  const resetAdvanceRequestDraft = useFormDraftsStore((s) => s.resetAdvanceRequestDraft)

  const handleClearAllData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin đang điền trong giấy đề nghị tạm ứng để làm mới?')) {
      resetAdvanceRequestDraft()
      setCalcRows([{ id: '1', name: '', qty: '', price: '' }])
      showToast('success', 'Đã xóa toàn bộ thông tin và làm mới giấy đề nghị tạm ứng!')
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
          console.error('Lỗi đọc danh sách khách hàng:', err)
        }
      }
    }
    initData()
  }, [])

  // Keyboard shortcut: Ctrl + Enter to Export
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
    showToast('success', 'Đã cập nhật ngày đề nghị hôm nay!')
  }

  const handleCustomerChange = (val: string) => {
    const upperVal = val.toUpperCase()
    setFormData((prev) => {
      const cleanName = upperVal.replace(/CÔNG TY/gi, '').replace(/[\\/:*?"<>|]/g, '').trim()
      const suggestedName = cleanName ? `DeNghiTamUng_${cleanName}.docx` : 'DeNghiTamUng.docx'
      return {
        ...prev,
        ten_cong_ty_khach: upperVal,
        file_name: prev.file_name && !prev.file_name.includes('DeNghiTamUng') ? prev.file_name : suggestedName
      }
    })
    setShowPartnerSuggestions(true)
  }

  const selectPartnerSuggestion = (partner: PartnerProfile) => {
    handleCustomerChange(partner.ten_cong_ty)
    setShowPartnerSuggestions(false)
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

  // Calculator Functions
  const handleAddCalcRow = () => {
    setCalcRows((prev) => [
      ...prev,
      { id: String(Date.now()), name: '', qty: '', price: '' }
    ])
  }

  const handleRemoveCalcRow = (id: string) => {
    setCalcRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleCalcRowChange = (id: string, field: keyof CalcRow, val: string) => {
    setCalcRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        if (field === 'qty' || field === 'price') {
          const cleanNum = val.replace(/[^0-9]/g, '')
          const formatted = cleanNum ? Number(cleanNum).toLocaleString('vi-VN') : ''
          return { ...row, [field]: formatted }
        }
        return { ...row, [field]: val }
      })
    );
  }

  // Total calculation
  const totalCalculated = calcRows.reduce((sum, row) => {
    const q = Number(row.qty.replace(/[^0-9]/g, '')) || 0
    const p = Number(row.price.replace(/[^0-9]/g, '')) || 0
    return sum + q * p
  }, 0)

  // Apply calculator sum to form fields
  const applyCalculatorToTotal = () => {
    if (totalCalculated === 0) {
      showToast('error', 'Chưa có dữ liệu tính toán trong bảng máy tính!')
      return
    }
    const totalFormatted = totalCalculated.toLocaleString('vi-VN')
    const words = numberToVietnameseWords(totalCalculated)
    setFormData((prev) => ({
      ...prev,
      gia_tri_don_hang: totalFormatted,
      gia_tri_tam_ung: totalFormatted,
      so_tien_bang_chu: words
    }))
    showToast('success', `Đã áp dụng tổng tiền ${totalFormatted} VNĐ vào Đơn hàng & Tạm ứng!`)
  }

  // Currency input handler with auto words conversion
  const handleAmountChange = (field: 'gia_tri_don_hang' | 'gia_tri_tam_ung', rawVal: string) => {
    const cleanNum = rawVal.replace(/[^0-9]/g, '')
    const num = Number(cleanNum)
    const formatted = cleanNum ? num.toLocaleString('vi-VN') : ''

    setFormData((prev) => {
      const next = { ...prev, [field]: formatted }
      if (field === 'gia_tri_tam_ung') {
        next.so_tien_bang_chu = cleanNum ? numberToVietnameseWords(num) : ''
      }
      return next
    })
  }

  // Export Advance Request Document Handler (Word / PDF / Both)
  const handleExportDocx = async () => {
    if (!formData.ten_cong_ty_khach.trim()) {
      showToast('error', 'Vui lòng nhập Tên công ty đối tác khách hàng!')
      return
    }

    if (!window.api?.exportAdvanceRequest) {
      showToast('error', 'Vui lòng chạy ứng dụng bằng lệnh "npm run dev" trong Terminal!')
      return
    }

    setIsExporting(true)

    // Pre-Export Validation Check
    const newErrors: Record<string, boolean> = {}
    if (!formData.ten_cong_ty_khach.trim()) newErrors.ten_cong_ty_khach = true
    if (!formData.gia_tri_tam_ung.trim()) newErrors.gia_tri_tam_ung = true

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

      const res = await window.api.exportAdvanceRequest(formData, targetFilePath)

      if (res.success) {
        let msg = ''
        if (formData.export_type === 'word') {
          msg = `Đã xuất file Đề Nghi Tạm Ứng Word thành công!`
        } else if (formData.export_type === 'pdf') {
          msg = `Đã xuất file Đề Nghi Tạm Ứng PDF thành công!`
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

  // Filter partner suggestions
  const filteredPartners = savedPartners.filter((p) =>
    p.ten_cong_ty.toLowerCase().includes(formData.ten_cong_ty_khach.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* High-tech Animated Loading Overlay */}
      <LoadingOverlay
        isVisible={isExporting}
        title="Đang tạo Đề Nghi Tạm Ứng..."
        subtitle={`Đang xử lý xuất file định dạng ${formData.export_type.toUpperCase()}...`}
        type="export"
      />

      <PageHeader
        title="Đề Nghị Tạm Ứng"
        description="Lập giấy đề nghị tạm ứng kinh phí mua sắm vật tư, tự động đổi số tiền thành chữ và xuất file (Word / PDF / Cả 2)"
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
            {isExporting ? 'Đang xuất file...' : `Xuất Giấy Tạm Ứng (${formData.export_type.toUpperCase()})`}
          </button>
        </div>
      </PageHeader>

      {/* Quick Action Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} color="var(--primary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
            Biểu mẫu Giấy Đề Nghị Tạm Ứng (Chuẩn công ty VietKey)
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

        {/* GROUP 1: THÔNG TIN ĐỐI TÁC KHÁCH HÀNG & NỘI DUNG */}
        <div className="settings-section" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Building2 size={18} color="var(--primary)" />
            <div>
              <h3>1. Thông tin Đối Tác Khách Hàng</h3>
              <p style={{ margin: 0 }}>Tên công ty sẽ được in HOA & Nghiêng chuẩn mẫu hợp đồng</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Kính gửi (Tên Công ty Đối tác) <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                type="text"
                className={errors.ten_cong_ty_khach ? 'setting-input input-error' : 'setting-input'}
                style={{ width: '100%', textTransform: 'uppercase', fontWeight: 600 }}
                value={formData.ten_cong_ty_khach}
                onChange={(e) => {
                  if (errors.ten_cong_ty_khach) setErrors((prev) => ({ ...prev, ten_cong_ty_khach: false }))
                  handleCustomerChange(e.target.value)
                }}
                onFocus={() => setShowPartnerSuggestions(true)}
                onBlur={() => setTimeout(() => setShowPartnerSuggestions(false), 200)}
                placeholder="Nhập tên công ty đối tác..."
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
                Ngày lập đề nghị
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

          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '14px', marginTop: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Nội dung cung cấp
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={formData.noi_dung_cung_cap}
                onChange={(e) => setFormData((prev) => ({ ...prev, noi_dung_cung_cap: e.target.value }))}
                placeholder="VD: VLXD các loại, Đá 1x2, Cát..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Đợt tạm ứng
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%', textAlign: 'center' }}
                value={formData.dot_tam_ung}
                onChange={(e) => setFormData((prev) => ({ ...prev, dot_tam_ung: e.target.value }))}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* SMART CALCULATOR WIDGET (MÁY TÍNH NHỎ ĐỔI TIỀN) */}
        <div
          className="settings-section"
          style={{
            background: 'linear-gradient(135deg, rgba(178, 213, 229, 0.12), rgba(16, 185, 129, 0.08))',
            border: '1px dashed var(--primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calculator size={20} color="var(--primary)" />
              <div>
                <h3 style={{ fontSize: '15px', color: 'var(--foreground)' }}>
                  Ô Máy Tính Nhỏ Tự Tính Tiền (Smart Calculator)
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  Tính toán theo số lượng & đơn giá hàng hóa, tự động tính tổng tiền bên dưới
                </p>
              </div>
            </div>

            <button
              onClick={handleAddCalcRow}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={14} color="var(--primary-foreground)" /> Thêm mặt hàng
            </button>
          </div>

          {/* Calculator Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {calcRows.map((row, idx) => {
              const q = Number(row.qty.replace(/[^0-9]/g, '')) || 0
              const p = Number(row.price.replace(/[^0-9]/g, '')) || 0
              const rowSubtotal = q * p

              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap',
                    background: 'var(--card)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', width: '22px' }}>
                    #{idx + 1}
                  </span>

                  <input
                    type="text"
                    className="setting-input"
                    style={{ flex: 1, minWidth: '150px' }}
                    value={row.name}
                    onChange={(e) => handleCalcRowChange(row.id, 'name', e.target.value)}
                    placeholder="VD: Đá 5x10"
                  />

                  <input
                    type="text"
                    className="setting-input"
                    style={{ width: '80px', textAlign: 'center' }}
                    value={row.qty}
                    onChange={(e) => handleCalcRowChange(row.id, 'qty', e.target.value)}
                    placeholder="Số lượng"
                  />

                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>×</span>

                  <input
                    type="text"
                    className="setting-input"
                    style={{ width: '120px', textAlign: 'right' }}
                    value={row.price}
                    onChange={(e) => handleCalcRowChange(row.id, 'price', e.target.value)}
                    placeholder="Đơn giá"
                  />

                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>=</span>

                  <span
                    style={{
                      width: '130px',
                      textAlign: 'right',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--primary)'
                    }}
                  >
                    {rowSubtotal > 0 ? `${rowSubtotal.toLocaleString('vi-VN')} đ` : '0 đ'}
                  </span>

                  {calcRows.length > 1 && (
                    <button
                      onClick={() => handleRemoveCalcRow(row.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--muted-foreground)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Xóa dòng"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Calculator Bottom Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                Tổng cộng máy tính:
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
                {totalCalculated.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <button
              onClick={applyCalculatorToTotal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✓ Áp dụng kết quả vào Đơn hàng & Tạm ứng
            </button>
          </div>
        </div>

        {/* GROUP 2: GIÁ TRỊ VÀ ĐỔI CHỮ */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <FileText size={18} color="var(--primary)" />
            <div>
              <h3>2. Giá Trị Tạm Ứng & Bằng Chữ (Tự Đổi Chữ)</h3>
              <p style={{ margin: 0 }}>Gõ số tiền tạm ứng, hệ thống sẽ tự động đổi sang Tiếng Việt bằng chữ chính xác</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Tổng giá trị đơn hàng (VNĐ)
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%', fontWeight: 700, fontSize: '14px' }}
                value={formData.gia_tri_don_hang}
                onChange={(e) => handleAmountChange('gia_tri_don_hang', e.target.value)}
                placeholder="VD: 1.824.000.000"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Giá trị tạm ứng đợt này (VNĐ) <span style={{ color: 'var(--destructive)' }}>*</span>
              </label>
              <input
                type="text"
                className={errors.gia_tri_tam_ung ? 'setting-input input-error' : 'setting-input'}
                style={{ width: '100%', fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}
                value={formData.gia_tri_tam_ung}
                onChange={(e) => {
                  if (errors.gia_tri_tam_ung) setErrors((prev) => ({ ...prev, gia_tri_tam_ung: false }))
                  handleAmountChange('gia_tri_tam_ung', e.target.value)
                }}
                placeholder="Nhập số tiền tạm ứng..."
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
              Bằng chữ (Tự động chuyển đổi chuẩn Tiếng Việt):
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
              placeholder="Một tỷ tám trăm hai mươi tư triệu đồng..."
            />
          </div>
        </div>
      </div>

      {/* Floating Export Button Bar */}
      <FloatingExportBar
        title={`Tạm ứng: ${formData.ten_cong_ty_khach || 'Chưa nhập công ty'}`}
        itemBadge={formData.gia_tri_tam_ung ? `${formData.gia_tri_tam_ung} VNĐ` : undefined}
        exportType={formData.export_type}
        fileName={formData.file_name}
        isExporting={isExporting}
        onExport={handleExportDocx}
        buttonLabel={isExporting ? 'Đang tạo file...' : `Tạo & Xuất Tạm Ứng (${formData.export_type.toUpperCase()})`}
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
