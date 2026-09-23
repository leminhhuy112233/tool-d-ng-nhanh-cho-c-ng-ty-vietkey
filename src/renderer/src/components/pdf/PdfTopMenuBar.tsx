/**
 * PdfTopMenuBar — Thanh Menu chuẩn Desktop phong cách Figma / VS Code
 * Chiều cao 36px, gồm Logo thương hiệu, hệ thống Menu Dropdown (File, Edit, View, Document, Tools, Help)
 * cùng thông tin tài liệu và các nút điều khiển cửa sổ Electron.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  FileText,
  FolderOpen,
  Save,
  Printer,
  X,
  Minus,
  Square,
  Sparkles,
  Scissors,
  FileSignature,
  Highlighter,
  Lock,
  Keyboard,
  HelpCircle,
  FileDown,
  RotateCw,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Command,
  PlusCircle,
  FileArchive
} from 'lucide-react'
import { usePdfStore } from '../../stores/pdfTools.store'

interface MenuItem {
  label: string
  shortcut?: string
  icon?: any
  action: () => void
  divider?: boolean
  disabled?: boolean
}

interface MenuDropdown {
  id: string
  label: string
  items: MenuItem[]
}

interface PdfTopMenuBarProps {
  onOpenFile: () => void
  onSaveFile: () => void
  onSaveAsFile: () => void
  onPrint: () => void
  onOpenCommandPalette: () => void
  onOpenUserGuide: () => void
  onDeletePages: () => void
  onRotatePages: (degrees: number) => void
  onMerge: () => void
  onSplit: () => void
  onExtractPages: () => void
  onDuplicatePages: () => void
  onOpenAddPageModal: () => void
  onOpenCompressModal: () => void
  onOpenSecurityModal: (tab?: 'password' | 'metadata') => void
  onExportImages: () => void
  onSelectTool: (tool: any) => void
}

export function PdfTopMenuBar({
  onOpenFile,
  onSaveFile,
  onSaveAsFile,
  onPrint,
  onOpenCommandPalette,
  onOpenUserGuide,
  onDeletePages,
  onRotatePages,
  onMerge,
  onSplit,
  onExtractPages,
  onDuplicatePages,
  onOpenAddPageModal,
  onOpenCompressModal,
  onOpenSecurityModal,
  onExportImages,
  onSelectTool
}: PdfTopMenuBarProps) {
  const {
    fileName,
    fileSize,
    pageCount,
    hasChanges,
    closePdf,
    sidebarOpen,
    toggleSidebar,
    zoomIn,
    zoomOut,
    fitWidth,
    fitPage,
    undo,
    redo,
    canUndo,
    canRedo,
    pdfBase64
  } = usePdfStore()

  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuBarRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const hasDoc = !!pdfBase64

  const MENUS: MenuDropdown[] = [
    {
      id: 'file',
      label: 'Tệp tin',
      items: [
        { label: 'Mở file PDF...', shortcut: 'Ctrl+O', icon: FolderOpen, action: onOpenFile },
        { label: 'Thêm trang trắng A4...', icon: PlusCircle, action: onOpenAddPageModal, disabled: !hasDoc },
        { label: 'Lưu', shortcut: 'Ctrl+S', icon: Save, action: onSaveFile, disabled: !hasDoc },
        { label: 'Lưu bản sao (Save As)...', shortcut: 'Ctrl+Shift+S', icon: FileDown, action: onSaveAsFile, disabled: !hasDoc },
        { divider: true, label: '', action: () => {} },
        { label: 'Xuất toàn bộ ảnh PNG...', icon: FileDown, action: onExportImages, disabled: !hasDoc },
        { label: 'In tài liệu...', shortcut: 'Ctrl+P', icon: Printer, action: onPrint, disabled: !hasDoc },
        { divider: true, label: '', action: () => {} },
        { label: 'Đóng tài liệu', shortcut: 'Ctrl+W', icon: X, action: closePdf, disabled: !hasDoc }
      ]
    },
    {
      id: 'edit',
      label: 'Chỉnh sửa',
      items: [
        { label: 'Hoàn tác (Undo)', shortcut: 'Ctrl+Z', icon: Undo2, action: undo, disabled: !canUndo },
        { label: 'Làm lại (Redo)', shortcut: 'Ctrl+Y', icon: Redo2, action: redo, disabled: !canRedo },
        { divider: true, label: '', action: () => {} },
        { label: 'Xóa đối tượng / trang', shortcut: 'Delete', icon: Trash2, action: onDeletePages, disabled: !hasDoc },
        { label: 'Nhân bản trang', shortcut: 'Ctrl+D', icon: Copy, action: onDuplicatePages, disabled: !hasDoc }
      ]
    },
    {
      id: 'view',
      label: 'Hiển thị',
      items: [
        { label: 'Phóng to', shortcut: 'Ctrl++', icon: ZoomIn, action: zoomIn, disabled: !hasDoc },
        { label: 'Thu nhỏ', shortcut: 'Ctrl+-', icon: ZoomOut, action: zoomOut, disabled: !hasDoc },
        { label: 'Vừa chiều ngang', icon: Maximize2, action: fitWidth, disabled: !hasDoc },
        { label: 'Vừa trang giấy', action: fitPage, disabled: !hasDoc },
        { divider: true, label: '', action: () => {} },
        { label: sidebarOpen ? 'Ẩn thanh Sidebar trang' : 'Hiện thanh Sidebar trang', shortcut: 'Ctrl+\\', action: toggleSidebar, disabled: !hasDoc },
        {
          label: 'Toàn màn hình',
          shortcut: 'F11',
          action: () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {})
            } else {
              document.exitFullscreen().catch(() => {})
            }
          }
        }
      ]
    },
    {
      id: 'document',
      label: 'Tài liệu',
      items: [
        { label: 'Ghép nhiều file PDF (Merge)...', icon: Scissors, action: onMerge },
        { label: 'Tách file PDF (Split)...', icon: Scissors, action: onSplit, disabled: !hasDoc },
        { label: 'Trích xuất các trang (Extract)...', icon: FileDown, action: onExtractPages, disabled: !hasDoc },
        { divider: true, label: '', action: () => {} },
        { label: 'Xoay phải 90°', shortcut: 'R', icon: RotateCw, action: () => onRotatePages(90), disabled: !hasDoc },
        { label: 'Xoay trái 90°', action: () => onRotatePages(-90), disabled: !hasDoc },
        { divider: true, label: '', action: () => {} },
        { label: 'Nén giảm dung lượng PDF...', icon: FileArchive, action: onOpenCompressModal, disabled: !hasDoc },
        { label: 'Khóa mật khẩu bảo vệ...', icon: Lock, action: () => onOpenSecurityModal('password'), disabled: !hasDoc },
        { label: 'Quản lý Metadata siêu dữ liệu...', icon: FileText, action: () => onOpenSecurityModal('metadata'), disabled: !hasDoc }
      ]
    },
    {
      id: 'tools',
      label: 'Công cụ',
      items: [
        { label: 'Công cụ Chọn (Select)', shortcut: 'V', action: () => onSelectTool('select') },
        { label: 'Chèn chữ (Text)', shortcut: 'T', action: () => onSelectTool('text') },
        { label: 'Chèn hình ảnh (Image)', shortcut: 'I', action: () => onSelectTool('image') },
        { label: 'Dạ quang (Highlight)', shortcut: 'H', icon: Highlighter, action: () => onSelectTool('highlight') },
        { label: 'Bút vẽ tay (Draw)', shortcut: 'D', action: () => onSelectTool('draw') },
        { label: 'Hình khối (Shapes)', shortcut: 'S', action: () => onSelectTool('shape') },
        { divider: true, label: '', action: () => {} },
        { label: 'Ký tên điện tử (Sign)', icon: FileSignature, action: () => onSelectTool('sign') },
        { label: 'Tìm kiếm lệnh nhanh...', shortcut: 'Ctrl+K', icon: Command, action: onOpenCommandPalette }
      ]
    },
    {
      id: 'help',
      label: 'Trợ giúp',
      items: [
        { label: 'Cẩm nang Hướng dẫn sử dụng', icon: HelpCircle, action: onOpenUserGuide },
        { label: 'Bảng phím tắt văn phòng', shortcut: 'Ctrl+/', icon: Keyboard, action: onOpenUserGuide },
        { divider: true, label: '', action: () => {} },
        { label: 'Bảng lệnh nhanh (Command Palette)', shortcut: 'Ctrl+K', icon: Command, action: onOpenCommandPalette },
        {
          label: 'Phiên bản VietKey Studio 2026',
          action: () => alert('VietKey PDF Studio Enterprise Edition — 2026. Bản quyền thuộc VietKey Solutions.')
        }
      ]
    }
  ]

  // Window control helpers
  const handleMinimize = () => window.api?.minimizeWindow?.()
  const handleMaximize = () => window.api?.maximizeWindow?.()
  const handleClose = () => window.api?.closeWindow?.()

  return (
    <div className="pdf-top-menubar" ref={menuBarRef}>
      {/* 1. Logo & Menus */}
      <div className="pdf-top-menubar-left">
        <div className="pdf-menubar-brand">
          <div className="pdf-menubar-logo-box">
            <FileText size={15} />
          </div>
          <span className="pdf-menubar-app-name">VietKey PDF</span>
        </div>

        {/* Các mục Menu Dropdown */}
        <div className="pdf-menubar-nav">
          {MENUS.map((menu) => {
            const isOpen = activeMenu === menu.id
            return (
              <div key={menu.id} className="pdf-menu-item-wrap">
                <button
                  className={`pdf-menu-item-btn ${isOpen ? 'active' : ''}`}
                  onClick={() => setActiveMenu(isOpen ? null : menu.id)}
                  onMouseEnter={() => {
                    if (activeMenu) setActiveMenu(menu.id)
                  }}
                >
                  {menu.label}
                </button>

                {isOpen && (
                  <div className="pdf-dropdown-panel" onClick={(e) => e.stopPropagation()}>
                    {menu.items.map((item, idx) => {
                      if (item.divider) {
                        return <div key={idx} className="pdf-dropdown-divider" />
                      }
                      const Icon = item.icon
                      return (
                        <button
                          key={idx}
                          className={`pdf-dropdown-item ${item.disabled ? 'disabled' : ''}`}
                          disabled={item.disabled}
                          onClick={() => {
                            if (!item.disabled) {
                              item.action()
                              setActiveMenu(null)
                            }
                          }}
                        >
                          <div className="pdf-dropdown-item-left">
                            {Icon ? <Icon size={14} className="pdf-dropdown-icon" /> : <div className="pdf-dropdown-icon-placeholder" />}
                            <span>{item.label}</span>
                          </div>
                          {item.shortcut && <span className="pdf-dropdown-shortcut">{item.shortcut}</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Tiêu đề tài liệu ở giữa */}
      <div className="pdf-top-menubar-center">
        {fileName ? (
          <div className="pdf-menubar-doc-title">
            <span className="pdf-doc-title-text" title={fileName}>
              {fileName}
            </span>
            {hasChanges ? (
              <span className="pdf-doc-badge unsaved" title="Có thay đổi chưa lưu">
                ● Chưa lưu
              </span>
            ) : (
              <span className="pdf-doc-badge saved" title="Tất cả thay đổi đã được lưu">
                ✓ Đã lưu
              </span>
            )}
            {pageCount > 0 && <span className="pdf-doc-page-badge">{pageCount} trang</span>}
          </div>
        ) : (
          <span className="pdf-menubar-welcome">VietKey PDF Studio — Không gian biên tập chuyên nghiệp</span>
        )}
      </div>

      {/* 3. Phím tắt lệnh nhanh & Window Controls */}
      <div className="pdf-top-menubar-right">
        <button
          className="pdf-menubar-cmd-btn"
          onClick={onOpenCommandPalette}
          title="Bảng lệnh nhanh (Ctrl+K)"
        >
          <Command size={13} />
          <span>Ctrl+K</span>
        </button>

        <div className="pdf-window-controls">
          <button className="pdf-win-btn minimize" onClick={handleMinimize} title="Thu nhỏ">
            <Minus size={12} />
          </button>
          <button className="pdf-win-btn maximize" onClick={handleMaximize} title="Phóng to">
            <Square size={11} />
          </button>
          <button className="pdf-win-btn close" onClick={handleClose} title="Đóng cửa sổ">
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
