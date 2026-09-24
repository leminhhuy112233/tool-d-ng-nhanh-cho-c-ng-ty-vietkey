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
  Clock,
  FileEdit,
  ExternalLink,
  Sparkles,
  Command,
  X
} from 'lucide-react'
import { useThemeStore } from '../../stores/theme.store'
import { useFormDraftsStore } from '../../stores/formDrafts.store'
import type { PartnerProfile, ExportHistoryRecord } from '../../../../shared/types'

export interface CommandItem {
  id: string
  title: string
  description?: string
  category: 'Tài liệu' | 'Hệ thống' | 'Giao diện' | 'Đối tác' | 'Đã xuất'
  icon: React.ReactNode
  badge?: string
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
  const { theme, toggleTheme } = useThemeStore()
  const setQuotationDraft = useFormDraftsStore((s) => s.setQuotationDraft)
  const setContractDraft = useFormDraftsStore((s) => s.setContractDraft)

  const [query, setQuery] = useState('')
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [historyList, setHistoryList] = useState<ExportHistoryRecord[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load partners and recent history when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 40)

      if (window.api?.getPartners) {
        window.api.getPartners().then((list) => setPartners(list || []))
      }
      if (window.api?.getHistory) {
        window.api.getHistory().then((hist) => setHistoryList(hist || []))
      }
    }
  }, [isOpen])

  // Core Static Commands
  const staticCommands: CommandItem[] = [
    {
      id: 'doc-quotation',
      title: 'Tạo Báo Giá Mới',
      description: 'Soạn thảo bảng báo giá vật tư, tính % tăng giá, xuất Word & PDF',
      category: 'Tài liệu',
      icon: <Receipt size={17} color="#10b981" />,
      badge: 'Báo Giá',
      action: () => {
        navigate('/quotation')
        onClose()
      }
    },
    {
      id: 'doc-contract',
      title: 'Tạo Hợp Đồng Nguyên Tắc',
      description: 'Hợp đồng mua bán vật tư chuẩn mực giữa Bên A (Vietkey) và Bên B',
      category: 'Tài liệu',
      icon: <FileText size={17} color="#3b82f6" />,
      badge: 'Hợp Đồng',
      action: () => {
        navigate('/contract')
        onClose()
      }
    },
    {
      id: 'doc-advance',
      title: 'Tạo Giấy Đề Nghị Tạm Ứng',
      description: 'Tạm ứng theo đợt, tính bảng vật tư, tự động dịch số tiền thành chữ',
      category: 'Tài liệu',
      icon: <CreditCard size={17} color="#f59e0b" />,
      badge: 'Tạm Ứng',
      action: () => {
        navigate('/advance-request')
        onClose()
      }
    },
    {
      id: 'nav-pdf-tools',
      title: 'Bộ Công Cụ PDF (PDF Tools)',
      description: 'Ghép nối, tách trang, xoay, chèn chữ ký, đóng dấu đỏ, watermark',
      category: 'Hệ thống',
      icon: <FileEdit size={17} color="#ef4444" />,
      badge: 'PDF',
      action: () => {
        navigate('/pdf-tools')
        onClose()
      }
    },
    {
      id: 'nav-history',
      title: 'Lịch Sử Xuất Tài Liệu',
      description: 'Xem và mở lại toàn bộ các file Hợp đồng, Báo giá, Tạm ứng đã tạo',
      category: 'Tài liệu',
      icon: <Clock size={17} color="var(--primary)" />,
      badge: 'Lịch Sử',
      action: () => {
        navigate('/history')
        onClose()
      }
    },
    {
      id: 'nav-dashboard',
      title: 'Về Dashboard Tổng Quan',
      description: 'Xem các loại tài liệu, thống kê nhanh và các tệp xuất gần nhất',
      category: 'Hệ thống',
      icon: <LayoutDashboard size={17} color="var(--primary)" />,
      action: () => {
        navigate('/')
        onClose()
      }
    },
    {
      id: 'nav-templates',
      title: 'Quản Lý Template Word',
      description: 'Quản lý phiên bản các mẫu Word, cập nhật và xem danh sách biến',
      category: 'Hệ thống',
      icon: <FolderOpen size={17} color="var(--accent)" />,
      badge: 'Mẫu',
      action: () => {
        navigate('/templates')
        onClose()
      }
    },
    {
      id: 'nav-settings',
      title: 'Cài Đặt & Cấu Hình',
      description: 'Thiết lập thư mục xuất file mặc định, API Key AI và sao lưu',
      category: 'Hệ thống',
      icon: <Settings size={17} color="var(--muted-foreground)" />,
      action: () => {
        navigate('/settings')
        onClose()
      }
    },
    {
      id: 'theme-toggle',
      title: theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)',
      description: 'Đổi phong cách màu sắc hiển thị toàn ứng dụng',
      category: 'Giao diện',
      icon: theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#3b82f6" />,
      badge: theme === 'dark' ? 'Sáng' : 'Tối',
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
    description: `MST: ${p.mst || 'Chưa lưu'} • Đại diện: ${p.dai_dien || 'Chưa lưu'}`,
    category: 'Đối tác',
    icon: <Users size={17} color="#06b6d4" />,
    badge: 'Khách Hàng',
    action: () => {
      setQuotationDraft((prev) => ({
        ...prev,
        ten_khach_hang: p.ten_cong_ty
      }))
      navigate('/quotation')
      onClose()
    }
  }))

  // Recent History Exported Files (Max 8)
  const historyCommands: CommandItem[] = historyList.slice(0, 8).map((h) => ({
    id: `history-${h.id}`,
    title: `Mở file: ${h.fileName}`,
    description: `${h.customerName || 'Tài liệu'} • ${h.docType === 'contract' ? 'Hợp đồng' : h.docType === 'quotation' ? 'Báo giá' : 'Tạm ứng'}`,
    category: 'Đã xuất',
    icon: <ExternalLink size={17} color="#8b5cf6" />,
    badge: 'Mở File',
    action: () => {
      if (h.filePath && window.api?.openPath) {
        window.api.openPath(h.filePath)
      }
      onClose()
    }
  }))

  const allItems = [...staticCommands, ...partnerCommands, ...historyCommands]

  const filteredItems = allItems.filter((it) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      it.title.toLowerCase().includes(q) ||
      (it.description && it.description.toLowerCase().includes(q)) ||
      it.category.toLowerCase().includes(q) ||
      (it.badge && it.badge.toLowerCase().includes(q))
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
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '74vh'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--card)'
          }}
        >
          <Search size={20} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tìm tài liệu, đối tác, file đã xuất, lệnh nhanh... (Ctrl+K)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--foreground)',
              fontFamily: "'Inter', sans-serif"
            }}
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          ) : (
            <span
              style={{
                fontSize: '11px',
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                padding: '3px 7px',
                borderRadius: '5px',
                fontWeight: 600,
                border: '1px solid var(--border)'
              }}
            >
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div style={{ overflowY: 'auto', padding: '10px' }}>
          {filteredItems.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '13.5px' }}>
              <Search size={32} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontWeight: 500, margin: 0 }}>Không tìm thấy kết quả nào phù hợp với &quot;{query}&quot;</p>
              <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                Thử tìm theo: báo giá, hợp đồng, tạm ứng, tên công ty, hoặc PDF
              </p>
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
                    transition: 'all 0.12s ease',
                    marginBottom: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '9px',
                        background: 'var(--background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)',
                        flexShrink: 0
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: 'var(--foreground)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {item.title}
                      </div>
                      {item.description && (
                        <div
                          style={{
                            fontSize: '11.5px',
                            color: 'var(--muted-foreground)',
                            marginTop: '2px',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden'
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background: 'var(--background)',
                          color: 'var(--foreground)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'var(--card)',
                        color: 'var(--muted-foreground)',
                        border: '1px solid var(--border)',
                        textTransform: 'uppercase'
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
            padding: '10px 18px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: 'var(--muted-foreground)',
            background: 'var(--card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>
              <kbd style={{ background: 'var(--muted)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 600 }}>↑</kbd> <kbd style={{ background: 'var(--muted)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 600 }}>↓</kbd> Di chuyển
            </span>
            <span>
              <kbd style={{ background: 'var(--muted)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 600 }}>↵</kbd> Thực hiện
            </span>
            <span>
              <kbd style={{ background: 'var(--muted)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 600 }}>Esc</kbd> Đóng
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--primary)' }}>
            <Sparkles size={12} />
            <span>Spotlight DocGen</span>
          </div>
        </div>
      </div>
    </div>
  )
}
