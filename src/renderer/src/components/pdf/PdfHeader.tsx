/**
 * PdfHeader — Thanh điều khiển tệp tin phía trên cùng chuẩn Enterprise
 * Hiển thị thông tin tài liệu (tên file, dung lượng, trạng thái lưu, số trang)
 * và các tác vụ tài liệu cốt lõi (Lưu, Mở, In, Đóng)
 */

import {
  FileText,
  Save,
  FolderOpen,
  Printer,
  X,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  Eye
} from 'lucide-react'
import { motion } from 'framer-motion'
import { usePdfStore } from '../../stores/pdfTools.store'

interface PdfHeaderProps {
  onOpenFile: () => void
  onSaveFile: () => void
  onPrint?: () => void
}

export function PdfHeader({ onOpenFile, onSaveFile, onPrint }: PdfHeaderProps) {
  const {
    fileName,
    fileSize,
    pageCount,
    hasChanges,
    closePdf,
    sidebarOpen,
    toggleSidebar,
    viewMode,
    setViewMode,
    pdfBase64
  } = usePdfStore()

  const hasPdf = !!pdfBase64

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <header className="pdf-header">
      {/* Trái: Brand & Sidebar toggle */}
      <div className="pdf-header-left">
        {hasPdf && (
          <button
            className="pdf-btn pdf-btn-ghost pdf-btn-icon"
            onClick={toggleSidebar}
            title={sidebarOpen ? 'Ẩn thanh bên' : 'Hiện thanh bên'}
          >
            {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeft size={17} />}
          </button>
        )}

        <div className="pdf-brand-badge">
          <div className="pdf-brand-icon-wrap">
            <Sparkles size={14} className="pdf-brand-sparkle" />
            <FileText size={16} />
          </div>
          <span className="pdf-brand-title">VietKey PDF Studio</span>
        </div>

        {/* Tên file & Metadata */}
        {hasPdf && (
          <div className="pdf-file-info-group">
            <span className="pdf-file-divider">/</span>
            <span className="pdf-file-name" title={fileName || 'Tài liệu không tên'}>
              {fileName || 'Tài liệu không tên'}
            </span>

            {/* Status chip */}
            <span
              className={`pdf-status-chip ${hasChanges ? 'has-changes' : 'saved'}`}
              title={hasChanges ? 'Có thay đổi chưa lưu' : 'Đã lưu trạng thái mới nhất'}
            >
              <span className="pdf-status-dot" />
              {hasChanges ? 'Chưa lưu' : 'Đã lưu'}
            </span>

            {/* Page count pill */}
            <span className="pdf-meta-pill">{pageCount} trang</span>

            {/* File size pill */}
            {fileSize && <span className="pdf-meta-pill">{fileSize}</span>}
          </div>
        )}
      </div>

      {/* Phải: Tác vụ tài liệu & Chế độ xem */}
      <div className="pdf-header-right">
        {hasPdf ? (
          <>
            {/* Chế độ xem: Studio (Page) vs Organize (Grid) */}
            <div className="pdf-view-switch-group">
              <button
                className={`pdf-switch-btn ${viewMode === 'page' ? 'active' : ''}`}
                onClick={() => setViewMode('page')}
                title="Chế độ đọc & chỉnh sửa tài liệu"
              >
                <Eye size={14} />
                <span>Xem tài liệu</span>
              </button>
              <button
                className={`pdf-switch-btn ${viewMode === 'thumbnail' ? 'active' : ''}`}
                onClick={() => setViewMode('thumbnail')}
                title="Chế độ dàn trang & sắp xếp trực quan"
              >
                <LayoutGrid size={14} />
                <span>Dàn trang</span>
              </button>
            </div>

            <div className="pdf-header-separator" />

            {/* Nút In */}
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-ghost"
              onClick={handlePrint}
              title="In tài liệu (Ctrl + P)"
            >
              <Printer size={15} />
              <span className="pdf-btn-label-desktop">In</span>
            </button>

            {/* Nút Mở file khác */}
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-ghost"
              onClick={onOpenFile}
              title="Mở file PDF khác (Ctrl + O)"
            >
              <FolderOpen size={15} />
              <span className="pdf-btn-label-desktop">Mở file</span>
            </button>

            {/* Nút Lưu chính (nổi bật) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              className={`pdf-btn pdf-btn-sm ${hasChanges ? 'pdf-btn-primary pdf-btn-pulse' : 'pdf-btn-subtle'}`}
              onClick={onSaveFile}
              title="Lưu tài liệu PDF (Ctrl + S)"
            >
              <Save size={15} />
              <span>Lưu file</span>
            </motion.button>

            <div className="pdf-header-separator" />

            {/* Nút Đóng tài liệu */}
            <button
              className="pdf-btn pdf-btn-sm pdf-btn-ghost pdf-btn-icon pdf-btn-close"
              onClick={closePdf}
              title="Đóng tài liệu hiện tại"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <button className="pdf-btn pdf-btn-sm pdf-btn-primary" onClick={onOpenFile}>
            <FolderOpen size={15} />
            <span>Chọn file PDF</span>
          </button>
        )}
      </div>
    </header>
  )
}
