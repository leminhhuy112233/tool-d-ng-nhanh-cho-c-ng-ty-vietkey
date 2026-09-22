import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { TemplateUploadModal } from '../components/templates/TemplateUploadModal'
import {
  FileText,
  FolderOpen,
  ExternalLink,
  Copy,
  Check,
  Search,
  BookOpen,
  Info,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  FileCheck,
  Tag,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  Upload
} from 'lucide-react'
import type { CustomTemplateDef } from '../../../shared/types'

interface TemplateDef {
  id: string
  fileName: string
  title: string
  category: 'contract' | 'quotation' | 'advance'
  badge: string
  badgeColor: string
  description: string
  fileSize: string
  columns?: string
  keyFeatures: string[]
}

interface VariableDef {
  tag: string
  description: string
  example: string
  templates: ('contract' | 'quotation' | 'advance')[]
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'contract',
    fileName: 'HopDongNguyenTac.docx',
    title: 'Hợp Đồng Nguyên Tắc',
    category: 'contract',
    badge: 'Chính Thức',
    badgeColor: '#3b82f6',
    description: 'Văn bản hợp đồng mua bán vật tư, vật liệu xây dựng quy chuẩn giữa Bên A (Vietkey) và Bên B (Khách hàng).',
    fileSize: '~34 KB',
    keyFeatures: [
      'Tự động chuẩn hóa danh xưng Ông/Bà và VIẾT HOA họ tên đại diện',
      'Đầy đủ thông tin pháp lý: MST, Địa chỉ, STK ngân hàng',
      'Định dạng điều khoản chuyên nghiệp chuẩn pháp lý'
    ]
  },
  {
    id: 'quotation-standard',
    fileName: 'BaoGia.docx',
    title: 'Bảng Báo Giá Chuẩn (4 Cột)',
    category: 'quotation',
    badge: 'Tiêu Chuẩn',
    badgeColor: '#8b5cf6',
    description: 'Mẫu báo giá chuẩn gồm 4 cột cơ bản: STT, Tên Hàng Hóa, Đơn Vị Tính, Đơn Giá.',
    fileSize: '~119 KB',
    columns: '4 cột (STT, Hàng hóa, ĐVT, Đơn giá)',
    keyFeatures: [
      'Bảng động co giãn theo số lượng mặt hàng ({#items})',
      'Tự động đánh số thứ tự định dạng chuẩn (01, 02...)',
      'Hỗ trợ đơn giá tự động tăng %'
    ]
  },
  {
    id: 'quotation-notes',
    fileName: 'BaoGia_CoGhiChu.docx',
    title: 'Bảng Báo Giá Mở Rộng (5 Cột)',
    category: 'quotation',
    badge: 'Có Ghi Chú',
    badgeColor: '#10b981',
    description: 'Mẫu báo giá nâng cao gồm 5 cột: có thêm cột Ghi Chú đặt ngay sau cột Tên Hàng Hóa.',
    fileSize: '~121 KB',
    columns: '5 cột (STT, Hàng hóa, Ghi chú, ĐVT, Đơn giá)',
    keyFeatures: [
      'Cột Ghi chú để ghi quy cách, mác bê tông, điều kiện giao hàng',
      'Tỷ lệ chiều rộng cột cân đối đẹp mắt (9922 dxa)',
      'Tự động chọn khi bật tùy chọn [+ Cột Ghi Chú]'
    ]
  },
  {
    id: 'advance-request',
    fileName: 'DeNghiTamUng.docx',
    title: 'Giấy Đề Nghị Tạm Ứng',
    category: 'advance',
    badge: 'Tài Chính',
    badgeColor: '#f59e0b',
    description: 'Giấy đề nghị tạm ứng kinh phí theo hợp đồng hoặc theo từng đợt cung cấp vật tư.',
    fileSize: '~135 KB',
    keyFeatures: [
      'Tự động chuyển số tiền tạm ứng thành chữ tiếng Việt chuẩn xác',
      'Tự động IN HOA tên công ty khách hàng',
      'Phân chia rõ ràng Đợt tạm ứng, Giá trị đơn hàng và Giá trị tạm ứng'
    ]
  }
]

