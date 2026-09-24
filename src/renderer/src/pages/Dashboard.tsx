import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import {
  FileText,
  Receipt,
  CreditCard,
  ArrowRight,
  Sparkles,
  Clock,
  FolderOpen,
  ExternalLink,
  Users,
  Files,
  FileCheck2,
  RefreshCw,
  Search,
  FileEdit,
  Edit3,
  Plus,
  ShieldCheck,
  Zap,
  CheckCircle2
} from 'lucide-react'
import type { ExportHistoryRecord, PartnerProfile } from '../../../shared/types'
import { useFormDraftsStore } from '../stores/formDrafts.store'

export function Dashboard() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ExportHistoryRecord[]>([])
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const setContractDraft = useFormDraftsStore((s) => s.setContractDraft)
  const setQuotationDraft = useFormDraftsStore((s) => s.setQuotationDraft)
  const setAdvanceRequestDraft = useFormDraftsStore((s) => s.setAdvanceRequestDraft)

  const loadDashboardData = async () => {
    setIsLoadingHistory(true)
    try {
      if (window.api?.getHistory) {
        const hist = await window.api.getHistory()
        setHistory(hist || [])
      }
      if (window.api?.getPartners) {
        const parts = await window.api.getPartners()
        setPartners(parts || [])
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu Dashboard:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleOpenFile = async (filePath: string) => {
    if (window.api?.openPath) {
      await window.api.openPath(filePath)
    }
  }

  const handleShowInFolder = async (filePath: string) => {
    if (window.api?.showItemInFolder) {
      await window.api.showItemInFolder(filePath)
    }
  }

  const handleEditRecord = (record: ExportHistoryRecord) => {
    if (record.docType === 'contract') {
      if (record.dataSnapshot) {
        setContractDraft(record.dataSnapshot as any)
      } else {
        setContractDraft((prev) => ({
          ...prev,
          bena_ten_cong_ty: record.customerName || prev.bena_ten_cong_ty,
          file_name: record.fileName || prev.file_name
        }))
      }
      navigate('/contract')
    } else if (record.docType === 'quotation') {
      if (record.dataSnapshot) {
        setQuotationDraft(record.dataSnapshot as any)
      } else {
        setQuotationDraft((prev) => ({
          ...prev,
          ten_khach_hang: record.customerName || prev.ten_khach_hang,
          file_name: record.fileName || prev.file_name
        }))
      }
      navigate('/quotation')
    } else if (record.docType === 'advance_request') {
      if (record.dataSnapshot) {
        setAdvanceRequestDraft(record.dataSnapshot as any)
      } else {
        setAdvanceRequestDraft((prev) => ({
          ...prev,
          ten_cong_ty_khach: record.customerName || prev.ten_cong_ty_khach,
          file_name: record.fileName || prev.file_name
        }))
      }
      navigate('/advance-request')
    }
  }

  const formatDocTypeName = (type: string) => {
    switch (type) {
      case 'contract':
        return { label: 'Hợp Đồng', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' }
      case 'quotation':
        return { label: 'Báo Giá', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
      case 'advance_request':
        return { label: 'Tạm Ứng', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
      case 'pdf':
        return { label: 'PDF Tools', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' }
      default:
        return { label: 'Tài Liệu', color: 'var(--muted-foreground)', bg: 'var(--muted)' }
    }
  }

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return isoString
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    } catch {
      return isoString
    }
  }

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return history.slice(0, 10)
    const q = searchQuery.toLowerCase()
    return history
      .filter(
        (h) =>
          h.fileName.toLowerCase().includes(q) ||
          (h.customerName && h.customerName.toLowerCase().includes(q))
      )
      .slice(0, 10)
  }, [history, searchQuery])

  return (
    <div>
      <PageHeader
        title="Bảng Điều Khiển"
        description="Chào mừng bạn đến với VietKey DocGen — Hệ thống tạo tài liệu doanh nghiệp tự động"
      />

      {/* Hero Welcome Banner */}
      <div className="hero-banner">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                background: 'rgba(178, 213, 229, 0.22)',
                border: '1px solid rgba(178, 213, 229, 0.4)',
                borderRadius: '20px',
                color: 'var(--foreground)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              <Sparkles size={13} color="var(--primary)" />
              VIETKEY DOCGEN ENTERPRISE 2026
            </span>
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '8px' }}>
            Tạo tài liệu chuẩn xác, thần tốc & chuyên nghiệp
          </h3>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)', maxWidth: '640px', lineHeight: 1.55, margin: 0 }}>
            Tự động điền dữ liệu theo mẫu Word quy chuẩn, tự tính % tăng giá, bóc tách AI tức thì và chỉnh sửa PDF doanh nghiệp không giới hạn.
          </p>

          {/* Quick Action Pill Row inside Hero */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => navigate('/quotation')}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '12.5px', borderRadius: '8px' }}
            >
              <Plus size={15} />
              Tạo Báo Giá
            </button>
            <button
              onClick={() => navigate('/contract')}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12.5px', borderRadius: '8px' }}
            >
              <FileText size={15} color="#3b82f6" />
              Tạo Hợp Đồng
            </button>
            <button
              onClick={() => navigate('/advance-request')}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12.5px', borderRadius: '8px' }}
            >
              <CreditCard size={15} color="#f59e0b" />
              Tạo Tạm Ứng
            </button>
            <button
              onClick={() => navigate('/pdf-tools')}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12.5px', borderRadius: '8px' }}
            >
              <FileEdit size={15} color="#ef4444" />
              PDF Tools
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
              title="Mở thanh tìm kiếm nhanh (Ctrl+K)"
            >
              <Search size={14} />
              <span>Tìm kiếm (Ctrl+K)</span>
            </button>
          </div>
        </div>

        {/* Decorative backdrop glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-40px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(178, 213, 229, 0.25) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Quick Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div
          onClick={() => navigate('/history')}
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer'
          }}
          title="Nhấp để xem trang Lịch sử xuất tài liệu"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <FileCheck2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
              {history.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Tài liệu đã xuất (Xem tất cả)</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/history')}
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer'
          }}
          title="Danh sách đối tác khách hàng"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
              {partners.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Khách hàng ghi nhớ</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/templates')}
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer'
          }}
          title="Quản lý các mẫu Template Word"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(168, 85, 247, 0.12)',
              color: '#a855f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Files size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>4 Mẫu Chuẩn</div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Template Word sẵn sàng</div>
          </div>
        </div>

        <div
          onClick={() => navigate('/pdf-tools')}
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer'
          }}
          title="Mở bộ công cụ PDF Tools"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>PDF Studio</div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Ký, đóng dấu, watermark</div>
          </div>
        </div>
      </div>

      {/* 4 Primary Document Type Cards */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
          Chọn loại tài liệu cần khởi tạo:
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
          Hỗ trợ xuất DOCX chuẩn Microsoft Word & PDF tức thì
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        {/* 1. Hợp đồng nguyên tắc */}
        <div className="doc-card" onClick={() => navigate('/contract')}>
          <div className="doc-card-icon contract">
            <FileText size={24} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Hợp đồng nguyên tắc</h3>
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 7px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3b82f6',
                borderRadius: '10px',
                fontWeight: 600
              }}
            >
              Bên A & B
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5, flex: 1 }}>
            Tự động điền pháp nhân Bên A, Bên B, tự nhớ mã số thuế, số tài khoản ngân hàng và điều khoản mua bán.
          </p>
          <div className="doc-card-action">
            <span>Tạo hợp đồng</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* 2. Báo giá */}
        <div className="doc-card" onClick={() => navigate('/quotation')}>
          <div className="doc-card-icon quotation">
            <Receipt size={24} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Bảng báo giá</h3>
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 7px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                borderRadius: '10px',
                fontWeight: 600
              }}
            >
              + % & Ghi chú
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5, flex: 1 }}>
            Tạo báo giá vật tư, tự động tính % tăng giá, tùy chọn cột ghi chú, bóc tách Zalo/Email bằng AI.
          </p>
          <div className="doc-card-action">
            <span>Tạo báo giá</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* 3. Đề nghị tạm ứng */}
        <div className="doc-card" onClick={() => navigate('/advance-request')}>
          <div className="doc-card-icon advance">
            <CreditCard size={24} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Đề nghị tạm ứng</h3>
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 7px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                borderRadius: '10px',
                fontWeight: 600
              }}
            >
              Dịch chữ & Bảng
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5, flex: 1 }}>
            Soạn thảo đề nghị tạm ứng kinh phí theo đợt, tính bảng vật tư, tự chuyển số tiền hàng tỷ đồng sang chữ chuẩn xác.
          </p>
          <div className="doc-card-action">
            <span>Tạo tạm ứng</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* 4. Bộ công cụ PDF */}
        <div className="doc-card" onClick={() => navigate('/pdf-tools')}>
          <div className="doc-card-icon pdf">
            <FileEdit size={24} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>PDF Studio Tools</h3>
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 7px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                borderRadius: '10px',
                fontWeight: 600
              }}
            >
              Chuyên Sâu
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5, flex: 1 }}>
            Ghép nối, tách trang, nén dung lượng, chèn chữ ký số, đóng dấu mộc đỏ công ty và đánh watermark bản quyền.
          </p>
          <div className="doc-card-action">
            <span>Mở công cụ PDF</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>

      {/* Recent Documents History Center */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '22px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="var(--primary)" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Tài liệu đã xuất gần đây
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
                Mở nhanh file Word, PDF hoặc xem thư mục chứa file
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {history.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  width: '220px'
                }}
              >
                <Search size={14} color="var(--muted-foreground)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Lọc tài liệu gần đây..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--foreground)',
                    width: '100%'
                  }}
                />
              </div>
            )}

            <button
              onClick={() => navigate('/history')}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              title="Xem toàn bộ lịch sử xuất file"
            >
              Xem tất cả ({history.length})
            </button>

            <button
              onClick={loadDashboardData}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="Làm mới lịch sử"
            >
              <RefreshCw size={13} className={isLoadingHistory ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div
            style={{
              padding: '44px 20px',
              textAlign: 'center',
              color: 'var(--muted-foreground)',
              background: 'var(--background)',
              borderRadius: '12px',
              border: '1px dashed var(--border)'
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: 'var(--primary)'
              }}
            >
              <FileText size={28} />
            </div>
            <p style={{ fontWeight: 600, fontSize: '14.5px', color: 'var(--foreground)', marginBottom: '4px' }}>
              Chưa có tài liệu nào được xuất
            </p>
            <p style={{ fontSize: '12.5px', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.5 }}>
              Bạn có thể bắt đầu tạo tài liệu đầu tiên chỉ trong vài giây với các mẫu có sẵn dưới đây:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/quotation')}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                + Báo Giá Mới
              </button>
              <button
                onClick={() => navigate('/contract')}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                + Hợp Đồng Mới
              </button>
              <button
                onClick={() => navigate('/advance-request')}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                + Đề Nghị Tạm Ứng
              </button>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
            Không tìm thấy tài liệu nào khớp với &quot;{searchQuery}&quot;
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', width: '110px' }}>
                    Loại
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                    Tên File
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' }}>
                    Khách Hàng / Đối Tác
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', width: '140px' }}>
                    Thời Gian
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', width: '220px' }}>
                    Thao Tác Nhanh
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record) => {
                  const typeBadge = formatDocTypeName(record.docType)
                  return (
                    <tr
                      key={record.id}
                      className="data-table-row"
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            color: typeBadge.color,
                            background: typeBadge.bg,
                            display: 'inline-block'
                          }}
                        >
                          {typeBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {record.fileName}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--foreground)' }}>
                        {record.customerName || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        {formatDateTime(record.createdAt)}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenFile(record.filePath)}
                            className="btn-primary"
                            style={{
                              padding: '4px 9px',
                              fontSize: '11.5px',
                              borderRadius: '6px'
                            }}
                            title="Mở tài liệu bằng Microsoft Word hoặc trình đọc mặc định"
                          >
                            <ExternalLink size={13} />
                            Mở
                          </button>
                          <button
                            onClick={() => handleShowInFolder(record.filePath)}
                            className="btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              borderRadius: '6px'
                            }}
                            title="Mở thư mục chứa file trong Windows Explorer"
                          >
                            <FolderOpen size={13} />
                            Thư mục
                          </button>
                          <button
                            onClick={() => handleEditRecord(record)}
                            className="btn-ghost"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              borderRadius: '6px'
                            }}
                            title="Nạp lại dữ liệu vào form để chỉnh sửa tiếp"
                          >
                            <Edit3 size={13} />
                            Sửa tiếp
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
