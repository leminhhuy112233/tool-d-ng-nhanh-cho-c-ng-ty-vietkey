import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { FileText, Receipt, ArrowRight, Sparkles } from 'lucide-react'

export function Dashboard() {
  const navigate = useNavigate()

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Chọn loại tài liệu để bắt đầu tạo"
      />

      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '28px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={20} color="rgba(255,255,255,0.9)" />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              VietKey DocGen
            </span>
          </div>
          <h3
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              marginBottom: '6px'
            }}
          >
            Tạo tài liệu nhanh chóng với AI
          </h3>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', maxWidth: '500px' }}>
            Nhập dữ liệu một lần, AI hỗ trợ điền thông tin, xuất tài liệu Word hoàn chỉnh trong vài giây.
          </p>
        </div>
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-30px',
            right: '-20px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            right: '60px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)'
          }}
        />
      </div>

      {/* Document Type Cards */}
      <div className="dashboard-grid">
        {/* Hợp đồng nguyên tắc */}
        <div className="doc-card" onClick={() => navigate('/contract')}>
          <div className="doc-card-icon contract">
            <FileText size={26} />
          </div>
          <h3>Hợp đồng nguyên tắc</h3>
          <p>
            Tạo hợp đồng nguyên tắc với thông tin công ty, đại diện, ngân hàng và các điều khoản
            chuẩn.
          </p>
          <div className="doc-card-action">
            <span>Tạo mới</span>
            <ArrowRight size={16} />
          </div>
        </div>

        {/* Báo giá */}
        <div className="doc-card" onClick={() => navigate('/quotation')}>
          <div className="doc-card-icon quotation">
            <Receipt size={26} />
          </div>
          <h3>Báo giá</h3>
          <p>
            Tạo báo giá với danh sách sản phẩm, đơn giá, thuế, chiết khấu và tổng cộng tự động
            tính.
          </p>
          <div className="doc-card-action">
            <span>Tạo mới</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    </div>
  )
}
