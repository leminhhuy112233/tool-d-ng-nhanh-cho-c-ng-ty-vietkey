import { useState } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { LoadingOverlay } from '../components/common/LoadingOverlay'
import { ExportConfigSection } from '../components/common/ExportConfigSection'
import { FloatingExportBar } from '../components/common/FloatingExportBar'
import { DocumentToast } from '../components/common/DocumentToast'
import { DateInputGroup } from '../components/common/DateInputGroup'
import { FormModeTabs } from '../components/common/FormModeTabs'
import { AiExtractCard } from '../components/common/AiExtractCard'
import { PartnerAutocompleteInput } from '../components/common/PartnerAutocompleteInput'
import {
  Download,
  Building2,
  UserCheck,
  RotateCcw,
  FileCheck
} from 'lucide-react'
import type { ContractData, ExportFileType, PartnerProfile } from '../../../shared/types'
import { DEFAULT_BEN_B } from '../../../shared/types'
import { useFormDraftsStore } from '../stores/formDrafts.store'
import { useDocumentToast } from '../hooks/useDocumentToast'
import { useExportShortcut, useDefaultExportDir } from '../hooks/useFormShortcuts'

export function ContractForm() {
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual')
  const [isParsing, setIsParsing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Shared Toast & Chime Sound
  const { toast, showToast, clearToast } = useDocumentToast()

  // Form Draft Persistence Store
  const formData = useFormDraftsStore((s) => s.contractDraft)
  const setFormData = useFormDraftsStore((s) => s.setContractDraft)
  const resetContractDraft = useFormDraftsStore((s) => s.resetContractDraft)

  // Nạp thư mục xuất mặc định
  useDefaultExportDir((dir) => setFormData((prev) => ({ ...prev, export_dir: dir })))

  const handleClearAllData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ thông tin đang điền trong hợp đồng để làm mới?')) {
      resetContractDraft()
      showToast('success', 'Đã xóa toàn bộ thông tin và làm mới hợp đồng!')
    }
  }

  const handleFillToday = () => {
    const today = new Date()
    setFormData((prev) => ({
      ...prev,
      ngay: String(today.getDate()).padStart(2, '0'),
      thang: String(today.getMonth() + 1).padStart(2, '0'),
      nam: String(today.getFullYear())
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
  const handleAIParse = async (text: string) => {
    if (!text.trim()) {
      showToast('error', 'Vui lòng dán nội dung thông tin công ty vào trước!')
      return
    }

    if (!window.api?.parseTextWithAI) {
      showToast('error', 'Chức năng AI cần chạy trong Desktop Client Electron.')
      return
    }

    setIsParsing(true)
    try {
      const parsed = await window.api.parseTextWithAI(text)

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

      showToast('success', 'AI đã bóc tách dữ liệu hợp đồng thành công!')
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

  // Lắng nghe phím tắt Ctrl + Enter
  useExportShortcut(handleExportDocx, isExporting)

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
            title="Xóa toàn bộ thông tin đã điền và làm mới hợp đồng"
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
            {isExporting ? 'Đang xuất file...' : `Xuất Hợp Đồng (${formData.export_type.toUpperCase()})`}
          </button>
        </div>
      </PageHeader>

      {/* Control Bar */}
      <FormModeTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onFillToday={handleFillToday}
      />

      {/* AI Assistant Section */}
      {activeTab === 'ai' && (
        <AiExtractCard
          title="Trợ lý AI bóc tách hợp đồng"
          description="Dán toàn bộ đoạn văn bản thông tin công ty từ Zalo, Email... AI sẽ tự trích xuất thông tin"
          rawText={rawText}
          isParsing={isParsing}
          onChangeText={setRawText}
          onClear={() => setRawText('')}
          onParse={handleAIParse}
        />
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
              <DateInputGroup
                label="Ngày hợp đồng"
                day={formData.ngay}
                month={formData.thang}
                year={formData.nam}
                onChangeDay={(val) => setFormData((p) => ({ ...p, ngay: val }))}
                onChangeMonth={(val) => setFormData((p) => ({ ...p, thang: val }))}
                onChangeYear={(val) => setFormData((p) => ({ ...p, nam: val }))}
                onFillToday={handleFillToday}
              />
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
                <PartnerAutocompleteInput
                  label="Tên công ty"
                  required
                  uppercase
                  isError={errors.bena_ten_cong_ty}
                  value={formData.bena_ten_cong_ty}
                  placeholder="Nhập tên công ty đối tác..."
                  onChange={(val) => {
                    if (errors.bena_ten_cong_ty) setErrors((prev) => ({ ...prev, bena_ten_cong_ty: false }))
                    const cleanName = val.replace(/CÔNG TY/gi, '').replace(/[\\/:*?"<>|]/g, '').trim()
                    const suggestedFileName = cleanName ? `HopDong_${cleanName}.docx` : 'HopDong_Mau.docx'
                    setFormData((prev) => ({
                      ...prev,
                      bena_ten_cong_ty: val,
                      file_name: prev.file_name && !prev.file_name.includes('Mau') ? prev.file_name : suggestedFileName
                    }))
                  }}
                  onSelectPartner={(p) => {
                    setFormData((prev) => ({
                      ...prev,
                      bena_mst: p.mst || prev.bena_mst,
                      bena_dai_dien: p.dai_dien || prev.bena_dai_dien,
                      bena_xung_danh: (p.xung_danh as any) || prev.bena_xung_danh,
                      bena_chuc_vu: p.chuc_vu || prev.bena_chuc_vu,
                      bena_dia_chi: p.dia_chi || prev.bena_dia_chi,
                      bena_tai_khoan: p.tai_khoan || prev.bena_tai_khoan
                    }))
                  }}
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
      {/* Floating Action Bar */}
      <FloatingExportBar
        title={`Hợp đồng: ${formData.bena_ten_cong_ty || 'Chưa nhập Bên A'}`}
        exportType={formData.export_type}
        fileName={formData.file_name}
        isExporting={isExporting}
        onExport={handleExportDocx}
        buttonLabel={isExporting ? 'Đang tạo file...' : `Tạo & Xuất Hợp Đồng (${formData.export_type.toUpperCase()})`}
      />

      {/* Reusable Toast Notification */}
      <DocumentToast toast={toast} onClose={clearToast} />
    </div>
  )
}
