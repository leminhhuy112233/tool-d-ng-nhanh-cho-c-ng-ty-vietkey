/**
 * VietKey DocGen — ContractDocPreview
 * Bản xem trước trang A4 Hợp Đồng Nguyên Tắc với khả năng chỉnh sửa trực tiếp chuẩn thể thức hành chính
 */

import React from 'react'
import type { ContractData } from '../../../../shared/types'

interface ContractDocPreviewProps {
  data: ContractData
  onUpdateField?: (field: keyof ContractData, val: any) => void
}

export function ContractDocPreview({
  data,
  onUpdateField
}: ContractDocPreviewProps) {
  const handleBlurText = (field: keyof ContractData, e: React.FocusEvent<HTMLElement>) => {
    if (onUpdateField) {
      onUpdateField(field, e.currentTarget.innerText.trim())
    }
  }

  return (
    <div className="a4-document-content" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: 1.5 }}>
      {/* 1. Quốc hiệu Tiêu ngữ */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div contentEditable suppressContentEditableWarning style={{ fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase', outline: 'none' }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div contentEditable suppressContentEditableWarning style={{ fontSize: '13pt', fontWeight: 'bold', outline: 'none' }}>
          Độc lập - Tự do - Hạnh phúc
        </div>
        <div style={{ width: '160px', height: '1.5px', background: '#000', margin: '4px auto 0' }} />
      </div>

      {/* 2. Tiêu đề Hợp đồng & Số hiệu */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1
          contentEditable
          suppressContentEditableWarning
          style={{ fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 6px 0', letterSpacing: '0.5px', outline: 'none' }}
        >
          HỢP ĐỒNG NGUYÊN TẮC
        </h1>
        <div style={{ fontSize: '11pt', fontStyle: 'italic' }}>
          (Về việc:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('noi_dung_mua_ban', e)}
            className="editable-inline"
            style={{ fontWeight: 600 }}
          >
            {data.noi_dung_mua_ban || 'mua bán vật tư, vật liệu xây dựng'}
          </span>
          )
        </div>
        <div style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '4px' }}>
          Số:{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('so_hd', e)}
            className="editable-inline"
            style={{ color: '#1e3a8a' }}
          >
            {data.so_hd || '0109/2026/HĐNT/VK'}
          </span>
        </div>
      </div>

      {/* 3. Căn cứ pháp lý & Ngày lập */}
      <div style={{ fontStyle: 'italic', fontSize: '11pt', marginBottom: '14px', textAlign: 'justify', color: '#333' }}>
        <div>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 đã được Quốc hội nước CHXHCN Việt Nam thông qua;</div>
        <div>- Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14 tháng 06 năm 2005;</div>
        <div>- Căn cứ nhu cầu và khả năng thực tế của hai bên.</div>
      </div>

      <div style={{ marginBottom: '14px', textAlign: 'justify' }}>
        Hôm nay, ngày{' '}
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
        , tại văn phòng chúng tôi gồm có:
      </div>

      {/* 4. BÊN A */}
      <div style={{ marginBottom: '14px', background: '#fafafa', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: '#1e3a8a' }}>
          BÊN A (BÊN BÁN):{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('bena_ten_cong_ty', e)}
            className="editable-inline"
          >
            {data.bena_ten_cong_ty || 'CÔNG TY TNHH VIETKEY'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px', fontSize: '11pt' }}>
          <div>
            • Địa chỉ:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_dia_chi', e)}
              className="editable-inline"
            >
              {data.bena_dia_chi || 'TP. Hồ Chí Minh'}
            </span>
          </div>
          <div>
            • Đại diện:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_xung_danh', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold' }}
            >
              {data.bena_xung_danh || 'Ông'}
            </span>{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_dai_dien', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold', textTransform: 'uppercase' }}
            >
              {data.bena_dai_dien || 'NGUYỄN VĂN A'}
            </span>
            {' — '}Chức vụ:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_chuc_vu', e)}
              className="editable-inline"
            >
              {data.bena_chuc_vu || 'Giám đốc'}
            </span>
          </div>
          <div>
            • Mã số thuế:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_mst', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold' }}
            >
              {data.bena_mst || '0312345678'}
            </span>
            {' — '}Điện thoại:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_dien_thoai', e)}
              className="editable-inline"
            >
              {data.bena_dien_thoai || '0909.123.456'}
            </span>
          </div>
          <div>
            • Tài khoản số:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_tai_khoan', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold' }}
            >
              {data.bena_tai_khoan || '1234567890'}
            </span>
            {' '}tại Ngân hàng:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('bena_ngan_hang', e)}
              className="editable-inline"
            >
              {data.bena_ngan_hang || 'Vietcombank'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. BÊN B */}
      <div style={{ marginBottom: '16px', background: '#fafafa', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', color: '#0f766e' }}>
          BÊN B (BÊN MUA):{' '}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleBlurText('benb_ten_cong_ty', e)}
            className="editable-inline"
          >
            {data.benb_ten_cong_ty || '(Tên công ty khách hàng / đối tác)'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px', fontSize: '11pt' }}>
          <div>
            • Địa chỉ:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_dia_chi', e)}
              className="editable-inline"
            >
              {data.benb_dia_chi || 'Địa chỉ trụ sở đối tác...'}
            </span>
          </div>
          <div>
            • Đại diện:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_xung_danh', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold' }}
            >
              {data.benb_xung_danh || 'Ông/Bà'}
            </span>{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_dai_dien', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold', textTransform: 'uppercase' }}
            >
              {data.benb_dai_dien || 'ĐẠI DIỆN BÊN B'}
            </span>
            {' — '}Chức vụ:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_chuc_vu', e)}
              className="editable-inline"
            >
              {data.benb_chuc_vu || 'Giám đốc'}
            </span>
          </div>
          <div>
            • Mã số thuế:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_mst', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold' }}
            >
              {data.benb_mst || 'Chưa nhập MST'}
            </span>
            {' — '}Điện thoại:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_dien_thoai', e)}
              className="editable-inline"
            >
              {data.benb_dien_thoai || 'Chưa nhập SĐT'}
            </span>
          </div>
          <div>
            • Tài khoản số:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_tai_khoan', e)}
              className="editable-inline"
              style={{ fontWeight: 'bold' }}
            >
              {data.benb_tai_khoan || 'Chưa có STK'}
            </span>
            {' '}tại Ngân hàng:{' '}
            <span
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleBlurText('benb_ngan_hang', e)}
              className="editable-inline"
            >
              {data.benb_ngan_hang || 'Ngân hàng...'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Các Điều khoản Hợp đồng */}
      <div style={{ fontSize: '11.5pt', lineHeight: 1.6, textAlign: 'justify', marginBottom: '24px' }}>
        <p>Hai bên cùng thỏa thuận và nhất trí ký kết Hợp đồng nguyên tắc với các điều khoản sau:</p>

        <div style={{ marginBottom: '10px' }}>
          <strong>Điều 1. Nội dung hợp đồng</strong>
          <div contentEditable suppressContentEditableWarning style={{ paddingLeft: '16px', outline: 'none' }}>
            Bên A đồng ý cung cấp và Bên B đồng ý mua{' '}
            <span style={{ fontWeight: 'bold' }}>{data.noi_dung_mua_ban || 'vật tư, vật liệu xây dựng'}</span>{' '}
            theo từng đơn đặt hàng hoặc phụ lục hợp đồng cụ thể phát sinh trong thời gian hiệu lực của hợp đồng này.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Điều 2. Quy cách, số lượng và chất lượng</strong>
          <div contentEditable suppressContentEditableWarning style={{ paddingLeft: '16px', outline: 'none' }}>
            Quy cách, số lượng, chủng loại và đơn giá chi tiết của từng lô hàng sẽ được ghi rõ trong từng Báo giá hoặc Đơn đặt hàng cụ thể do hai bên xác nhận. Hàng hóa Bên A cung cấp phải bảo đảm đúng tiêu chuẩn chất lượng.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Điều 3. Phương thức giao nhận và thanh toán</strong>
          <div contentEditable suppressContentEditableWarning style={{ paddingLeft: '16px', outline: 'none' }}>
            - Địa điểm giao hàng: Theo thỏa thuận cụ thể trong từng đơn đặt hàng.<br />
            - Thanh toán bằng hình thức chuyển khoản vào tài khoản ngân hàng của Bên A.<br />
            - Thời hạn thanh toán căn cứ theo thỏa thuận hoặc biên bản đối chiếu công nợ hàng tháng.
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <strong>Điều 4. Trách nhiệm và cam kết chung</strong>
          <div contentEditable suppressContentEditableWarning style={{ paddingLeft: '16px', outline: 'none' }}>
            Hai bên cam kết thực hiện đúng các điều khoản đã ghi trong hợp đồng. Mọi tranh chấp phát sinh sẽ được giải quyết trên tinh thần hợp tác, bình đẳng.
          </div>
        </div>
      </div>

      {/* 7. Ký tên đại diện 2 bên */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '24px', textAlign: 'center', pageBreakInside: 'avoid' }}>
        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>ĐẠI DIỆN BÊN A</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký, đóng dấu, ghi rõ họ tên)</div>
          <div style={{ height: '75px' }} />
          <div
            contentEditable
            suppressContentEditableWarning
            style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#1e3a8a', outline: 'none' }}
          >
            {data.bena_dai_dien || 'NGUYỄN VĂN A'}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>ĐẠI DIỆN BÊN B</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký, đóng dấu, ghi rõ họ tên)</div>
          <div style={{ height: '75px' }} />
          <div
            contentEditable
            suppressContentEditableWarning
            style={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#0f766e', outline: 'none' }}
          >
            {data.benb_dai_dien || 'ĐẠI DIỆN BÊN B'}
          </div>
        </div>
      </div>
    </div>
  )
}