const VARIABLES: VariableDef[] = [
  // Ngày tháng năm dùng chung
  { tag: '{ngay}', description: 'Ngày ký / lập văn bản (2 chữ số)', example: '22', templates: ['contract', 'quotation', 'advance'] },
  { tag: '{thang}', description: 'Tháng ký / lập văn bản (2 chữ số)', example: '09', templates: ['contract', 'quotation', 'advance'] },
  { tag: '{nam}', description: 'Năm ký / lập văn bản (4 chữ số)', example: '2026', templates: ['contract', 'quotation', 'advance'] },

  // Hợp đồng - Thông tin chung
  { tag: '{so_hd}', description: 'Số hiệu hợp đồng nguyên tắc', example: '01/2026/HĐNT-VK', templates: ['contract'] },
  { tag: '{noi_dung_mua_ban}', description: 'Nội dung mua bán vật tư, hàng hóa', example: 'mua bán vật tư, vật liệu xây dựng', templates: ['contract'] },

  // Hợp đồng - Bên A (Vietkey)
  { tag: '{bena_ten_cong_ty}', description: 'Tên Bên A (Viết hoa toàn bộ)', example: 'CÔNG TY TNHH VIETKEY', templates: ['contract'] },
  { tag: '{bena_xung_danh}', description: 'Danh xưng đại diện Bên A', example: 'Ông', templates: ['contract'] },
  { tag: '{bena_dai_dien}', description: 'Họ tên người đại diện Bên A (IN HOA)', example: 'LÊ MINH HUY', templates: ['contract'] },
  { tag: '{bena_chuc_vu}', description: 'Chức vụ người đại diện Bên A', example: 'Giám đốc', templates: ['contract'] },
  { tag: '{bena_dia_chi}', description: 'Địa chỉ trụ sở công ty Bên A', example: 'Hà Nội, Việt Nam', templates: ['contract'] },
  { tag: '{bena_mst}', description: 'Mã số thuế Bên A', example: '0102030405', templates: ['contract'] },
  { tag: '{bena_tai_khoan}', description: 'Số tài khoản ngân hàng Bên A', example: '190334567890 - Techcombank', templates: ['contract'] },

  // Hợp đồng - Bên B (Khách hàng)
  { tag: '{benb_ten_cong_ty}', description: 'Tên Bên B (Viết hoa toàn bộ)', example: 'CÔNG TY CỔ PHẦN XÂY DỰNG ABC', templates: ['contract'] },
  { tag: '{benb_xung_danh}', description: 'Danh xưng đại diện Bên B', example: 'Bà', templates: ['contract'] },
  { tag: '{benb_dai_dien}', description: 'Họ tên người đại diện Bên B (IN HOA)', example: 'NGUYỄN THỊ MAI', templates: ['contract'] },
  { tag: '{benb_chuc_vu}', description: 'Chức vụ người đại diện Bên B', example: 'Tổng giám đốc', templates: ['contract'] },
  { tag: '{benb_dia_chi}', description: 'Địa chỉ trụ sở Bên B', example: 'Quận 1, TP. Hồ Chí Minh', templates: ['contract'] },
  { tag: '{benb_mst}', description: 'Mã số thuế Bên B', example: '0312345678', templates: ['contract'] },
  { tag: '{benb_tai_khoan}', description: 'Số tài khoản ngân hàng Bên B', example: '0071001234567 - Vietcombank', templates: ['contract'] },

  // Báo giá
  { tag: '{ten_khach_hang}', description: 'Tên đơn vị / khách hàng nhận báo giá', example: 'Công ty Cổ phần Đầu tư Phát Đạt', templates: ['quotation'] },
  { tag: '{#items}', description: 'Mở đầu vòng lặp bảng danh sách hàng hóa (đặt ở ô STT)', example: '{#items}{stt}', templates: ['quotation'] },
  { tag: '{stt}', description: 'Số thứ tự mặt hàng (tự động 01, 02...)', example: '01', templates: ['quotation'] },
  { tag: '{ten_hang}', description: 'Tên mặt hàng, vật tư xây dựng', example: 'Gạch không nung 40x80x180', templates: ['quotation'] },
  { tag: '{ghi_chu}', description: 'Ghi chú quy cách mặt hàng (Template 5 Cột)', example: 'Mác 75, tiêu chuẩn TCVN', templates: ['quotation'] },
  { tag: '{don_vi}', description: 'Đơn vị tính hàng hóa', example: 'M³', templates: ['quotation'] },
  { tag: '{don_gia}', description: 'Đơn giá đã tính toán & tăng % (định dạng VNĐ)', example: '1.608', templates: ['quotation'] },
  { tag: '{/items}', description: 'Kết thúc vòng lặp bảng (đặt ở ô cuối cùng của hàng)', example: '{/items}', templates: ['quotation'] },

  // Đề nghị tạm ứng
  { tag: '{ten_cong_ty_khach}', description: 'Tên công ty khách hàng (IN HOA)', example: 'CÔNG TY TNHH XÂY DỰNG SỐ 1', templates: ['advance'] },
  { tag: '{noi_dung_cung_cap}', description: 'Nội dung cung cấp hàng hóa/dịch vụ', example: 'Cung cấp cát bê tông và đá 1x2', templates: ['advance'] },
  { tag: '{dot_tam_ung}', description: 'Số đợt tạm ứng', example: '1', templates: ['advance'] },
  { tag: '{gia_tri_don_hang}', description: 'Tổng giá trị đơn hàng / hợp đồng', example: '150.000.000', templates: ['advance'] },
  { tag: '{gia_tri_tam_ung}', description: 'Số tiền đề nghị tạm ứng đợt này', example: '50.000.000', templates: ['advance'] },
  { tag: '{so_tien_bang_chu}', description: 'Số tiền tạm ứng viết bằng chữ tiếng Việt', example: 'Năm mươi triệu đồng chẵn', templates: ['advance'] }
]

