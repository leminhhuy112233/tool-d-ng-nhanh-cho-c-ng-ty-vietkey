/**
 * VietKey DocGen — Shared Formatters & Financial Calculations
 * Định dạng tiền tệ VNĐ, xử lý số liệu bảng báo giá và tính phần trăm
 */

/**
 * Xóa ký tự không phải số, chỉ giữ lại các chữ số
 */
export function cleanDigits(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return ''
  return String(val).replace(/[^0-9]/g, '')
}

/**
 * Định dạng số nguyên thành chuỗi tiền tệ chuẩn Việt Nam (vd: 1250000 -> "1.250.000")
 */
export function formatCurrencyVND(val: string | number | undefined | null): string {
  const digits = cleanDigits(val)
  if (!digits) return ''
  const num = Number(digits)
  if (isNaN(num)) return ''
  return num.toLocaleString('vi-VN')
}

/**
 * Tính đơn giá sau khi tăng/giảm % (làm tròn số nguyên chuẩn tiền tệ VNĐ)
 * Hỗ trợ cả dấu chấm và dấu phẩy thập phân (vd: "15" hoặc "12,5")
 */
export function calculatePriceWithPercent(basePrice: string, percentStr: string): string {
  const digits = cleanDigits(basePrice)
  if (!digits) return ''
  const baseNum = Number(digits)
  const pct = parseFloat((percentStr || '').replace(',', '.'))
  if (isNaN(pct) || pct === 0) {
    return baseNum.toLocaleString('vi-VN')
  }
  const finalPrice = Math.round(baseNum * (1 + pct / 100))
  return finalPrice.toLocaleString('vi-VN')
}

/**
 * Định dạng ngày/tháng/năm hiển thị chuẩn Việt Nam
 */
export function formatDateVN(day?: string, month?: string, year?: string): string {
  if (!day && !month && !year) return ''
  const d = (day || '...').padStart(2, '0')
  const m = (month || '...').padStart(2, '0')
  const y = year || '....'
  return `ngày ${d} tháng ${m} năm ${y}`
}
