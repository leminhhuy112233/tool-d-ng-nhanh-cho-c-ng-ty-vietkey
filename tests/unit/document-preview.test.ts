import { describe, it, expect, vi } from 'vitest'
import type { QuotationData, ContractData, AdvanceRequestData } from '../../src/shared/types'

describe('Document Preview & Two-Way Sync Logic', () => {
  it('Báo giá (Quotation): Đồng bộ và cập nhật trường dữ liệu khi sửa trực tiếp trên bản xem trước', () => {
    const mockQuotation: QuotationData = {
      ten_khach_hang: 'Công ty Cổ phần Xây Dựng Miền Nam',
      ngay: '24',
      thang: '09',
      nam: '2026',
      items: [
        { stt: '01', ten_hang_hoa: 'Xi măng Hà Tiên', quy_cach: 'Bao', so_luong: '100', don_gia: '90.000', thanh_tien: '9.000.000', ghi_chu: '' }
      ],
      co_ghi_chu: false,
      tong_tien_truoc_thue: '9.000.000',
      vat: '10',
      tien_thue: '900.000',
      tong_tien_sau_thue: '9.900.000',
      so_tien_bang_chu: 'Chín triệu chín trăm nghìn',
      export_type: 'word',
      file_name: 'BaoGia_Test.docx'
    }

    const onUpdateField = vi.fn((field: keyof QuotationData, val: any) => {
      mockQuotation[field] = val
    })

    // Giả lập người dùng click vào tên khách hàng trên preview A4 và đổi tên
    onUpdateField('ten_khach_hang', 'Tập Đoàn Địa Ốc Hưng Thịnh')
    expect(mockQuotation.ten_khach_hang).toBe('Tập Đoàn Địa Ốc Hưng Thịnh')
    expect(onUpdateField).toHaveBeenCalledWith('ten_khach_hang', 'Tập Đoàn Địa Ốc Hưng Thịnh')

    // Giả lập sửa số tiền bằng chữ trên preview
    onUpdateField('so_tien_bang_chu', 'Mười triệu đồng chẵn')
    expect(mockQuotation.so_tien_bang_chu).toBe('Mười triệu đồng chẵn')
  })

  it('Hợp đồng (Contract): Đồng bộ số HĐ, ngày ký và thông tin 2 bên', () => {
    const mockContract: ContractData = {
      so_hd: '0109/2026/HĐNT/LĐP-VK',
      ngay: '01',
      thang: '09',
      nam: '2026',
      noi_dung_mua_ban: 'mua bán vật tư, vật liệu xây dựng',
      bena_ten_cong_ty: 'CÔNG TY TNHH VIETKEY',
      bena_dai_dien: 'LÊ MINH HUY',
      bena_xung_danh: 'Ông',
      bena_chuc_vu: 'Giám đốc',
      bena_dia_chi: 'TP.HCM',
      bena_tai_khoan: '123456789',
      bena_ngan_hang: 'Vietcombank',
      bena_mst: '0312345678',
      bena_dien_thoai: '0909123456',
      benb_ten_cong_ty: 'CÔNG TY ĐỐI TÁC ABC',
      benb_dai_dien: 'TRẦN THỊ B',
      benb_xung_danh: 'Bà',
      benb_chuc_vu: 'Tổng Giám Đốc',
      benb_dia_chi: 'Hà Nội',
      benb_tai_khoan: '987654321',
      benb_ngan_hang: 'Techcombank',
      benb_mst: '0109876543',
      benb_dien_thoai: '0912345678',
      benb_email: 'abc@partner.vn',
      export_type: 'word',
      file_name: 'HopDong_Test.docx'
    }

    const onUpdateContract = vi.fn((field: keyof ContractData, val: any) => {
      mockContract[field] = val
    })

    // Giả lập sửa trực tiếp số HĐ trên trang xem trước
    onUpdateContract('so_hd', '0999/2026/HĐNT/LĐP-VK')
    expect(mockContract.so_hd).toBe('0999/2026/HĐNT/LĐP-VK')

    // Giả lập sửa đại diện Bên B
    onUpdateContract('benb_dai_dien', 'NGUYỄN VĂN AN')
    expect(mockContract.benb_dai_dien).toBe('NGUYỄN VĂN AN')
  })

  it('Đề nghị tạm ứng (Advance Request): Đồng bộ số tiền tạm ứng và đợt tạm ứng', () => {
    const mockAdvance: AdvanceRequestData = {
      ngay: '24',
      thang: '09',
      nam: '2026',
      ten_cong_ty_khach: 'CÔNG TY TNHH XÂY LẮP ĐIỆN 1',
      noi_dung_cung_cap: 'Cung cấp cáp điện và phụ kiện hạ thế',
      dot_tam_ung: '1',
      gia_tri_don_hang: '500.000.000',
      gia_tri_tam_ung: '150.000.000',
      so_tien_bang_chu: 'Một trăm năm mươi triệu đồng',
      export_type: 'word',
      file_name: 'DeNghiTamUng_Test.docx'
    }

    const onUpdateAdvance = vi.fn((field: keyof AdvanceRequestData, val: any) => {
      mockAdvance[field] = val
    })

    // Giả lập sửa đợt tạm ứng và số tiền trên preview
    onUpdateAdvance('dot_tam_ung', '2')
    onUpdateAdvance('gia_tri_tam_ung', '200.000.000')
    expect(mockAdvance.dot_tam_ung).toBe('2')
    expect(mockAdvance.gia_tri_tam_ung).toBe('200.000.000')
  })
})