export function TemplateManager() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'contract' | 'quotation' | 'advance'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [copiedTag, setCopiedTag] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Custom Templates State
  const [customTemplates, setCustomTemplates] = useState<CustomTemplateDef[]>([])
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    setTimeout(() => setToastMessage(null), 5000)
  }

  const loadCustomTemplates = async () => {
    if (window.api?.getCustomTemplates) {
      try {
        const list = await window.api.getCustomTemplates()
        setCustomTemplates(list || [])
      } catch (err) {
        console.error('Lỗi tải custom templates:', err)
      }
    }
  }

  useEffect(() => {
    loadCustomTemplates()
  }, [])

  const handleDeleteCustomTemplate = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu tùy biến "${name}"?`)) return
    try {
      if (window.api?.deleteCustomTemplate) {
        const res = await window.api.deleteCustomTemplate(id)
        if (res.success) {
          showToast('success', `Đã xóa mẫu "${name}" thành công!`)
          loadCustomTemplates()
        } else {
          showToast('error', res.error || 'Lỗi khi xóa mẫu.')
        }
      }
    } catch (err) {
      showToast('error', 'Không thể xóa mẫu này.')
    }
  }

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag)
    setCopiedTag(tag)
    showToast('success', `Đã sao chép mã biến: ${tag}`)
    setTimeout(() => setCopiedTag(null), 2500)
  }

  const handleOpenTemplatesFolder = async () => {
    try {
      if (window.api?.openTemplatesFolder) {
        await window.api.openTemplatesFolder()
        showToast('success', 'Đang mở thư mục chứa Templates trong File Explorer!')
      } else {
        showToast('error', 'Cần chạy trong Electron desktop để mở thư mục.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Không thể mở thư mục.')
    }
  }

  const handleOpenTemplateFile = async (fileName: string) => {
    try {
      if (window.api?.openTemplateFile) {
        await window.api.openTemplateFile(fileName)
        showToast('success', `Đang mở file template "${fileName}" bằng Microsoft Word...`)
      } else {
        showToast('error', 'Cần chạy trong Electron desktop để mở file.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Không thể mở file.')
    }
  }

  // Filter templates
  const filteredTemplates = TEMPLATES.filter((t) => {
    if (selectedCategory === 'all') return true
    return t.category === selectedCategory
  })

  // Filter variables
  const filteredVariables = VARIABLES.filter((v) => {
    const matchesCategory = selectedCategory === 'all' || v.templates.includes(selectedCategory)
    const matchesSearch =
      !searchKeyword ||
      v.tag.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      v.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      v.example.toLowerCase().includes(searchKeyword.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Header */}
      <PageHeader
        title="Quản Lý Template & Tạo Mẫu Tùy Biến"
        description="Tra cứu mã trường (tag), mở trực tiếp file Word hoặc tải lên mẫu Word bôi đỏ để tự động tạo form bằng AI"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} />
            + Tải Lên Mẫu Word Mới
          </button>

          <button
            onClick={handleOpenTemplatesFolder}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'var(--muted)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Mở thư mục chứa các file .docx trong Windows Explorer"
          >
            <FolderOpen size={16} />
            Thư Mục Template
          </button>
        </div>
      </PageHeader>

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
          flexWrap: 'wrap'
        }}
      >
        {[
          { id: 'all', label: 'Tất Cả Mẫu Template' },
          { id: 'contract', label: 'Hợp Đồng Nguyên Tắc' },
          { id: 'quotation', label: 'Bảng Báo Giá' },
          { id: 'advance', label: 'Giấy Đề Nghị Tạm Ứng' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: selectedCategory === tab.id ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: selectedCategory === tab.id ? 'var(--primary)' : 'var(--card)',
              color: selectedCategory === tab.id ? 'var(--primary-foreground)' : 'var(--foreground)',
              fontWeight: selectedCategory === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section 0: Custom User Templates */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 700,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={18} color="var(--primary)" />
            Mẫu Tùy Biến Của Tôi ({customTemplates.length})
          </h3>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--primary)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            Thêm mẫu mới
          </button>
        </div>

        {customTemplates.length === 0 ? (
          <div
            style={{
              padding: '30px 20px',
              background: 'var(--card)',
              border: '1px dashed var(--border)',
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              <Upload size={22} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: '14.5px', fontWeight: 600, color: 'var(--foreground)' }}>
              Chưa có mẫu tùy biến nào
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: 'var(--muted-foreground)', maxWidth: '500px', marginInline: 'auto' }}>
              Bạn có thể lấy bất kỳ file Word thật nào của công ty, <strong>bôi chữ màu ĐỎ</strong> vào các chỗ cần thay đổi rồi tải lên. AI sẽ tự động tạo Form điền cho bạn trong tích tắc!
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              Tải lên mẫu Word ngay
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '18px'
            }}
          >
            {customTemplates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {tpl.name}
                    </h4>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontWeight: 600,
                        background: tpl.isFromRedHighlight ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                        color: tpl.isFromRedHighlight ? '#ef4444' : 'var(--primary)',
                        border: `1px solid ${tpl.isFromRedHighlight ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`
                      }}
                    >
                      {tpl.isFromRedHighlight ? 'Bôi Đỏ AI' : 'Mẫu Tùy Biến'}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '0 0 12px', lineHeight: '1.5' }}>
                    {tpl.description || 'Mẫu văn bản được tải lên và phân tích tự động'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11.5px', color: 'var(--muted-foreground)' }}>
                    <span>📝 {tpl.fields.length} trường điền</span>
                    <span>•</span>
                    <span>📁 {tpl.fileName}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => navigate(`/custom-form/${tpl.id}`)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      background: 'var(--primary)',
                      color: 'var(--primary-foreground)',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Play size={14} />
                    Điền & Xuất
                  </button>

                  <button
                    onClick={() => window.api?.openPath(tpl.docxFilePath)}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--muted)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Mở file Word gốc trong Word"
                  >
                    <ExternalLink size={14} />
                  </button>

                  <button
                    onClick={() => handleDeleteCustomTemplate(tpl.id, tpl.name)}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--muted)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--muted-foreground)',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    title="Xóa mẫu này"
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 1: Template Cards Grid */}
      <div style={{ marginBottom: '36px' }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={18} color="var(--primary)" />
          Danh Sách Mẫu Tài Liệu Hệ Thống ({filteredTemplates.length})
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '18px'
          }}
        >
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                {/* Header of Card */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FileText size={22} color="var(--primary)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{tpl.title}</h4>
                      <code style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{tpl.fileName}</code>
                    </div>
                  </div>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: `${tpl.badgeColor}20`,
                      color: tpl.badgeColor,
                      border: `1px solid ${tpl.badgeColor}50`
                    }}
                  >
                    {tpl.badge}
                  </span>
                </div>

                {/* Description */}
                <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', lineHeight: '1.5', margin: '0 0 14px 0' }}>
                  {tpl.description}
                </p>

                {/* Key Features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  {tpl.keyFeatures.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px' }}>
                      <FileCheck size={13} color="#10b981" />
                      <span style={{ color: 'var(--foreground)' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border)'
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                  Dung lượng: <strong>{tpl.fileSize}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => handleOpenTemplateFile(tpl.fileName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    background: 'var(--muted)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '7px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Mở file Word mẫu này để xem hoặc chỉnh sửa mẫu thiết kế"
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--primary)'
                    e.currentTarget.style.color = 'var(--primary-foreground)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--muted)'
                    e.currentTarget.style.color = 'var(--foreground)'
                  }}
                >
                  <ExternalLink size={13} />
                  Mở trong Word
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Interactive Variables Cheatsheet */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
          marginBottom: '36px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Tag size={18} color="var(--primary)" />
              Bảng Tra Cứu Mã Biến (Tags) Cho File Word
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', margin: '4px 0 0 0' }}>
              Nhấp nút sao chép để dán mã vào văn bản Word (.docx). Công cụ Docxtemplater sẽ tự động điền dữ liệu vào các mã này.
            </p>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search
              size={15}
              color="var(--muted-foreground)"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              className="setting-input"
              style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px' }}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm mã biến, ý nghĩa..."
            />
          </div>
        </div>

        {/* Variables Table */}
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
                <th style={{ padding: '10px 14px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left', width: '240px' }}>
                  Mã Biến (Tag)
                </th>
                <th style={{ padding: '10px 14px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left' }}>
                  Ý Nghĩa & Mô Tả
                </th>
                <th style={{ padding: '10px 14px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left', width: '260px' }}>
                  Dữ Liệu Mẫu
                </th>
                <th style={{ padding: '10px 14px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'center', width: '90px' }}>
                  Thao Tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVariables.map((v) => (
                <tr
                  key={v.tag}
                  style={{
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  {/* Mã Tag */}
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code
                        style={{
                          background: 'var(--muted)',
                          color: 'var(--primary)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '13px',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {v.tag}
                      </code>
                    </div>
                  </td>

                  {/* Mô tả */}
                  <td style={{ padding: '10px 14px', color: 'var(--foreground)' }}>
                    {v.description}
                  </td>

                  {/* Ví dụ */}
                  <td style={{ padding: '10px 14px', color: 'var(--muted-foreground)', fontStyle: 'italic', fontSize: '12px' }}>
                    {v.example}
                  </td>

                  {/* Nút Sao Chép */}
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyTag(v.tag)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: copiedTag === v.tag ? '#10b981' : 'var(--muted)',
                        color: copiedTag === v.tag ? '#ffffff' : 'var(--foreground)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Sao chép mã biến vào Clipboard"
                    >
                      {copiedTag === v.tag ? (
                        <>
                          <Check size={12} /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Sao chép
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Professional Guidelines */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          padding: '20px 24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}
      >
        <Info size={22} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
          <h4 style={{ fontWeight: 700, margin: '0 0 8px 0', color: 'var(--foreground)' }}>
            Lưu Ý Quan Trọng Khi Tự Tùy Biến Hoặc Thiết Kế Lại File Word (.docx):
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--muted-foreground)' }}>
            <li>
              <strong>Không ngắt quãng mã biến:</strong> Khi gõ thẻ <code style={{ color: 'var(--primary)' }}>{`{ten_bien}`}</code>, hãy gõ liền mạch trong một lượt. Nếu copy/paste từng chữ trong Word, Word có thể chèn các thẻ định dạng XML ẩn vào giữa chữ làm hỏng tag.
            </li>
            <li>
              <strong>Bảng lặp lại dữ liệu:</strong> Với bảng hàng hóa, luôn đặt cú pháp mở <code style={{ color: 'var(--primary)' }}>{'{#items}{stt}'}</code> tại ô đầu tiên và đóng bằng <code style={{ color: 'var(--primary)' }}>{'{/items}'}</code> tại ô cuối cùng của cùng một hàng.
            </li>
            <li>
              <strong>Font chữ khuyên dùng:</strong> Sử dụng các font Unicode chuẩn văn phòng như <em>Times New Roman</em>, <em>Arial</em>, <em>Calibri</em> để đảm bảo tiếng Việt luôn sắc nét khi mở trên bất kỳ máy tính nào.
            </li>
            <li>
              <strong>Bảo toàn file gốc:</strong> Luôn sao lưu một bản trước khi sửa đổi trực tiếp vào thư mục <code>templates/</code>.
            </li>
          </ul>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="toast"
          style={{
            borderColor: toastMessage.type === 'error' ? 'var(--destructive)' : '#10b981',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <AlertCircle size={18} color="var(--destructive)" />
          )}
          <span style={{ fontWeight: 600 }}>{toastMessage.text}</span>
        </div>
      )}

      {/* Upload Custom Template Modal */}
      <TemplateUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onTemplateCreated={(newTpl) => {
          loadCustomTemplates()
          showToast('success', `Đã tạo mẫu thành công: "${newTpl.name}"!`)
          navigate(`/custom-form/${newTpl.id}`)
        }}
      />
    </div>
  )
}
