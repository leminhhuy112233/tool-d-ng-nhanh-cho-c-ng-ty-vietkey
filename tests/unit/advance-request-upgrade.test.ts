import { describe, it, expect } from 'vitest'
import { renderAdvanceRequestDocxBuffer } from '../../src/main/services/docx-engine'
import type { AdvanceRequestData } from '../../src/shared/types'
import PizZip from 'pizzip'

describe('Upgraded Advance Request Document Generation Test', () => {
  it('tạo file DOCX Đề Nghị Tạm Ứng chuẩn với bảng vật tư động và mộc đỏ Giám đốc Vietkey', () => {
    const testData: AdvanceRequestData = {
      ngay: '24',
      thang: '09',
      nam: '2026',
      ten_cong_ty_khach: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN CIENC04',
      dot_tam_ung: '2',
      ngay_don_hang: '24',
      thang_don_hang: '09',
      nam_don_hang: '2026',
      noi_dung_cung_cap: 'đá các loại',
      items: [
        {
          id: '1',
          stt: 1,
          ten_vat_tu: 'Cấp phối đá dăm Dmax 37,5',
          don_vi: 'M3',
          so_luong: '2.000',
          don_gia: '363.000',
          thanh_tien: '726.000.000 ₫',
          ghi_chu: 'Mỏ Hòn Ngang'
        },
        {
          id: '2',
          stt: 2,
          ten_vat_tu: 'Đá BTN 1,9*2,5',
          don_vi: 'M3',
          so_luong: '500',
          don_gia: '625.000',
          thanh_tien: '312.500.000 ₫',
          ghi_chu: 'Đạt chuẩn'
        }
      ],
      dieu_kien_thanh_toan: 'Thanh toán trước 100% đơn hàng',
      tong_tien: '1.038.500.000 ₫',
      so_tien_bang_chu: 'Một tỷ không trăm ba mươi tám triệu năm trăm nghìn đồng',
      file_name: 'DeNghiTamUng_CIENC04.docx',
      export_type: 'word'
    }

    const res = renderAdvanceRequestDocxBuffer(testData)
    expect(res.success).toBe(true)
    expect(res.buffer).toBeDefined()

    // Phân tích nội dung buffer đã render
    const zip = new PizZip(res.buffer!)
    const xml = zip.file('word/document.xml')!.asText()

    // 1. Phải giữ nguyên mộc đỏ và chữ ký giám đốc Vietkey (image1.jpeg)
    const mediaFiles = Object.keys(zip.files).filter((k) => k.startsWith('word/media/'))
    expect(mediaFiles.length).toBeGreaterThanOrEqual(1)
    expect(mediaFiles).toContain('word/media/image1.jpeg')

    // 2. Chứa tên khách hàng
    expect(xml).toContain('CÔNG TY CỔ PHẦN TẬP ĐOÀN CIENC04')

    // 3. Chứa căn cứ đơn hàng đợt 2
    expect(xml).toContain('đợt 2')
    expect(xml).toContain('đá các loại')

    // 4. Chứa các mặt hàng trong bảng
    expect(xml).toContain('Cấp phối đá dăm Dmax 37,5')
    expect(xml).toContain('726.000.000 ₫')
    expect(xml).toContain('Đá BTN 1,9*2,5')
    expect(xml).toContain('312.500.000 ₫')

    // 5. Chứa điều kiện thanh toán và tổng tiền
    expect(xml).toContain('Thanh toán trước 100% đơn hàng')
    expect(xml).toContain('1.038.500.000 ₫')

    // 6. Chứa số tiền bằng chữ chuẩn
    expect(xml).toContain('Một tỷ không trăm ba mươi tám triệu năm trăm nghìn đồng')
  })
})
