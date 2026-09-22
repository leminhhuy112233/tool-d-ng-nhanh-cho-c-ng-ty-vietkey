/**
 * PdfRibbon — Hệ thống thanh Ribbon đa chức năng chuẩn Enterprise
 * 5 nhóm tab: Trang chủ (Home), Quản lý trang (Organize), Điền & Ký (Fill & Sign),
 * Ghi chú & Đánh dấu (Markup), Bảo mật & Chuyển đổi (Protect & Convert)
 */

import {
  RotateCw,
  RotateCcw,
  Trash2,
  Scissors,
  Merge,
  Undo2,
  FolderOpen,
  Save,
  Printer,
  MousePointer,
  Hand,
  PenTool,
  Type,
  FileSignature,
  Stamp,
  Highlighter,
  Underline,
  Strikethrough,
  Square,
  Circle,
  ArrowRight,
  Minus,
  StickyNote,
  Lock,
  Unlock,
  Droplet,
  FileImage,
  Download,
  CheckSquare,
  Calendar,
  Check,
  X as XIcon,
  Copy,
  Sparkles,
  ArrowDownUp
} from 'lucide-react'
import { motion } from 'framer-motion'
import { usePdfStore, PdfRibbonTab } from '../../stores/pdfTools.store'

interface PdfRibbonProps {
  onOpenFile: () => void
  onSaveFile: () => void
  onDeletePages: () => void
  onRotatePages: (degrees: number) => void
  onMerge: () => void
  onSplit: () => void
  onExtractPages: () => void
  onDuplicatePages?: () => void
  onOpenSignatureModal?: (tab?: 'draw' | 'upload' | 'type' | 'stamp') => void
  onOpenWatermarkModal?: () => void
  onExportImages?: () => void
  onImagesToPdf?: () => void
  onInsertQuickSymbol?: (type: 'check' | 'cross' | 'date' | 'text') => void
  onPlaceholderAction?: (featureName: string) => void
}

const TABS: { id: PdfRibbonTab; label: string; icon: any }[] = [
  { id: 'home', label: 'Trang chủ', icon: Sparkles },
  { id: 'organize', label: 'Quản lý trang', icon: Scissors },
  { id: 'sign', label: 'Điền & Ký', icon: FileSignature },
  { id: 'markup', label: 'Ghi chú & Đánh dấu', icon: Highlighter },
  { id: 'protect', label: 'Bảo mật & Chuyển đổi', icon: Lock }
]

