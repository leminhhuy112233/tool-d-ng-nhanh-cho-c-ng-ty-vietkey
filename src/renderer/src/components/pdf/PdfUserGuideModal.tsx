/**
 * PdfUserGuideModal — Hướng Dẫn Sử Dụng VietKey PDF Studio (Enterprise Edition)
 * Trình bày chi tiết, trực quan 6 chuyên đề chức năng kèm bảng phím tắt tiện lợi.
 */

import React, { useState } from 'react'
import {
  BookOpen,
  X,
  Sparkles,
  FileText,
  Scissors,
  FileSignature,
  Highlighter,
  Lock,
  Keyboard,
  Droplet,
  ArrowRight,
  Printer,
  ZoomIn,
  Merge,
  Copy,
  Trash2,
  RotateCw,
  Search,
  PenTool,
  CheckCircle2,
  FileDown,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PdfUserGuideModalProps {
  onClose: () => void
}

type GuideTab = 'viewer' | 'pages' | 'tools' | 'sign' | 'edit' | 'security' | 'shortcuts'

const GUIDE_TABS: { id: GuideTab; label: string; icon: any }[] = [
  { id: 'viewer', label: '1. Xem & Đọc File', icon: FileText },
  { id: 'pages', label: '2. Quản Lý Trang', icon: Scissors },
  { id: 'tools', label: '3. Ghép & Tách PDF', icon: Merge },
  { id: 'sign', label: '4. Điền Đơn & Ký Tên', icon: FileSignature },
  { id: 'edit', label: '5. Ghi Chú & Sửa Chữ', icon: Highlighter },
  { id: 'security', label: '6. Bảo Mật & Nén File', icon: Lock },
  { id: 'shortcuts', label: 'Bảng Phím Tắt', icon: Keyboard }
]

export function PdfUserGuideModal({ onClose }: PdfUserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('viewer')

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="pdf-modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <motion.div
        className="pdf-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '92vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(178, 213, 229, 0.12), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(178, 213, 229, 0.3)'
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                Cẩm Nang Hướng Dẫn Sử Dụng VietKey PDF Studio
              </h2>
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--muted-foreground)' }}>
                Hướng dẫn chi tiết từng bước cho toàn bộ 4 giai đoạn xử lý & biên tập tài liệu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="pdf-btn pdf-btn-ghost pdf-btn-icon"
            style={{ borderRadius: '8px' }}
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Left Tab Sidebar + Right Content View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Navigation */}
          <div
            style={{
              width: '220px',
              borderRight: '1px solid var(--border)',
              background: 'var(--muted)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              overflowY: 'auto'
            }}
          >
            {GUIDE_TABS.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    textAlign: 'left',
                    background: isActive ? 'var(--card)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--foreground)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={16} />
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {isActive && <ChevronRight size={14} />}
                </button>
              )
            })}
          </div>

          {/* Right Content */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: 'var(--foreground)'
            }}
          >
            <AnimatePresence mode="wait">
              {/* TAB 1: XEM & ĐỌC FILE */}
              {activeTab === 'viewer' && (
                <motion.div
                  key="viewer"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    1. Khởi Đầu & Xem Tài Liệu (Viewer Studio)
                  </h3>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>📂 3 Cách Mở File PDF:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li>Bấm <strong>Mở file</strong> trên thanh Header hoặc phím tắt <kbd>Ctrl + O</kbd>.</li>
                      <li><strong>Kéo & thả (Drag and drop)</strong> file PDF trực tiếp từ máy tính vào cửa sổ ứng dụng.</li>
                      <li>Bấm <strong>Nạp tài liệu mẫu VietKey</strong> ở màn hình chờ để thử nghiệm ngay lập tức.</li>
                    </ul>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🔍 Tìm Kiếm Văn Bản (<kbd>Ctrl + F</kbd>):</h4>
                    <p style={{ margin: 0, fontSize: '13px' }}>
                      Bấm biểu tượng Kính lúp hoặc nhấn <kbd>Ctrl + F</kbd>, nhập từ khóa tiếng Việt có dấu. Hệ thống sẽ tự động quét toàn văn bản, hiển thị số kết quả tìm thấy và cuộn đến từng trang chứa từ khóa.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>👁️ Chế Độ Xem & Thu Phóng:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li><strong>Thanh điều khiển nổi (Floating HUD)</strong> ở đáy màn hình: Dễ dàng bấm Phóng to (+), Thu nhỏ (-), gõ số trang để nhảy trang tức thì.</li>
                      <li><strong>Fit Width / Fit Page</strong>: Tự động căn vừa khít chiều ngang màn hình hoặc xem trọn vẹn cả trang.</li>
                      <li><strong>Chế độ Dàn trang (Grid View)</strong>: Bấm nút "Dàn trang" trên Header để xem toàn bộ tài liệu dạng lưới, phục vụ sắp xếp hàng loạt.</li>
                      <li><strong>Toàn màn hình</strong>: Bấm biểu tượng Toàn màn hình hoặc <kbd>F11</kbd> để tập trung đọc tài liệu.</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: QUẢN LÝ TRANG */}
              {activeTab === 'pages' && (
                <motion.div
                  key="pages"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    2. Quản Lý & Biên Tập Trang (Page Editor)
                  </h3>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🔄 Xoay Trang & Đổi Hướng:</h4>
                    <p style={{ margin: 0 }}>
                      Bấm nút <strong>Xoay 90°</strong> (phím tắt <kbd>R</kbd>) trên Ribbon hoặc click chuột phải lên trang. Hỗ trợ xoay trang hiện tại hoặc giữ <kbd>Ctrl</kbd>/<kbd>Shift</kbd> để xoay hàng loạt trang cùng lúc.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🗑️ Xóa Trang & Nhân Bản:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li>Bấm <strong>Xóa trang</strong> (<kbd>Delete</kbd>): Lựa chọn xóa trang đang xem, xóa các trang được bôi chọn, hoặc xóa theo dải trang (VD: trang 3 đến 8).</li>
                      <li>Bấm <strong>Nhân bản (Duplicate)</strong>: Tạo thêm một bản sao y hệt của trang chỉ định ngay sau nó.</li>
                    </ul>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>📑 Kéo Thả Đổi Thứ Tự Trang:</h4>
                    <p style={{ margin: 0 }}>
                      Tại thanh bên Thumbnail hoặc ở màn hình Dàn trang, bạn chỉ cần dùng chuột kéo giữ trang và thả vào vị trí mới mong muốn. Tài liệu sẽ được cập nhật thứ tự ngay lập tức.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>➕ Thêm Trang Trắng & Nhập Trang Mới:</h4>
                    <p style={{ margin: 0 }}>
                      Dễ dàng chèn thêm 1 trang trắng A4 sạch sẽ hoặc chọn nạp thêm các trang từ 1 file PDF khác để ghép nối tiếp vào tài liệu hiện tại.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: GHÉP & TÁCH PDF */}
              {activeTab === 'tools' && (
                <motion.div
                  key="tools"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    3. Hợp Nhất & Chia Tách Tài Liệu (Merge & Split)
                  </h3>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🔗 Ghép Nhiều File PDF (Merge):</h4>
                    <ol style={{ paddingLeft: '20px', margin: 0 }}>
                      <li>Bấm nút <strong>Ghép file (Merge)</strong> trên thanh Ribbon.</li>
                      <li>Chọn 2 hoặc nhiều tệp PDF từ máy tính của bạn.</li>
                      <li>Hệ thống sẽ tự động ghép nối toàn bộ trang thành 1 tệp PDF thống nhất, giữ nguyên độ nét và định dạng.</li>
                    </ol>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>✂️ Chia Nhỏ File PDF (Split) với 3 Chế Độ:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li><strong>Tách mỗi trang 1 file</strong>: Mỗi trang của tài liệu sẽ được lưu thành 1 file PDF riêng lẻ.</li>
                      <li><strong>Tách đôi tài liệu (50/50)</strong>: Chia tệp thành 2 phần bằng nhau.</li>
                      <li><strong>Tách theo dải trang tùy chọn</strong>: Nhập khoảng trang mong muốn (VD: File 1 trang 1-5, File 2 trang 6-12).</li>
                    </ul>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>📤 Trích Xuất Dải Trang (Extract):</h4>
                    <p style={{ margin: 0 }}>
                      Chọn nhanh những trang quan trọng cần gửi cho đối tác → bấm <strong>Trích xuất (Extract)</strong> để lưu riêng thành một tệp PDF độc lập mà không ảnh hưởng tới file gốc.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: ĐIỀN ĐƠN & KÝ TÊN */}
              {activeTab === 'sign' && (
                <motion.div
                  key="sign"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    4. Điền Đơn & Ký Tên Điện Tử (Fill & Sign Studio)
                  </h3>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🖋️ 4 Chế Độ Ký Tên Chuyên Nghiệp:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li><strong>Vẽ chữ ký tay (Draw)</strong>: Dùng chuột hoặc bút cảm ứng vẽ trực tiếp, hỗ trợ 3 màu mực chuẩn (Xanh doanh nghiệp, Đen văn bản, Đỏ dấu ấn).</li>
                      <li><strong>Tải ảnh chữ ký (Upload)</strong>: Tải ảnh chụp chữ ký, công nghệ <em>Smart Background Remover</em> tự động lọc bỏ nền trắng của giấy chụp để tạo ảnh trong suốt tự nhiên.</li>
                      <li><strong>Ký theo tên (Type-to-Sign)</strong>: Gõ họ tên để tạo chữ ký nghệ thuật theo 4 font chữ ký tay thanh lịch.</li>
                      <li><strong>Con dấu văn phòng (Stamp)</strong>: Tạo con dấu doanh nghiệp chuẩn 2 lớp viền (ĐÃ DUYỆT, BẢO MẬT, BẢN GỐC, ĐÃ THANH TOÁN...).</li>
                    </ul>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🎯 Thao Tác Đặt Chữ Ký Lên Trang:</h4>
                    <p style={{ margin: 0 }}>
                      Chữ ký sau khi tạo sẽ xuất hiện trên trang dưới dạng khung điều khiển nổi. Bạn có thể <strong>kéo di chuyển vị trí</strong>, <strong>kéo góc để phóng to/thu nhỏ</strong>, và bấm <strong>Áp dụng (dấu tick xanh)</strong> để khắc vĩnh viễn vào tài liệu.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>📝 Điền Chữ & Ngày Tháng Nhanh:</h4>
                    <p style={{ margin: 0 }}>
                      Bấm nút <strong>Chèn chữ</strong> hoặc <strong>Ngày tháng</strong> để gõ nội dung điền vào hợp đồng, phiếu đề nghị hoặc chèn dấu tick xanh (✔️) xác nhận duyệt.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* TAB 5: GHI CHÚ & SỬA CHỮ */}
              {activeTab === 'edit' && (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    5. Ghi Chú, Đánh Dấu & Sửa Chữ (Annotations)
                  </h3>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🖍️ Đánh Dấu Văn Bản (Highlight & Gạch Chân):</h4>
                    <p style={{ margin: 0 }}>
                      Bật công cụ <strong>Highlight</strong> trên tab Ghi chú để quét dạ quang nổi bật dòng quan trọng với màu vàng/xanh trong suốt. Dùng <strong>Gạch chân (Underline)</strong> hoặc <strong>Gạch bỏ (Strikeout)</strong> để đánh dấu sửa đổi.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>✏️ Sửa Chữ Hiện Có (Whiteout & Replace):</h4>
                    <p style={{ margin: 0 }}>
                      Bấm nút <strong>Sửa văn bản</strong>: Quét chọn vùng chữ cũ cần sửa → hệ thống phủ lớp che trắng tự nhiên (Whiteout) và tự động mở ô Text Box đè lên để bạn gõ nội dung mới chuẩn xác.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🖼️ Chèn Hình Ảnh & Hình Khối:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li><strong>Chèn ảnh</strong>: Chọn ảnh logo, chứng từ, hóa đơn từ máy tính để chèn vào góc trang kèm kéo thả co giãn kích thước.</li>
                      <li><strong>Hình khối & Mũi tên</strong>: Vẽ hình chữ nhật khoanh vùng, hình tròn, mũi tên chỉ dẫn điểm cần lưu ý.</li>
                      <li><strong>Thẻ ghi chú dán (Sticky Note 💬)</strong>: Gắn biểu tượng ghi chú dán màu vàng kèm nội dung popover trao đổi nội bộ.</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* TAB 6: BẢO MẬT & NÉN FILE */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    6. Bảo Mật, Bản Quyền & Nén Dung Lượng (Security & Compress)
                  </h3>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>⚡ Nén Giảm Dung Lượng PDF:</h4>
                    <p style={{ margin: 0 }}>
                      Tài liệu quá nặng khi gửi email/Zalo? Chọn <strong>Nén PDF (Compress)</strong> → Chọn mức nén (Nhẹ, Vừa, Mạnh) → Xem ngay bảng đối chiếu dung lượng ban đầu vs dung lượng mới và phần trăm MB tiết kiệm được trước khi lưu.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>💧 Đóng Dấu Mờ Bản Quyền (Watermark Studio):</h4>
                    <p style={{ margin: 0 }}>
                      Chèn chữ chìm bảo vệ bản quyền (VD: <em>VIETKEY SOLUTIONS, BẢN NHÁP, BẢO MẬT</em>...). Tùy chỉnh thanh trượt độ mờ trong suốt (5% - 90%), cỡ chữ, góc nghiêng và áp dụng cho toàn bộ hoặc từng dải trang chỉ định.
                    </p>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🔒 Đặt Mật Khẩu & Xóa Metadata Nhạy Cảm:</h4>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      <li><strong>Đặt mật khẩu</strong>: Khóa tài liệu bằng mật khẩu mở file, ngăn chặn xem trái phép.</li>
                      <li><strong>Xóa Metadata</strong>: 1-click xóa trắng tên tác giả, tiêu đề máy tính, tên phần mềm tạo để ẩn danh tài liệu tuyệt đối khi gửi ra ngoài.</li>
                    </ul>
                  </div>

                  <div className="settings-section" style={{ background: 'var(--card)', padding: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>🔄 Chuyển Đổi 2 Chiều:</h4>
                    <p style={{ margin: 0 }}>
                      Dễ dàng xuất toàn bộ các trang PDF thành ảnh PNG nét cao (2.0x DPI) hoặc gom nhiều ảnh chụp từ điện thoại thành 1 file PDF duy nhất.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* TAB 7: BẢNG PHÍM TẮT */}
              {activeTab === 'shortcuts' && (
                <motion.div
                  key="shortcuts"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                    ⌨️ Bảng Phím Tắt Tiện Dụng
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>
                    Thao tác nhanh chóng, chuyên nghiệp như các phần mềm thiết kế hàng đầu:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'Ctrl + O', desc: 'Mở tệp PDF mới' },
                      { key: 'Ctrl + S', desc: 'Lưu tệp hiện hành' },
                      { key: 'Ctrl + Shift + S', desc: 'Lưu bản sao mới (Save As)' },
                      { key: 'Ctrl + Z', desc: 'Hoàn tác thao tác trước (Undo)' },
                      { key: 'Ctrl + Y / Ctrl+Shift+Z', desc: 'Làm lại thao tác vừa hủy (Redo)' },
                      { key: 'Ctrl + F', desc: 'Tìm kiếm từ khóa trong PDF' },
                      { key: 'Ctrl + P', desc: 'In tài liệu' },
                      { key: 'R', desc: 'Xoay trang 90° theo chiều kim đồng hồ' },
                      { key: 'Delete', desc: 'Xóa trang hoặc đối tượng đang chọn' },
                      { key: 'Phím cách / H', desc: 'Bật Bàn tay kéo cuộn trang nhanh (Pan)' },
                      { key: 'Ctrl + / Ctrl -', desc: 'Phóng to / Thu nhỏ tài liệu' },
                      { key: 'F11', desc: 'Bật / Thoát chế độ toàn màn hình' },
                      { key: 'Esc', desc: 'Đóng hộp thoại đang mở hoặc hủy công cụ' }
                    ].map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12.5px'
                        }}
                      >
                        <span style={{ color: 'var(--foreground)' }}>{item.desc}</span>
                        <kbd
                          style={{
                            background: 'var(--muted)',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '11.5px',
                            color: 'var(--primary)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            background: 'var(--card)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            <Sparkles size={14} color="var(--primary)" />
            <span>VietKey PDF Studio — 100% Offline & Bảo Mật Dữ Liệu Khách Hàng</span>
          </div>

          <button
            onClick={onClose}
            className="pdf-btn pdf-btn-primary"
            style={{ padding: '8px 22px', fontSize: '13px', fontWeight: 600 }}
          >
            Đã hiểu, Bắt đầu sử dụng
          </button>
        </div>
      </motion.div>
    </div>
  )
}
