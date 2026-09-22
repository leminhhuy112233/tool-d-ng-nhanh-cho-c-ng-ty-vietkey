import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  CreditCard,
  FolderOpen,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Zap,
  Clock,
  FileEdit
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  section?: string
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    section: 'CHÍNH'
  },
  {
    path: '/contract',
    label: 'Hợp đồng nguyên tắc',
    icon: <FileText size={20} />,
    section: 'TÀI LIỆU'
  },
  {
    path: '/quotation',
    label: 'Báo giá',
    icon: <Receipt size={20} />
  },
  {
    path: '/advance-request',
    label: 'Đề nghị tạm ứng',
    icon: <CreditCard size={20} />
  },
  {
    path: '/history',
    label: 'Lịch sử xuất file',
    icon: <Clock size={20} />
  },
  {
    path: '/templates',
    label: 'Quản lý Template',
    icon: <FolderOpen size={20} />,
    section: 'HỆ THỐNG'
  },
  {
    path: '/pdf-tools',
    label: 'PDF Tools',
    icon: <FileEdit size={20} />,
    section: 'CÔNG CỤ'
  },
  {
    path: '/settings',
    label: 'Cài đặt',
    icon: <Settings size={20} />
  }
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  let currentSection = ''

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header - Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Zap size={20} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand">
            <h1>VietKey DocGen</h1>
            <p>Tạo tài liệu thông minh</p>
          </div>
        )}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const showSection = item.section && item.section !== currentSection
          if (item.section) currentSection = item.section

          return (
            <div key={item.path}>
              {showSection && !collapsed && (
                <div className="sidebar-section-label">{item.section}</div>
              )}
              <NavLink
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {!collapsed && <span className="nav-item-label">{item.label}</span>}
              </NavLink>
            </div>
          )
        })}
      </nav>

      {/* Footer - Version */}
      <div className="sidebar-footer">
        {!collapsed ? (
          <div className="sidebar-version">
            <Zap size={14} />
            <span>v1.0.0 — Giai đoạn 4</span>
          </div>
        ) : (
          <div className="sidebar-version-collapsed">v1.0</div>
        )}
      </div>
    </aside>
  )
}
