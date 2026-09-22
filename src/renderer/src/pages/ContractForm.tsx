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
  Building2,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Wand2,
  FileCheck,
  ExternalLink,
  Folder
} from 'lucide-react'
import type { ContractData, ExportFileType } from '../../../shared/types'
import { DEFAULT_BEN_B } from '../../../shared/types'
import { playSuccessChime } from '../lib/sound'

export function ContractForm() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual')
  const [rawText, setRawText] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error'
    text: string
    filePath?: string
    pdfPath?: string
  } | null>(null)

  // Current Date Defaults
  const today = new Date()
  const currentDay = String(today.getDate()).padStart(2, '0')
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0')
  const currentYear = String(today.getFullYear())

  // Main Contract Data State
  const [formData, setFormData] = useState<ContractData>({
    so_hd: `${currentDay}${currentMonth}/${currentYear}/HĐNT/LH-VK`,
    ngay: currentDay,
    thang: currentMonth,
    nam: currentYear,
    noi_dung_mua_ban: 'mua bán vật tư, vật liệu xây dựng',

    file_name: 'HopDong_Mau.docx',
    export_dir: '',
    export_type: 'word',

    // Bên Mua (Bên A)
    bena_xung_danh: 'Ông',
    bena_ten_cong_ty: '',
    bena_dai_dien: '',
    bena_chuc_vu: 'Giám đốc',
    bena_dia_chi: '',
    bena_tai_khoan: '',
    bena_mst: '',

    // Bên Bán (Bên B) - VietKey
    ...DEFAULT_BEN_B
  })

  // Load default export dir from settings
  useEffect(() => {
    const loadDefaultDir = async () => {
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
    }
    loadDefaultDir()
  }, [])

  // Keyboard shortcut Listener: Ctrl + Enter to Export
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
    showToast('success', 'Đã cập nhật ngày hôm nay cho hợp đồng!')
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

  const handleResetBenB = () => {
    setFormData((prev) => ({
      ...prev,
      ...DEFAULT_BEN_B
    }))
    showToast('success', 'Đã khôi phục thông tin bên bán VietKey mặc định.')
  }

  // AI Parse Handler
  const handleAIParse = async () => {
    if (!rawText.trim()) {
      showToast('error', 'Vui lòng dán nội dung thông tin công ty vào trước!')
      return
    }

    if (!window.api?.parseTextWithAI) {
      showToast('error', 'Chức năng AI cần chạy trong Desktop Client Electron.')
      return
    }

    setIsParsing(true)
    try {
      const parsed = await window.api.parseTextWithAI(rawText)

      setFormData((prev) => {
        const next = { ...prev }
        if (parsed.bena_ten_cong_ty) {
          next.bena_ten_cong_ty = parsed.bena_ten_cong_ty.toUpperCase()
          const cleanName = parsed.bena_ten_cong_ty.replace(/CÔNG TY/gi, '').replace(/[\\/:*?"<>|]/g, '').trim()
          next.file_name = `HopDong_${cleanName || 'KhachHang'}.docx`
        }
        if (parsed.bena_xung_danh) next.bena_xung_danh = parsed.bena_xung_danh
        if (parsed.bena_dai_dien) next.bena_dai_dien = parsed.bena_dai_dien.toUpperCase()
        if (parsed.bena_chuc_vu) next.bena_chuc_vu = parsed.bena_chuc_vu
        if (parsed.bena_dia_chi) next.bena_dia_chi = parsed.bena_dia_chi
        if (parsed.bena_mst) next.bena_mst = parsed.bena_mst
        if (parsed.bena_tai_khoan) next.bena_tai_khoan = parsed.bena_tai_khoan
        if (parsed.so_hd) next.so_hd = parsed.so_hd
        if (parsed.noi_dung_mua_ban) next.noi_dung_mua_ban = parsed.noi_dung_mua_ban
        if (parsed.ngay) next.ngay = parsed.ngay
        if (parsed.thang) next.thang = parsed.thang
        if (parsed.nam) next.nam = parsed.nam
        return next
      })

      showToast('success', 'AI đã bóc tách dữ liệu thành công!')
    } catch (err) {
      showToast('error', 'Có lỗi xảy ra khi phân tích dữ liệu.')
    } finally {
      setIsParsing(false)
    }
  }

  // Export Contract Handler (Word / PDF / Both)
  const handleExportDocx = async () => {
    if (!formData.bena_ten_cong_ty.trim()) {
      showToast('error', 'Vui lòng nhập Tên công ty Bên Mua (Bên A)!')
      return
    }

    if (!window.api?.exportContract) {
      showToast('error', 'Vui lòng khởi chạy ứng dụng bằng lệnh "npm run dev" trong Terminal!')
      return
    }

    setIsExporting(true)

    // Pre-Export Validation Check
    const newErrors: Record<string, boolean> = {}
    if (!formData.bena_ten_cong_ty.trim()) newErrors.bena_ten_cong_ty = true
    if (!formData.bena_dai_dien.trim()) newErrors.bena_dai_dien = true
    if (!formData.so_hd.trim()) newErrors.so_hd = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      showToast('error', '⚠️ Vui lòng kiểm tra các ô màu đỏ chưa điền thông tin trước khi xuất!')
      setIsExporting(false)
      return
    }
    setErrors({})
    try {
      let targetFilePath = ''
      let fileName = formData.file_name.trim() || 'HopDong_Mau.docx'
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
      if (formData.bena_ten_cong_ty && window.api?.savePartner) {
        window.api.savePartner({
          ten_cong_ty: formData.bena_ten_cong_ty,
          mst: formData.bena_mst,
          dai_dien: formData.bena_dai_dien,
          xung_danh: formData.bena_xung_danh,
          chuc_vu: formData.bena_chuc_vu,
          dia_chi: formData.bena_dia_chi,
          tai_khoan: formData.bena_tai_khoan
        })
      }

      const res = await window.api.exportContract(formData, targetFilePath)

      if (res.success) {
        let msg = ''
        if (formData.export_type === 'word') {
          msg = `Đã xuất file Hợp đồng Word thành công!`
        } else if (formData.export_type === 'pdf') {
          msg = `Đã xuất file Hợp đồng PDF thành công!`
        } else {
          msg = `Đã xuất cả 2 file (Word & PDF) thành công!`
        }
        showToast('success', msg, res.filePath || targetFilePath, res.pdfPath)
      } else {
        showToast('error', res.error || 'Lỗi khi xuất file Hợp đồng.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Có lỗi xảy ra khi tạo file Hợp đồng.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* High-tech Animated Loading Overlay */}
      <LoadingOverlay
        isVisible={isExporting}
        title="Đang tạo Hợp đồng..."
        subtitle={`Đang xử lý xuất file định dạng ${formData.export_type.toUpperCase()}...`}
        type="export"
      />
      <LoadingOverlay
        isVisible={isParsing}
        title="AI đang bóc tách hợp đồng..."
        subtitle="Vui lòng chờ AI phân tích các thông tin pháp lý..."
        type="ai"
      />

      <PageHeader
        title="Hợp đồng nguyên tắc"
        description="Điền thông tin hoặc dán đoạn văn bản nhờ AI bóc tách nhanh, sau đó xuất file (Word / PDF / Cả 2)"
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
          {isExporting ? 'Đang xuất file...' : `Xuất Hợp Đồng (${formData.export_type.toUpperCase()})`}
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
            Nhập thủ công
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
            Dán văn bản (AI tự bóc tách)
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
                Trợ lý AI bóc tách hợp đồng
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Dán toàn bộ đoạn văn bản thông tin công ty từ Zalo, Email... AI sẽ tự trích xuất thông tin
              </p>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Dán nội dung tin nhắn hoặc thông tin công ty vào đây..."
            rows={5}
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
              {isParsing ? 'Đang bóc tách...' : 'Bóc tách thông tin ngay'}
            </button>
          </div>
        </div>
      )}

      {/* Main Contract Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* GROUP 0: CẤU HÌNH FILE & ĐỊNH DẠNG XUẤT */}
        <ExportConfigSection
          fileName={formData.file_name}
          onChangeFileName={(val) => setFormData((prev) => ({ ...prev, file_name: val }))}
          exportType={formData.export_type}
          onChangeExportType={(type) => setFormData((prev) => ({ ...prev, export_type: type }))}
          exportDir={formData.export_dir}
          onBrowseExportDir={handleBrowseExportDir}
          defaultFileNamePlaceholder="HopDong_Mau.docx"
        />

        {/* GROUP 1: Điều khoản chung */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <FileCheck size={18} color="var(--primary)" />
            <div>
              <h3>1. Thông tin Hợp đồng</h3>
              <p style={{ margin: 0 }}>Số hợp đồng, ngày ký và nội dung hợp đồng</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Số hợp đồng
              </label>
              <input
                type="text"
                className={errors.so_hd ? 'setting-input input-error' : 'setting-input'}
                style={{ width: '100%' }}
                value={formData.so_hd}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, so_hd: e.target.value }))
                  if (errors.so_hd) setErrors((prev) => ({ ...prev, so_hd: false }))
                }}
                placeholder="Số hợp đồng..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Ngày hợp đồng
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

          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
              Nội dung mua bán
            </label>
            <input
              type="text"
              className="setting-input"
              style={{ width: '100%' }}
              value={formData.noi_dung_mua_ban}
              onChange={(e) => setFormData((prev) => ({ ...prev, noi_dung_mua_ban: e.target.value }))}
              placeholder="Nội dung mua bán..."
            />
          </div>
        </div>

        {/* GROUP 2: BÊN MUA (BÊN A) */}
        <div className="settings-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Building2 size={18} color="var(--primary)" />
            <div>
              <h3>2. BÊN MUA (Bên A)</h3>
              <p style={{ margin: 0 }}>Thông tin công ty đối tác khách hàng mua</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Tên công ty <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  className={errors.bena_ten_cong_ty ? 'setting-input input-error' : 'setting-input'}
                  style={{ width: '100%', textTransform: 'uppercase', fontWeight: 600 }}
                  value={formData.bena_ten_cong_ty}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase()
                    if (errors.bena_ten_cong_ty) setErrors((prev) => ({ ...prev, bena_ten_cong_ty: false }))
                    setFormData((prev) => {
                      const cleanName = val.replace(/CÔNG TY/gi, '').replace(/[\\/:*?"<>|]/g, '').trim()
                      const suggestedFileName = cleanName ? `HopDong_${cleanName}.docx` : 'HopDong_Mau.docx'
                      return {
                        ...prev,
                        bena_ten_cong_ty: val,
                        file_name: prev.file_name && !prev.file_name.includes('Mau') ? prev.file_name : suggestedFileName
                      }
                    })
                  }}
                  placeholder="Nhập tên công ty..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Mã số thuế
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%' }}
                  value={formData.bena_mst}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bena_mst: e.target.value }))}
                  placeholder="Mã số thuế..."
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1.5fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Xưng danh
                </label>
                <select
                  className="setting-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={formData.bena_xung_danh}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bena_xung_danh: e.target.value as 'Ông' | 'Bà'
                    }))
                  }
                >
                  <option value="Ông">Ông</option>
                  <option value="Bà">Bà</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Đại diện <span style={{ color: 'var(--destructive)' }}>*</span>
                </label>
                <input
                  type="text"
                  className={errors.bena_dai_dien ? 'setting-input input-error' : 'setting-input'}
                  style={{ width: '100%', textTransform: 'uppercase', fontWeight: 600 }}
                  value={formData.bena_dai_dien}
                  onChange={(e) => {
                    if (errors.bena_dai_dien) setErrors((prev) => ({ ...prev, bena_dai_dien: false }))
                    setFormData((prev) => ({ ...prev, bena_dai_dien: e.target.value.toUpperCase() }))
                  }}
                  placeholder="Nhập người đại diện..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Chức vụ
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%' }}
                  value={formData.bena_chuc_vu}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bena_chuc_vu: e.target.value }))}
                  placeholder="Chức vụ..."
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Địa chỉ
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={formData.bena_dia_chi}
                onChange={(e) => setFormData((prev) => ({ ...prev, bena_dia_chi: e.target.value }))}
                placeholder="Địa chỉ công ty..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Tài khoản ngân hàng
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={formData.bena_tai_khoan}
                onChange={(e) => setFormData((prev) => ({ ...prev, bena_tai_khoan: e.target.value }))}
                placeholder="Số tài khoản ngân hàng..."
              />
            </div>
          </div>
        </div>

        {/* GROUP 3: BÊN BÁN (BÊN B) - VIETKEY */}
        <div className="settings-section">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              marginBottom: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={18} color="var(--primary)" />
              <div>
                <h3>3. BÊN BÁN (Bên B)</h3>
                <p style={{ margin: 0 }}>Thông tin công ty VietKey (có thể sửa nếu cần)</p>
              </div>
            </div>

            <button
              onClick={handleResetBenB}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={14} />
              Mặc định VietKey
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Tên công ty
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%', textTransform: 'uppercase', fontWeight: 600 }}
                  value={formData.benb_ten_cong_ty}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benb_ten_cong_ty: e.target.value.toUpperCase() }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Mã số thuế
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%' }}
                  value={formData.benb_mst}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benb_mst: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '100px 1.5fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Xưng danh
                </label>
                <select
                  className="setting-input"
                  style={{ width: '100%', cursor: 'pointer' }}
                  value={formData.benb_xung_danh}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      benb_xung_danh: e.target.value as 'Ông' | 'Bà'
                    }))
                  }
                >
                  <option value="Ông">Ông</option>
                  <option value="Bà">Bà</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Đại diện
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%', textTransform: 'uppercase', fontWeight: 600 }}
                  value={formData.benb_dai_dien}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benb_dai_dien: e.target.value.toUpperCase() }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                  Chức vụ
                </label>
                <input
                  type="text"
                  className="setting-input"
                  style={{ width: '100%' }}
                  value={formData.benb_chuc_vu}
                  onChange={(e) => setFormData((prev) => ({ ...prev, benb_chuc_vu: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Địa chỉ
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={formData.benb_dia_chi}
                onChange={(e) => setFormData((prev) => ({ ...prev, benb_dia_chi: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
                Tài khoản ngân hàng
              </label>
              <input
                type="text"
                className="setting-input"
                style={{ width: '100%' }}
                value={formData.benb_tai_khoan}
                onChange={(e) => setFormData((prev) => ({ ...prev, benb_tai_khoan: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Export Button Bar */}
      <FloatingExportBar
        title={`Hợp đồng: ${formData.bena_ten_cong_ty || 'Chưa nhập Bên A'}`}
        exportType={formData.export_type}
        fileName={formData.file_name}
        isExporting={isExporting}
        onExport={handleExportDocx}
        buttonLabel={isExporting ? 'Đang tạo file...' : `Tạo & Xuất Hợp Đồng (${formData.export_type.toUpperCase()})`}
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
