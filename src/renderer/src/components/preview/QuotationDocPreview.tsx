/**
 * VietKey DocGen — QuotationDocPreview
 * Bản xem trước trang A4 Báo Giá với khả năng chỉnh sửa trực tiếp từng phần tử
 */

import React from 'react'
import type { QuotationData, QuotationItem } from '../../../../shared/types'

interface QuotationDocPreviewProps {
  data: QuotationData
  onUpdateField?: (field: keyof QuotationData, val: any) => void
  onUpdateItem?: (idx: number, field: keyof QuotationItem, val: string) => void
}

export function QuotationDocPreview({
  data,
  onUpdateField,
  onUpdateItem
}: QuotationDocPreviewProps) {
  const handleBlurText = (field: keyof QuotationData, e: React.FocusEvent<HTMLElement>) => {
    if (onUpdateField) {
      onUpdateField(field, e.currentTarget.innerText.trim())
    }
  }

  const handleBlurItem = (idx: number, field: keyof QuotationItem, e: React.FocusEvent<HTMLElement>) => {
    if (onUpdateItem) {
      onUpdateItem(idx, field, e.currentTarget.innerText.trim())
    }
  }

  const isWithNotes = Boolean(data.co_ghi_chu)
  const items = data.items && data.items.length > 0 ? data.items : [
    { stt: '01', ten_hang_hoa: 'Sản phẩm mẫu 01', quy_cach: 'Bộ', so_luong: '1', don_gia: '1.000.000', thanh_tien: '1.000.000', ghi_chu: '' }
  ]

  return (
    <div className="a4-document-content" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
      {/* 1. Header Công ty */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div
            contentEditable
            suppressContentEditableWarning
            style={{ fontSize: '13pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a8a', outline: 'none' }}
          >
            CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ XÂY DỰNG VIETKEY
          </div>
          <div contentEditable suppressContentEditableWarning style={{ fontSize: '10pt', color: '#333', marginTop: '2px', outline: 'none' }}>
            Địa chỉ: Tầng 5, Tòa nhà Văn phòng, TP. Hồ Chí Minh
          </div>
          <div contentEditable suppressContentEditableWarning style={{ fontSize: '10pt', color: '#333', outline: 'none' }}>
            Hotline: 0909.123.456 — Email: contact@vietkey.vn
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '10pt', color: '#555', fontStyle: 'italic' }}>
          <div>Mẫu số: BG-2026/VK</div>
          <div>Bản in chính thức</div>
        </div>
      </div>

      {/* 2. Tiêu đề Báo giá */}
      <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
        <h1
          contentEditable
          suppressContentEditableWarning
          style={{ fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px', color: '#0f172a', outline: 'none' }}
        >
          BẢNG BÁO GIÁ DỊCH VỤ & HÀNG HÓA
        </h1>
        <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#444' }}>
          Ngày{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('ngay', e)}
            className="editable-inline"
            style={{ fontWeight: 'bold' }}
          >
            {data.ngay || '......'}
          </span>{' '}
          tháng{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('thang', e)}
            className="editable-inline"
            style={{ fontWeight: 'bold' }}
          >
            {data.thang || '......'}
          </span>{' '}
          năm{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('nam', e)}
            className="editable-inline"
            style={{ fontWeight: 'bold' }}
          >
            {data.nam || '2026'}
          </span>
        </div>
      </div>

      {/* 3. Kính gửi khách hàng */}
      <div style={{ fontSize: '12pt', marginBottom: '16px', lineHeight: 1.6 }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <strong style={{ minWidth: '85px' }}>Kính gửi:</strong>
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('ten_khach_hang', e)}
            className="editable-inline"
            style={{ flex: 1, fontWeight: 'bold', color: '#1e3a8a' }}
          >
            {data.ten_khach_hang || '(Chưa nhập tên khách hàng)'}
          </span>
        </div>
        <div contentEditable suppressContentEditableWarning style={{ fontStyle: 'italic', color: '#444', outline: 'none', marginTop: '4px' }}>
          Công ty chúng tôi xin trân trọng gửi tới Quý khách hàng bảng báo giá chi tiết cho các sản phẩm/dịch vụ theo yêu cầu như sau:
        </div>
      </div>

      {/* 4. Bảng danh mục hàng hóa */}
      <table className="a4-preview-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '11pt' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', fontWeight: 'bold', textAlign: 'center' }}>
            <th style={{ border: '1px solid #000', padding: '6px 4px', width: '38px' }}>STT</th>
            <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'left' }}>Tên Hàng Hóa, Dịch Vụ</th>
            <th style={{ border: '1px solid #000', padding: '6px 4px', width: '55px' }}>ĐVT</th>
            <th style={{ border: '1px solid #000', padding: '6px 4px', width: '55px' }}>SL</th>
            <th style={{ border: '1px solid #000', padding: '6px 8px', width: '95px', textAlign: 'right' }}>Đơn Giá (VNĐ)</th>
            <th style={{ border: '1px solid #000', padding: '6px 8px', width: '110px', textAlign: 'right' }}>Thành Tiền (VNĐ)</th>
            {isWithNotes && (
              <th style={{ border: '1px solid #000', padding: '6px 8px', width: '90px', textAlign: 'left' }}>Ghi Chú</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr key={idx}>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurItem(idx, 'stt', e)}
                style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center' }}
              >
                {it.stt || String(idx + 1).padStart(2, '0')}
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurItem(idx, 'ten_hang_hoa', e)}
                style={{ border: '1px solid #000', padding: '6px 8px', fontWeight: 500 }}
              >
                {it.ten_hang_hoa || ''}
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurItem(idx, 'quy_cach', e)}
                style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center' }}
              >
                {it.quy_cach || ''}
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurItem(idx, 'so_luong', e)}
                style={{ border: '1px solid #000', padding: '6px 4px', textAlign: 'center' }}
              >
                {it.so_luong || ''}
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurItem(idx, 'don_gia', e)}
                style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}
              >
                {it.don_gia || ''}
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurItem(idx, 'thanh_tien', e)}
                style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}
              >
                {it.thanh_tien || ''}
              </td>
              {isWithNotes && (
                <td
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleBlurItem(idx, 'ghi_chu', e)}
                  style={{ border: '1px solid #000', padding: '6px 8px', fontSize: '10pt', color: '#444' }}
                >
                  {it.ghi_chu || ''}
                </td>
              )}
            </tr>
          ))}

          {/* Hàng tổng cộng */}
          <tr>
            <td colSpan={isWithNotes ? 6 : 5} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
              Tổng tiền trước thuế:
            </td>
            <td
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('tong_tien_truoc_thue', e)}
              style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}
            >
              {data.tong_tien_truoc_thue || '0'}
            </td>
          </tr>

          {Boolean(data.chiet_khau && data.chiet_khau !== '0') && (
            <tr>
              <td colSpan={isWithNotes ? 6 : 5} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontStyle: 'italic' }}>
                Chiết khấu thương mại:
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurText('chiet_khau', e)}
                style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', color: '#b91c1c' }}
              >
                {data.chiet_khau}
              </td>
            </tr>
          )}

          {Boolean(data.vat && data.vat !== '0') && (
            <tr>
              <td colSpan={isWithNotes ? 6 : 5} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right', fontStyle: 'italic' }}>
                Thuế GTGT (VAT {data.vat}%):
              </td>
              <td
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlurText('tien_thue', e)}
                style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'right' }}
              >
                {data.tien_thue || '0'}
              </td>
            </tr>
          )}

          <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
            <td colSpan={isWithNotes ? 6 : 5} style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', textTransform: 'uppercase', color: '#1e3a8a' }}>
              Tổng cộng thanh toán:
            </td>
            <td
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('tong_tien_sau_thue', e)}
              style={{ border: '1px solid #000', padding: '8px', textAlign: 'right', fontSize: '12pt', color: '#1e3a8a' }}
            >
              {data.tong_tien_sau_thue || '0'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Số tiền bằng chữ */}
      <div style={{ fontSize: '11.5pt', marginBottom: '16px', lineHeight: 1.5 }}>
        <strong>Số tiền bằng chữ: </strong>
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleBlurText('so_tien_bang_chu', e)}
          className="editable-inline"
          style={{ fontStyle: 'italic', fontWeight: 'bold', color: '#0f172a' }}
        >
          {data.so_tien_bang_chu ? `${data.so_tien_bang_chu} đồng` : '(Chưa có số tiền bằng chữ)'}
        </span>
      </div>

      {/* 6. Ghi chú & Điều khoản thanh toán */}
      <div style={{ fontSize: '11pt', marginBottom: '24px', lineHeight: 1.6, background: '#fafafa', padding: '10px 14px', borderLeft: '3px solid #1e3a8a' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', textDecoration: 'underline' }}>Ghi chú & Điều kiện thương mại:</div>
        <div>
          • Thời hạn hiệu lực báo giá:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('thoi_han_bao_gia', e)}
            className="editable-inline"
          >
            {data.thoi_han_bao_gia || '30 ngày kể từ ngày báo giá'}
          </span>
        </div>
        <div>
          • Điều khoản thanh toán:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('dieu_khoan_thanh_toan', e)}
            className="editable-inline"
          >
            {data.dieu_khoan_thanh_toan || 'Thanh toán 100% sau khi giao nhận hàng hóa'}
          </span>
        </div>
      </div>

      {/* 7. Phần Chữ ký */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '20px', textAlign: 'center', pageBreakInside: 'avoid' }}>
        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt' }}>ĐẠI DIỆN KHÁCH HÀNG</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: '80px' }} />
          <div contentEditable suppressContentEditableWarning style={{ fontSize: '11pt', fontStyle: 'italic', color: '#888', outline: 'none' }}>
            (Người duyệt đơn)
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt' }}>ĐẠI DIỆN BÊN BÁO GIÁ</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký, đóng dấu, ghi rõ họ tên)</div>
          <div style={{ height: '80px' }} />
          <div
            contentEditable
            suppressContentEditableWarning
            style={{ fontSize: '11pt', fontWeight: 'bold', outline: 'none', color: '#1e3a8a' }}
          >
            NGƯỜI LẬP BÁO GIÁ
          </div>
        </div>
      </div>
    </div>
  )
}
