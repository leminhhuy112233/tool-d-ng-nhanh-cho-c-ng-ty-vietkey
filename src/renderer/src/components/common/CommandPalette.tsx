import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  FileText,
  Receipt,
  CreditCard,
  FolderOpen,
  Settings,
  Sun,
  Moon,
  Users,
  LayoutDashboard,
  ArrowRight,
  Command,
  X,
  Clock
} from 'lucide-react'
import { useThemeStore } from '../../stores/theme.store'
import type { PartnerProfile } from '../../../../shared/types'

interface CommandItem {
  id: string
  title: string
  description?: string
  category: 'Tài liệu' | 'Hệ thống' | 'Giao diện' | 'Đối tác'
  icon: React.ReactNode
  action: () => void
}

export function CommandPalette({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { theme, toggleTheme, setTheme } = useThemeStore()
  const [query, setQuery] = useState('')
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load partners on mount
  useEffect(() => {
    if (window.api?.getPartners) {
      window.api.getPartners().then((list) => setPartners(list || []))
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Core Command Items
  const staticCommands: CommandItem[] = [
    {
      id: 'doc-quotation',
      title: 'Tạo Báo Giá Mới',
      description: 'Soạn thảo bảng báo giá vật tư, tính % tăng giá, xuất Word/PDF',
      category: 'Tài liệu',
      icon: <Receipt size={18} color="#10b981" />,
      action: () => {
        navigate('/quotation')
        onClose()
      }
    },
    {
      id: 'doc-contract',
      title: 'Tạo Hợp Đồng Nguyên Tắc',
      description: 'Hợp đồng mua bán vật tư chuẩn mực Bên A & Bên B',
      category: 'Tài liệu',
      icon: <FileText size={18} color="#3b82f6" />,
      action: () => {
        navigate('/contract')
        onClose()
      }
    },
    {
      id: 'doc-advance',
      title: 'Tạo Giấy Đề Nghị Tạm Ứng',
      description: 'Tạm ứng theo đợt, tự động dịch số tiền thành chữ',
      category: 'Tài liệu',
      icon: <CreditCard size={18} color="#f59e0b" />,
      action: () => {
        navigate('/advance-request')
        onClose()
      }
    },
    {
      id: 'nav-history',
      title: 'Lịch Sử Xuất Tài Liệu',
      description: 'Xem lại toàn bộ các file Hợp đồng, Báo giá, Tạm ứng đã tạo',
      category: 'Tài liệu',
      icon: <Clock size={18} color="var(--primary)" />,
      action: () => {
        navigate('/history')
        onClose()
      }
    },
    {
      id: 'nav-dashboard',
      title: 'Về Dashboard Tổng Quan',
      description: 'Xem các loại tài liệu, thống kê và lịch sử đã xuất',
      category: 'Hệ thống',
      icon: <LayoutDashboard size={18} color="var(--primary)" />,
      action: () => {
        navigate('/')
        onClose()
      }
    },
    {
      id: 'nav-templates',
      title: 'Quản Lý Template Word',
      description: 'Xem 3 mẫu Word chuẩn và mở thư mục templates',
      category: 'Hệ thống',
      icon: <FolderOpen size={18} color="var(--accent)" />,
      action: () => {
        navigate('/templates')
        onClose()
      }
    },
    {
      id: 'nav-settings',
      title: 'Cài Đặt & Cấu Hình',
      description: 'Thiết lập thư mục xuất file mặc định và API Key',
      category: 'Hệ thống',
      icon: <Settings size={18} color="var(--muted-foreground)" />,
      action: () => {
        navigate('/settings')
        onClose()
      }
    },
    {
      id: 'theme-toggle',
      title: theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)',
      description: 'Đổi phong cách màu sắc ứng dụng',
      category: 'Giao diện',
      icon: theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#3b82f6" />,
      action: () => {
        toggleTheme()
        onClose()
      }
    }
  ]

  // Partner items
  const partnerCommands: CommandItem[] = partners.map((p) => ({
    id: `partner-${p.id}`,
    title: `Khách hàng: ${p.ten_cong_ty}`,
    description: `MST: ${p.mst || 'Chưa lưu'} | Đại diện: ${p.dai_dien || 'Chưa lưu'}`,
    category: 'Đối tác',
    icon: <Users size={18} color="#06b6d4" />,
    action: () => {
      navigate('/quotation')
      onClose()
    }
  }))

  const allItems = [...staticCommands, ...partnerCommands]

  const filteredItems = allItems.filter((it) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      it.title.toLowerCase().includes(q) ||
      (it.description && it.description.toLowerCase().includes(q)) ||
      it.category.toLowerCase().includes(q)
    )
  })

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '12vh'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <Search size={18} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm tài liệu, đối tác, lệnh nhanh... (VD: báo giá, hợp đồng, tạm ứng)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14.5px',
              color: 'var(--foreground)',
              fontFamily: "'Inter', sans-serif"
            }}
          />
          <span
            style={{
              fontSize: '11px',
              background: 'var(--muted)',
              color: 'var(--muted-foreground)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div style={{ overflowY: 'auto', padding: '8px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13px' }}>
              Không tìm thấy kết quả nào phù hợp với &quot;{query}&quot;
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--muted)' : 'transparent',
                    border: isSelected ? '1px solid var(--border)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'var(--background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {item.title}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'var(--background)',
                        color: 'var(--muted-foreground)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight size={14} color="var(--primary)" />}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            background: 'var(--muted)'
          }}
        >
          <span>
            Dùng <kbd>↑</kbd> <kbd>↓</kbd> để di chuyển, <kbd>Enter</kbd> để chọn
          </span>
          <span>Phím tắt toàn ứng dụng: <b>Ctrl + K</b></span>
        </div>
      </div>
    </div>
  )
}