export function PdfRibbon({
  onOpenFile,
  onSaveFile,
  onDeletePages,
  onRotatePages,
  onMerge,
  onSplit,
  onExtractPages,
  onDuplicatePages,
  onOpenSignatureModal,
  onOpenWatermarkModal,
  onExportImages,
  onImagesToPdf,
  onInsertQuickSymbol,
  onPlaceholderAction
}: PdfRibbonProps) {
  const {
    activeRibbonTab,
    setActiveRibbonTab,
    pageCount,
    currentPage,
    selectedPages,
    canUndo,
    undo,
    panMode,
    setPanMode,
    activeTool,
    setActiveTool,
    selectAllPages,
    clearSelection,
    pdfBase64
  } = usePdfStore()

  const hasPdf = !!pdfBase64
  const hasSelection = selectedPages.length > 0

  const handleAction = (name: string, callback?: () => void) => {
    if (callback) {
      callback()
    } else if (onPlaceholderAction) {
      onPlaceholderAction(name)
    }
  }

  return (
    <div className="pdf-ribbon-container">
      {/* 1. Hàng Tab Ribbon chuyển đổi mượt mà */}
      <div className="pdf-ribbon-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeRibbonTab === tab.id
          return (
            <button
              key={tab.id}
              className={`pdf-ribbon-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveRibbonTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  className="pdf-ribbon-tab-indicator"
                  layoutId="ribbonTabIndicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* 2. Dải công cụ ngữ cảnh (Contextual Action Ribbon) */}
      <div className="pdf-ribbon-content">
        {/* ===== TAB 1: TRANG CHỦ (HOME) ===== */}
        {activeRibbonTab === 'home' && (
          <motion.div
            className="pdf-ribbon-row"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Nhóm 1: Tệp tin */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Tệp tin</span>
              <div className="pdf-toolgroup-items">
                <button className="pdf-ribbon-btn" onClick={onOpenFile} title="Mở file PDF (Ctrl+O)">
                  <FolderOpen size={18} />
                  <span>Mở file</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={onSaveFile}
                  disabled={!hasPdf}
                  title="Lưu PDF (Ctrl+S)"
                >
                  <Save size={18} />
                  <span>Lưu file</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 2: Thao tác con trỏ */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Thao tác</span>
              <div className="pdf-toolgroup-items">
                <button
                  className={`pdf-ribbon-btn ${!panMode && activeTool === 'select' ? 'active' : ''}`}
                  onClick={() => setPanMode(false)}
                  disabled={!hasPdf}
                  title="Con trỏ chọn văn bản và đối tượng (V)"
                >
                  <MousePointer size={18} />
                  <span>Chọn</span>
                </button>
                <button
                  className={`pdf-ribbon-btn ${panMode ? 'active' : ''}`}
                  onClick={() => setPanMode(true)}
                  disabled={!hasPdf}
                  title="Bàn tay kéo cuộn trang nhanh (H / Phím cách)"
                >
                  <Hand size={18} />
                  <span>Bàn tay</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 3: Xoay & Hướng trang */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Xoay trang</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => onRotatePages(90)}
                  disabled={!hasPdf}
                  title="Xoay 90° xuôi chiều kim đồng hồ (R)"
                >
                  <RotateCw size={18} />
                  <span>Xoay 90°</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => onRotatePages(-90)}
                  disabled={!hasPdf}
                  title="Xoay 90° ngược chiều kim đồng hồ"
                >
                  <RotateCcw size={18} />
                  <span>Xoay trái</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 4: Tác vụ trang nhanh */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Trang</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn pdf-ribbon-btn-danger"
                  onClick={onDeletePages}
                  disabled={!hasPdf || (!hasSelection && pageCount <= 1)}
                  title="Xóa trang hiện tại hoặc trang đã chọn (Del)"
                >
                  <Trash2 size={18} />
                  <span>Xóa trang</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={onSplit}
                  disabled={!hasPdf || pageCount <= 1}
                  title="Tách PDF thành nhiều file"
                >
                  <Scissors size={18} />
                  <span>Tách PDF</span>
                </button>
                <button className="pdf-ribbon-btn" onClick={onMerge} title="Ghép nhiều file PDF thành một">
                  <Merge size={18} />
                  <span>Ghép PDF</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 5: Hoàn tác */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Lịch sử</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Hoàn tác tác vụ vừa thực hiện (Ctrl+Z)"
                >
                  <Undo2 size={18} />
                  <span>Hoàn tác</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== TAB 2: QUẢN LÝ TRANG (ORGANIZE) ===== */}
        {activeRibbonTab === 'organize' && (
          <motion.div
            className="pdf-ribbon-row"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Nhóm 1: Xoay hàng loạt */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Xoay trang</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => onRotatePages(90)}
                  disabled={!hasPdf}
                  title="Xoay 90° sang phải"
                >
                  <RotateCw size={18} />
                  <span>Phải 90°</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => onRotatePages(-90)}
                  disabled={!hasPdf}
                  title="Xoay 90° sang trái"
                >
                  <RotateCcw size={18} />
                  <span>Trái 90°</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => onRotatePages(180)}
                  disabled={!hasPdf}
                  title="Lật 180°"
                >
                  <ArrowDownUp size={18} />
                  <span>Lật 180°</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 2: Thao tác nội dung */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Biên tập trang</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn pdf-ribbon-btn-danger"
                  onClick={onDeletePages}
                  disabled={!hasPdf || (!hasSelection && pageCount <= 1)}
                  title="Xóa trang đã chọn hoặc chọn dải trang"
                >
                  <Trash2 size={18} />
                  <span>Xóa trang</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={onExtractPages}
                  disabled={!hasPdf || !hasSelection}
                  title={hasSelection ? `Trích xuất ${selectedPages.length} trang đã chọn ra file mới` : 'Chọn trang cần trích xuất'}
                >
                  <Download size={18} />
                  <span>Trích xuất</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={onDuplicatePages}
                  disabled={!hasPdf}
                  title="Tạo bản sao của các trang đã chọn"
                >
                  <Copy size={18} />
                  <span>Nhân bản</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 3: Chia tách & Hợp nhất */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Tách & Ghép</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={onSplit}
                  disabled={!hasPdf || pageCount <= 1}
                  title="Chia nhỏ tài liệu PDF theo trang"
                >
                  <Scissors size={18} />
                  <span>Tách PDF</span>
                </button>
                <button className="pdf-ribbon-btn" onClick={onMerge} title="Hợp nhất nhiều file PDF lại">
                  <Merge size={18} />
                  <span>Ghép file</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 4: Chọn trang */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Chọn trang</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={selectAllPages}
                  disabled={!hasPdf}
                  title="Chọn tất cả trang"
                >
                  <CheckSquare size={18} />
                  <span>Chọn tất cả</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={clearSelection}
                  disabled={!hasPdf || !hasSelection}
                  title="Hủy chọn tất cả"
                >
                  <XIcon size={18} />
                  <span>Bỏ chọn ({selectedPages.length})</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== TAB 3: ĐIỀN & KÝ (FILL & SIGN) ===== */}
        {activeRibbonTab === 'sign' && (
          <motion.div
            className="pdf-ribbon-row"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Nhóm 1: Chữ ký */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Chữ ký cá nhân</span>
              <div className="pdf-toolgroup-items">
                <button
                  className={`pdf-ribbon-btn ${activeTool === 'signature' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool('signature')
                    if (onOpenSignatureModal) onOpenSignatureModal('draw')
                    else handleAction('Ký tên điện tử')
                  }}
                  disabled={!hasPdf}
                  title="Vẽ chữ ký tay hoặc tải ảnh chữ ký số"
                >
                  <FileSignature size={18} />
                  <span>Ký tên</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onOpenSignatureModal) onOpenSignatureModal('type')
                    else handleAction('Ký tắt')
                  }}
                  disabled={!hasPdf}
                  title="Chèn chữ ký tắt / Initials vào góc trang"
                >
                  <PenTool size={18} />
                  <span>Ký tắt</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 2: Chèn văn bản điền đơn */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Văn bản điền đơn</span>
              <div className="pdf-toolgroup-items">
                <button
                  className={`pdf-ribbon-btn ${activeTool === 'text' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool('text')
                    if (onInsertQuickSymbol) onInsertQuickSymbol('text')
                    else handleAction('Chèn chữ')
                  }}
                  disabled={!hasPdf}
                  title="Chèn văn bản tự do vào trang PDF"
                >
                  <Type size={18} />
                  <span>Chèn chữ</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onInsertQuickSymbol) onInsertQuickSymbol('date')
                    else handleAction('Chèn ngày')
                  }}
                  disabled={!hasPdf}
                  title="Chèn ngày tháng năm hiện tại"
                >
                  <Calendar size={18} />
                  <span>Ngày tháng</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 3: Dấu xác nhận */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Ký hiệu kiểm tra</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onInsertQuickSymbol) onInsertQuickSymbol('check')
                    else handleAction('Dấu tích xanh')
                  }}
                  disabled={!hasPdf}
                  title="Dấu tích kiểm tra"
                >
                  <Check size={18} className="text-emerald-400" />
                  <span>Dấu tick</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onInsertQuickSymbol) onInsertQuickSymbol('cross')
                    else handleAction('Dấu gạch chéo')
                  }}
                  disabled={!hasPdf}
                  title="Dấu gạch chéo không đồng ý"
                >
                  <XIcon size={18} className="text-rose-400" />
                  <span>Dấu X</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 4: Con dấu doanh nghiệp */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Con dấu công ty</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onOpenSignatureModal) onOpenSignatureModal('stamp')
                    else handleAction('Đóng dấu')
                  }}
                  disabled={!hasPdf}
                  title="Đóng dấu ĐÃ DUYỆT, BẢO MẬT, KHẨN CẤP..."
                >
                  <Stamp size={18} />
                  <span>Con dấu mẫu</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== TAB 4: GHI CHÚ & ĐÁNH DẤU (MARKUP) ===== */}
        {activeRibbonTab === 'markup' && (
          <motion.div
            className="pdf-ribbon-row"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Nhóm 1: Đánh dấu text */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Đánh dấu văn bản</span>
              <div className="pdf-toolgroup-items">
                <button
                  className={`pdf-ribbon-btn ${activeTool === 'highlight' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool('highlight')
                    handleAction('Bút highlight')
                  }}
                  disabled={!hasPdf}
                  title="Làm nổi bật đoạn văn bản bằng màu dạ quang"
                >
                  <Highlighter size={18} />
                  <span>Highlight</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Gạch chân')}
                  disabled={!hasPdf}
                  title="Gạch chân dòng văn bản quan trọng"
                >
                  <Underline size={18} />
                  <span>Gạch chân</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Gạch bỏ')}
                  disabled={!hasPdf}
                  title="Gạch bỏ văn bản hủy bỏ"
                >
                  <Strikethrough size={18} />
                  <span>Gạch bỏ</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 2: Bút vẽ tự do */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Vẽ tự do</span>
              <div className="pdf-toolgroup-items">
                <button
                  className={`pdf-ribbon-btn ${activeTool === 'draw' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool('draw')
                    handleAction('Bút vẽ')
                  }}
                  disabled={!hasPdf}
                  title="Vẽ tự do bằng tay trên tài liệu"
                >
                  <PenTool size={18} />
                  <span>Bút vẽ</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Ghi chú dán')}
                  disabled={!hasPdf}
                  title="Đính kèm thẻ ghi chú dán (Sticky Note)"
                >
                  <StickyNote size={18} />
                  <span>Ghi chú</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 3: Hình khối */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Hình khối</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Hình chữ nhật')}
                  disabled={!hasPdf}
                  title="Vẽ hình chữ nhật hoặc khoanh vùng"
                >
                  <Square size={18} />
                  <span>Hình hộp</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Hình tròn')}
                  disabled={!hasPdf}
                  title="Vẽ hình tròn / elip"
                >
                  <Circle size={18} />
                  <span>Hình tròn</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Mũi tên')}
                  disabled={!hasPdf}
                  title="Vẽ mũi tên chỉ điểm"
                >
                  <ArrowRight size={18} />
                  <span>Mũi tên</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Đường kẻ')}
                  disabled={!hasPdf}
                  title="Vẽ đường thẳng phân cách"
                >
                  <Minus size={18} />
                  <span>Đường kẻ</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== TAB 5: BẢO MẬT & CHUYỂN ĐỔI (PROTECT & CONVERT) ===== */}
        {activeRibbonTab === 'protect' && (
          <motion.div
            className="pdf-ribbon-row"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Nhóm 1: Mật khẩu */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Bảo vệ tài liệu</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Đặt mật khẩu')}
                  disabled={!hasPdf}
                  title="Đặt mật khẩu mã hóa ngăn mở hoặc in PDF"
                >
                  <Lock size={18} />
                  <span>Đặt mật khẩu</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => handleAction('Gỡ mật khẩu')}
                  disabled={!hasPdf}
                  title="Gỡ bỏ mật khẩu bảo vệ của tài liệu"
                >
                  <Unlock size={18} />
                  <span>Gỡ mật khẩu</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 2: Bản quyền & Đóng dấu */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Bản quyền</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onOpenWatermarkModal) onOpenWatermarkModal()
                    else handleAction('Thêm watermark')
                  }}
                  disabled={!hasPdf}
                  title="Chèn dấu mờ bản quyền VietKey hoặc tùy chỉnh"
                >
                  <Droplet size={18} />
                  <span>Watermark</span>
                </button>
              </div>
            </div>

            <div className="pdf-ribbon-divider" />

            {/* Nhóm 3: Chuyển đổi định dạng */}
            <div className="pdf-toolgroup">
              <span className="pdf-toolgroup-title">Chuyển đổi</span>
              <div className="pdf-toolgroup-items">
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onExportImages) onExportImages()
                    else handleAction('PDF sang ảnh')
                  }}
                  disabled={!hasPdf}
                  title="Chuyển các trang PDF thành ảnh PNG nét cao"
                >
                  <FileImage size={18} />
                  <span>PDF sang Ảnh</span>
                </button>
                <button
                  className="pdf-ribbon-btn"
                  onClick={() => {
                    if (onImagesToPdf) onImagesToPdf()
                    else handleAction('Ảnh sang PDF')
                  }}
                  title="Tập hợp nhiều ảnh thành file PDF duy nhất"
                >
                  <FileImage size={18} />
                  <span>Ảnh sang PDF</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
