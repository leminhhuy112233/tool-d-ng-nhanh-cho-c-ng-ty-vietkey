import type { ContractData, QuotationData, QuotationItem } from '../../shared/types'
import { getSetting } from './database'

/**
 * Local RegEx Parser cho Hợp đồng (Cực nhanh, Offline 100%)
 */
export function parseTextLocal(text: string): Partial<ContractData> {
  const result: Partial<ContractData> = {}

  if (!text || !text.trim()) return result

  // 1. Mã số thuế (MST)
  const mstMatch =
    text.match(/(?:MST|Mã\s*số\s*thuế|Tax\s*Code)[:\s]*([0-9]{10}(?:-[0-9]{3})?)/i) ||
    text.match(/\b([0-9]{10})\b/)
  if (mstMatch) {
    result.bena_mst = mstMatch[1].trim()
  }

  // 2. Đại diện / Người đại diện / Chức vụ
  const daiDienMatch = text.match(
    /(?:Đại\s*diện|Đại\s*diện\s*pháp\s*lý|Đại\s*diện\s*\(Ông\/Bà\)|Đại\s*diện\s*\(Ông\)|Đại\s*diện\s*\(Bà\)|Ông\/Bà|Ông|Bà)[:\s]*([^\n,]+)/i
  )
  if (daiDienMatch) {
    let rawName = daiDienMatch[1].trim()
    if (/^bà\s+/i.test(rawName)) {
      result.bena_xung_danh = 'Bà'
      rawName = rawName.replace(/^bà\s+/i, '').trim()
    } else if (/^ông\s+/i.test(rawName)) {
      result.bena_xung_danh = 'Ông'
      rawName = rawName.replace(/^ông\s+/i, '').trim()
    } else {
      result.bena_xung_danh = 'Ông'
    }
    result.bena_dai_dien = rawName.toUpperCase()
  }

  // 3. Chức Vụ
  const chucVuMatch = text.match(/(?:Chức\s*vụ|Chức\s*danh)[:\s]*([^\n,]+)/i)
  if (chucVuMatch) {
    result.bena_chuc_vu = chucVuMatch[1].trim()
  } else if (result.bena_dai_dien) {
    result.bena_chuc_vu = 'Giám đốc'
  }

  // 4. Tên công ty / Bên Mua
  const companyMatch = text.match(
    /(?:CÔNG\s*TY|CTY|TNHH|CỔ\s*PHẦN|CP|DOANH\s*NGHIỆP)[^\n,]+/i
  )
  if (companyMatch) {
    let compName = companyMatch[0].trim()
    if (compName.toUpperCase().startsWith('CTY')) {
      compName = compName.replace(/^CTY/i, 'CÔNG TY')
    }
    result.bena_ten_cong_ty = compName.toUpperCase()
  }

  // 5. Địa chỉ
  const diaChiMatch = text.match(/(?:Địa\s*chỉ|Đ\/c|Địa\s*chỉ\s*trụ\s*sở)[:\s]*([^\n]+)/i)
  if (diaChiMatch) {
    result.bena_dia_chi = diaChiMatch[1].trim()
  }

  // 6. Số tài khoản
  const stkMatch = text.match(
    /(?:STK|Tài\s*khoản|Số\s*tài\s*khoản)[:\s]*([0-9\s\-]+(?:tại|Ngân\s*hàng)?[^\n]+)/i
  )
  if (stkMatch) {
    result.bena_tai_khoan = stkMatch[1].trim()
  }

  // 7. Số hợp đồng
  const soHdMatch = text.match(/(?:Số\s*HĐ|Số|Hợp\s*đồng\s*số)[:\s]*([A-Z0-9\/\-\_]+)/i)
  if (soHdMatch) {
    result.so_hd = soHdMatch[1].trim()
  }

  // 8. Ngày tháng năm
  const ngayMatch = text.match(
    /ngày\s*([0-9]{1,2})\s*tháng\s*([0-9]{1,2})\s*năm\s*([0-9]{4})/i
  )
  if (ngayMatch) {
    result.ngay = ngayMatch[1].padStart(2, '0')
    result.thang = ngayMatch[2].padStart(2, '0')
    result.nam = ngayMatch[3]
  }

  return result
}

