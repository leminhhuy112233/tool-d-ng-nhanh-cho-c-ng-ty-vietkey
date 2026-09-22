import { useState, useEffect } from 'react'
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
  RefreshCw
} from 'lucide-react'
import type { ExportHistoryRecord, PartnerProfile } from '../../../shared/types'

export function Dashboard() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ExportHistoryRecord[]>([])
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

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

  const formatDocTypeName = (type: string) => {
    switch (type) {
      case 'contract':
        return { label: 'Hợp Đồng', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)' }
      case 'quotation':
        return { label: 'Báo Giá', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' }
      case 'advance_request':
        return { label: 'Tạm Ứng', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' }
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

  return (
    <div>
      <PageHeader
        title="Bảng Điều Khiển"
        description="Chào mừng bạn đến với VietKey DocGen — Hệ thống tạo tài liệu doanh nghiệp tự động"
      />

      {/* Hero Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '26px 30px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                background: 'rgba(6, 182, 212, 0.18)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '20px',
                color: '#38bdf8',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}
            >
              <Sparkles size={13} />
              VIETKEY DOCGEN PRO
            </span>
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
            Tạo tài liệu chuẩn xác & siêu tốc
          </h3>
          <p style={{ fontSize: '13.5px', color: '#94a3b8', maxWidth: '580px', lineHeight: 1.5, margin: 0 }}>
            Tự động điền dữ liệu theo template Word, tự tính % tăng giá, bóc tách văn bản bằng AI và xuất PDF tức thì.
          </p>
        </div>

        {/* Decorative backdrop glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-30px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, rgba(0,0,0,0) 70%)',
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
          marginBottom: '24px'
        }}
      >
        <div
          onClick={() => navigate('/history')}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Nhấp để xem trang Lịch sử xuất tài liệu đầy đủ"
          onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
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
              justifyContent: 'center'
            }}
          >
            <FileCheck2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
              {history.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Tài liệu đã xuất (Xem lịch sử)</div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
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
              justifyContent: 'center'
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
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
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
              justifyContent: 'center'
            }}
          >
            <Files size={22} />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>3 Mẫu</div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Template chuẩn sẵn sàng</div>
          </div>
        </div>
      </div>

      {/* 3 Main Document Type Cards */}
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '14px', color: 'var(--foreground)' }}>
        Chọn loại tài liệu cần tạo:
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        {/* 1. Hợp đồng nguyên tắc */}
        <div className="doc-card" onClick={() => navigate('/contract')}>
          <div className="doc-card-icon contract">
            <FileText size={26} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Hợp đồng nguyên tắc</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5 }}>
            Tự động điền pháp nhân Bên A, Bên B, tự nhớ mã số thuế, số tài khoản ngân hàng và các điều khoản mua bán.
          </p>
          <div className="doc-card-action">
            <span>Tạo hợp đồng</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* 2. Báo giá */}
        <div className="doc-card" onClick={() => navigate('/quotation')}>
          <div className="doc-card-icon quotation">
            <Receipt size={26} />
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
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5 }}>
            Tạo báo giá vật tư, tự động tính % tăng giá, tùy chọn cột ghi chú, bóc tách Zalo/Email bằng AI.
          </p>
          <div className="doc-card-action">
            <span>Tạo báo giá</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* 3. Đề nghị tạm ứng */}
        <div className="doc-card" onClick={() => navigate('/advance-request')}>
          <div
            className="doc-card-icon"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.15))',
              color: '#f59e0b'
            }}
          >
            <CreditCard size={26} />
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
              Tự dịch tiền thành chữ
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--muted-foreground)', marginBottom: '16px', lineHeight: 1.5 }}>
            Soạn thảo đề nghị tạm ứng kinh phí theo đợt, tự động chuyển số tiền hàng tỷ đồng sang chữ tiếng Việt chuẩn xác.
          </p>
          <div className="doc-card-action">
            <span>Tạo tạm ứng</span>
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
          padding: '24px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
            <button
              onClick={() => navigate('/history')}
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
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Xem toàn bộ lịch sử xuất file"
            >
              Xem tất cả ({history.length})
            </button>

            <button
              onClick={loadDashboardData}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'var(--muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--foreground)',
                cursor: 'pointer'
              }}
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
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--muted-foreground)',
              fontSize: '13px'
            }}
          >
            <FileText size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontWeight: 500, marginBottom: '6px' }}>Chưa có tài liệu nào được xuất</p>
            <p style={{ fontSize: '12px', opacity: 0.8 }}>
              Chọn một trong các mục ở trên để bắt đầu tạo tài liệu đầu tiên của bạn.
            </p>
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
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', width: '160px' }}>
                    Thao Tác Nhanh
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((record) => {
                  const typeBadge = formatDocTypeName(record.docType)
                  return (
                    <tr
                      key={record.id}
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--muted)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
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
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              background: 'var(--primary)',
                              color: 'var(--primary-foreground)',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Mở tài liệu bằng ứng dụng mặc định"
                          >
                            <ExternalLink size={13} />
                            Mở
                          </button>
                          <button
                            onClick={() => handleShowInFolder(record.filePath)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 8px',
                              background: 'transparent',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              color: 'var(--foreground)',
                              cursor: 'pointer'
                            }}
                            title="Mở thư mục chứa file trong Windows Explorer"
                          >
                            <FolderOpen size={13} />
                            Thư mục
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
