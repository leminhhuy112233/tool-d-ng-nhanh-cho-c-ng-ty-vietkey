/**
 * VietKey DocGen — AdvanceRequestDocPreview
 * Bản xem trước trang A4 Đề Nghị Tạm Ứng với khả năng chỉnh sửa trực tiếp chuẩn xác
 */

import React from 'react'
import type { AdvanceRequestData } from '../../../../shared/types'

interface AdvanceRequestDocPreviewProps {
  data: AdvanceRequestData
  onUpdateField?: (field: keyof AdvanceRequestData, val: any) => void
}

export function AdvanceRequestDocPreview({
  data,
  onUpdateField
}: AdvanceRequestDocPreviewProps) {
  const handleBlurText = (field: keyof AdvanceRequestData, e: React.FocusEvent<HTMLElement>) => {
    if (onUpdateField) {
      onUpdateField(field, e.currentTarget.innerText.trim())
    }
  }

  return (
    <div className="a4-document-content" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: 1.6 }}>
      {/* 1. Quốc hiệu Tiêu ngữ */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div contentEditable suppressContentEditableWarning style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', outline: 'none' }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div contentEditable suppressContentEditableWarning style={{ fontSize: '13pt', fontWeight: 'bold', outline: 'none' }}>
          Độc lập - Tự do - Hạnh phúc
        </div>
        <div style={{ width: '150px', height: '1.5px', background: '#000', margin: '4px auto 0' }} />
      </div>

      {/* 2. Tiêu đề Đề nghị tạm ứng */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1
          contentEditable
          suppressContentEditableWarning
          style={{ fontSize: '18pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px', color: '#0f172a', outline: 'none' }}
        >
          GIẤY ĐỀ NGHỊ TẠM ỨNG
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

      {/* 3. Kính gửi */}
      <div style={{ marginBottom: '20px', fontSize: '12pt' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
          <strong style={{ minWidth: '85px' }}>Kính gửi:</strong>
          <div>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('ten_cong_ty_khach', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold', color: '#1e3a8a', textTransform: 'uppercase' }}
            >
              {data.ten_cong_ty_khach || 'BAN GIÁM ĐỐC CÔNG TY'}
            </div>
            <div contentEditable suppressContentEditableWarning style={{ fontStyle: 'italic', fontSize: '11pt', color: '#555', outline: 'none' }}>
              - Ban Giám đốc điều hành & Phòng Kế toán — Tài chính
            </div>
          </div>
        </div>
      </div>

      {/* 4. Nội dung đề nghị */}
      <div style={{ marginBottom: '20px', lineHeight: 1.8 }}>
        <div>
          • Nội dung cung cấp:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('noi_dung_cung_cap', e)}
            className="editable-inline"
            style={{ fontWeight: 600 }}
          >
            {data.noi_dung_cung_cap || 'VLXD các loại'}
          </span>
        </div>

        <div>
          • Tổng giá trị đơn hàng / hợp đồng:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('gia_tri_don_hang', e)}
            className="editable-inline"
            style={{ fontWeight: 'bold' }}
          >
            {data.gia_tri_don_hang || '0'}
          </span>{' '}
          VNĐ
        </div>

        <div>
          • Đợt tạm ứng:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('dot_tam_ung', e)}
            className="editable-inline"
            style={{ fontWeight: 'bold', color: '#1e3a8a' }}
          >
            Đợt {data.dot_tam_ung || '1'}
          </span>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', margin: '14px 0' }}>
          <div style={{ fontSize: '13pt', color: '#0f172a' }}>
            <strong>Số tiền đề nghị tạm ứng: </strong>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('gia_tri_tam_ung', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '14pt' }}
            >
              {data.gia_tri_tam_ung || '0'}
            </span>{' '}
            <strong>VNĐ</strong>
          </div>

          <div style={{ fontSize: '11.5pt', marginTop: '6px' }}>
            <em>(Bằng chữ: </em>
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('so_tien_bang_chu', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold', fontStyle: 'italic' }}
            >
              {data.so_tien_bang_chu ? `${data.so_tien_bang_chu} đồng` : '(Chưa có số tiền bằng chữ)'}
            </span>
            <em>)</em>
          </div>
        </div>

        <div>
          • Thời hạn thanh toán hoàn ứng:{' '}
          <span contentEditable suppressContentEditableWarning className="editable-inline" style={{ outline: 'none' }}>
            Quyết toán và hoàn ứng ngay sau khi hoàn thành giao nhận hàng hóa.
          </span>
        </div>

        <div contentEditable suppressContentEditableWarning style={{ fontStyle: 'italic', marginTop: '8px', outline: 'none', color: '#444' }}>
          Kính mong Ban Giám đốc và Phòng Kế toán xem xét và duyệt tạm ứng để đảm bảo tiến độ triển khai công việc.
        </div>
      </div>

      {/* 5. Chữ ký duyệt 3 bên */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '40px', textAlign: 'center', pageBreakInside: 'avoid' }}>
        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt' }}>NGƯỜI ĐỀ NGHỊ</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: '70px' }} />
          <div contentEditable suppressContentEditableWarning style={{ fontWeight: 600, fontSize: '11pt', outline: 'none' }}>
            (Người lập phiếu)
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt' }}>KẾ TOÁN TRƯỞNG</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: '70px' }} />
          <div contentEditable suppressContentEditableWarning style={{ fontWeight: 600, fontSize: '11pt', outline: 'none' }}>
            (Kế toán duyệt)
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt', color: '#1e3a8a' }}>GIÁM ĐỐC DUYỆT</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký tên, đóng dấu)</div>
          <div style={{ height: '70px' }} />
          <div contentEditable suppressContentEditableWarning style={{ fontWeight: 'bold', fontSize: '11pt', color: '#1e3a8a', outline: 'none' }}>
            BAN GIÁM ĐỐC
          </div>
        </div>
      </div>
    </div>
  )
}