/**
 * AI Parser Hợp đồng
 */
export async function parseTextWithAI(rawText: string): Promise<Partial<ContractData>> {
  const localResult = parseTextLocal(rawText)
  const apiKey = getSetting('openaiApiKey')

  if (!apiKey || !apiKey.trim().startsWith('sk-')) {
    return localResult
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý bóc tách thông tin công ty tiếng Việt. Trả về đúng 1 JSON object:
{
  "so_hd": "",
  "ngay": "",
  "thang": "",
  "nam": "",
  "noi_dung_mua_ban": "",
  "bena_ten_cong_ty": "",
  "bena_dai_dien": "",
  "bena_chuc_vu": "",
  "bena_dia_chi": "",
  "bena_tai_khoan": "",
  "bena_mst": ""
}`
          },
          { role: 'user', content: rawText }
        ],
        temperature: 0.1
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return localResult
    }

    const data = await response.json()
    const contentStr = data.choices?.[0]?.message?.content || '{}'
    const cleanJson = contentStr.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    return {
      ...localResult,
      ...parsed
    }
  } catch (err) {
    clearTimeout(timeoutId)
    return localResult
  }
}

/**
 * Local RegEx Parser cho Báo giá
 */
export function parseQuotationTextLocal(text: string): Partial<QuotationData> {
  const result: Partial<QuotationData> = {
    items: []
  }

  if (!text || !text.trim()) return result

  // Kính gửi / Tên khách hàng
  const khMatch = text.match(/(?:Kính\s*gửi|Khách\s*hàng|Công\s*ty|Đơn\s*vị)[:\s]*([^\n]+)/i)
  if (khMatch) {
    result.ten_khach_hang = khMatch[1].trim()
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const items: QuotationItem[] = []
  let count = 1

  for (const line of lines) {
    // Dán dòng kiểu: "1. Đá 1x2 - M3 - 580.000" hoặc "Cát xây | M3 | 530,000"
    const parts = line.split(/[-|,\t]+/).map((p) => p.trim())
    if (parts.length >= 2) {
      let ten = parts[0].replace(/^[0-9+.\-\s]+/, '').trim()
      let donVi = 'M³'
      let donGia = '0'

      if (parts.length >= 3) {
        donVi = parts[1]
        donGia = parts[2]
      } else if (parts.length === 2) {
        // "Đá 1x2: 580000"
        donGia = parts[1]
      }

      // Format đơn giá với dấu chấm 580000 -> 580.000
      const cleanPriceNumber = donGia.replace(/[^0-9]/g, '')
      if (cleanPriceNumber) {
        donGia = Number(cleanPriceNumber).toLocaleString('vi-VN')
      }

      if (ten) {
        items.push({
          id: String(Date.now() + count),
          stt: String(count).padStart(2, '0'),
          ten_hang: ten,
          don_vi: donVi || 'M³',
          don_gia: donGia || '0'
        })
        count++
      }
    }
  }

  if (items.length > 0) {
    result.items = items
  }

  return result
}

/**
 * AI Parser Báo giá
 */
export async function parseQuotationTextWithAI(rawText: string): Promise<Partial<QuotationData>> {
  const localResult = parseQuotationTextLocal(rawText)
  const apiKey = getSetting('openaiApiKey')

  if (!apiKey || !apiKey.trim().startsWith('sk-')) {
    return localResult
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý bóc tách bảng báo giá sản phẩm tiếng Việt. Trả về đúng 1 JSON object:
{
  "ten_khach_hang": "Tên khách hàng hoặc Công ty",
  "items": [
    { "stt": "01", "ten_hang": "Đá 1x2", "don_vi": "M³", "don_gia": "580.000" }
  ]
}`
          },
          { role: 'user', content: rawText }
        ],
        temperature: 0.1
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return localResult
    }

    const data = await response.json()
    const contentStr = data.choices?.[0]?.message?.content || '{}'
    const cleanJson = contentStr.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleanJson)

    return {
      ...localResult,
      ...parsed
    }
  } catch (err) {
    clearTimeout(timeoutId)
    return localResult
  }
}
