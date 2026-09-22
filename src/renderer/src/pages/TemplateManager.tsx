import { PageHeader } from '../components/layout/PageHeader'
import { FolderOpen, Construction } from 'lucide-react'

export function TemplateManager() {
  return (
    <div>
      <PageHeader
        title="Quản lý Template"
        description="Xem và quản lý các Template Word dùng cho tạo tài liệu"
      />

      <div className="placeholder-page">
        <div className="placeholder-icon">
          <Construction size={36} />
        </div>
        <h3>Đang phát triển</h3>
        <p>
          Trang quản lý Template sẽ được hoàn thiện trong Giai đoạn 5. Tại đây bạn có thể
          import, xem danh sách, và xóa các Template Word.
        </p>
        <div
          style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--muted-foreground)',
            fontSize: '13px'
          }}
        >
          <FolderOpen size={16} />
          <span>Templates/</span>
        </div>
      </div>
    </div>
  )
}
