import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
// @ts-ignore
import InspectModule from 'docxtemplater/js/inspect-module.js'
import { readFileSync, existsSync } from 'fs'
import { basename } from 'path'
import type { AnalyzedTemplateResult, TemplateField, TemplateFieldType, TableSubField } from '../../shared/types'

// Helper: Chuyển đổi chuỗi không dấu / snake_case sang Tiếng Việt có dấu thân thiện
export function inferFriendlyLabel(key: string): string {
  const lower = key.toLowerCase().trim()
  const mappings: Record<string, string> = {
    so_hd: 'Số hợp đồng',
    so_hop_dong: 'Số hợp đồng',
    ngay: 'Ngày',
    thang: 'Tháng',
    nam: 'Năm',
    ngay_ky: 'Ngày ký',
    ngay_lap: 'Ngày lập',
    ngay_giao: 'Ngày giao hàng',
    ten_khach_hang: 'Tên khách hàng / Đối tác',
    ten_cong_ty: 'Tên công ty',
    dia_chi: 'Địa chỉ',
    mst: 'Mã số thuế',
    dai_dien: 'Người đại diện',
    chuc_vu: 'Chức vụ',
    tai_khoan: 'Số tài khoản ngân hàng',
    ngan_hang: 'Ngân hàng',
    so_dien_thoai: 'Số điện thoại',
    sdt: 'Số điện thoại',
    email: 'Địa chỉ Email',
    noi_dung: 'Nội dung thực hiện',
    noi_dung_mua_ban: 'Nội dung mua bán',
    tong_tien: 'Tổng số tiền',
    so_tien: 'Số tiền thanh toán',
    gia_tri_hop_dong: 'Giá trị hợp đồng',
    so_tien_bang_chu: 'Số tiền bằng chữ',
    ghi_chu: 'Ghi chú bổ sung',
    stt: 'STT',
    ten_hang: 'Tên hàng hóa / Hạng mục',
    don_vi: 'Đơn vị tính',
    so_luong: 'Số lượng',
    don_gia: 'Đơn giá (VNĐ)',
    thanh_tien: 'Thành tiền (VNĐ)'
  }

  if (mappings[lower]) return mappings[lower]

  // Tách snake_case hoặc camelCase
  let formatted = lower.replace(/_/g, ' ')
  // Viết hoa chữ cái đầu
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  return formatted
}

// Helper: Đoán loại dữ liệu từ tên trường hoặc nội dung mẫu
export function inferFieldType(key: string, sampleContent?: string): TemplateFieldType {
  const lowerKey = key.toLowerCase()
  const sample = (sampleContent || '').toLowerCase().trim()

  if (/(ngay|thang|nam|date|thoi_gian)/.test(lowerKey) || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(sample)) {
    return 'date'
  }
  if (/(tien|gia|don_gia|tong_tien|tam_ung|thanh_toan|amount|price)/.test(lowerKey) || /[0-9.,]+\s*(đ|vnd|vnđ)/.test(sample)) {
    return 'currency'
  }
  if (/(so_luong|sl|qty|phan_tram|ty_le|percent)/.test(lowerKey)) {
    return 'number'
  }
  if (/(noi_dung|ghi_chu|mo_ta|dieu_khoan|pham_vi|content|desc)/.test(lowerKey) || sample.length > 50) {
    return 'textarea'
  }
  if (/(xung_danh|gioi_tinh)/.test(lowerKey)) {
    return 'select'
  }
  return 'text'
}

// Helper: Phân tích ngữ cảnh đoạn văn xung quanh từ bôi đỏ
export function analyzeRedContext(
  prefix: string,
  redText: string,
  suffix: string,
  immediatePrefix: string = ''
): { key: string; label: string; type: TemplateFieldType; section: string } {
  const cleanRed = redText.trim()
  const pref = (immediatePrefix + ' ' + prefix).toLowerCase()
  const suf = suffix.toLowerCase()

  // 1. Chức vụ (kiểm tra trước Đại diện vì hay nằm ngay sau đại diện trên cùng đoạn)
  if (/chức\s*vụ|vị\s*trí|title|position/i.test(pref)) {
    return {
      key: 'chuc_vu',
      label: 'Chức vụ',
      type: 'text',
      section: 'Thông tin đại diện'
    }
  }

  // 2. Đại diện / Người ký
  if (/đại\s*diện|người\s*đại\s*diện/i.test(pref) || /^(ông|bà)\b/i.test(cleanRed)) {
    return {
      key: 'dai_dien',
      label: 'Người đại diện',
      type: 'text',
      section: 'Thông tin đại diện'
    }
  }

  // 3. Tên khách hàng / Công ty
  if (/kính\s*gửi|khách\s*hàng|bên\s*mua|bên\s*b|bên\s*a|đơn\s*vị\s*nhận|tên\s*công\s*ty/i.test(pref)) {
    return {
      key: 'ten_khach_hang',
      label: 'Tên khách hàng / Đơn vị',
      type: 'text',
      section: 'Thông tin đối tác'
    }
  }

  // 4. Mã số thuế
  if (/mã\s*số\s*thuế|mst/i.test(pref)) {
    return {
      key: 'mst',
      label: 'Mã số thuế (MST)',
      type: 'text',
      section: 'Thông tin pháp lý'
    }
  }

  // 5. Địa chỉ
  if (/địa\s*chỉ|trụ\s*sở/i.test(pref)) {
    return {
      key: 'dia_chi',
      label: 'Địa chỉ trụ sở',
      type: 'text',
      section: 'Thông tin pháp lý'
    }
  }

  // 6. Số tài khoản
  if (/tài\s*khoản|stk|ngân\s*hàng/i.test(pref)) {
    return {
      key: 'tai_khoan',
      label: 'Số tài khoản ngân hàng',
      type: 'text',
      section: 'Thông tin thanh toán'
    }
  }

  // 7. Số điện thoại / Hotline
  if (/điện\s*thoại|sđt|hotline|tel|phone/i.test(pref)) {
    return {
      key: 'so_dien_thoai',
      label: 'Số điện thoại',
      type: 'text',
      section: 'Thông tin liên hệ'
    }
  }

  // 8. Số hợp đồng / văn bản
  if (/số\s*hợp\s*đồng|số\s*hđ|hợp\s*đồng\s*số|số\s*biên\s*bản|số\s*báo\s*giá|số\s*đề\s*nghị|số:/i.test(pref)) {
    return {
      key: 'so_hd',
      label: 'Số hợp đồng / Mã văn bản',
      type: 'text',
      section: 'Thông tin chung'
    }
  }

  // 9. Số tiền / Giá trị thanh toán
  if (
    /số\s*tiền|tổng\s*tiền|giá\s*trị|đơn\s*giá|tạm\s*ứng|thanh\s*toán|kinh\s*phí/i.test(pref) ||
    /[0-9.,]+\s*(đ|vnd|vnđ)/i.test(cleanRed) ||
    /(đ|vnd|vnđ|đồng)\b/i.test(suf)
  ) {
    return {
      key: 'so_tien',
      label: 'Số tiền / Giá trị',
      type: 'currency',
      section: 'Tài chính'
    }
  }

  // 10. Ngày tháng
  if (/ngày|tháng|năm|thời\s*gian/i.test(pref) || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(cleanRed)) {
    return {
      key: 'ngay_thang',
      label: 'Thời gian / Ngày tháng',
      type: 'date',
      section: 'Thời gian'
    }
  }

  // 11. Nội dung dài
  if (/nội\s*dung|ghi\s*chú|phạm\s*vi|mô\s*tả|yêu\s*cầu/i.test(pref) || cleanRed.length > 50) {
    return {
      key: 'noi_dung',
      label: 'Nội dung thực hiện',
      type: 'textarea',
      section: 'Nội dung'
    }
  }

  // Fallback: Tạo key dựa trên chữ đỏ không dấu
  const safeSlug =
    cleanRed
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 20) || 'truong_du_lieu'

  return {
    key: safeSlug,
    label: cleanRed.length < 25 ? cleanRed : inferFriendlyLabel(safeSlug),
    type: inferFieldType(safeSlug, cleanRed),
    section: 'Thông tin bổ sung'
  }
}

/**
 * Hàm phân tích file Word:
 * - Chế độ 1: Dò tìm các cụm văn bản màu đỏ (hoặc highlight đỏ) theo yêu cầu thông minh của người dùng
 * - Chế độ 2: Dò tìm các thẻ chuẩn docxtemplater {tag}, {{tag}}, [tag] và bảng lặp {#loop}
 */
export async function analyzeDocxTemplate(filePath: string): Promise<AnalyzedTemplateResult> {
  try {
    if (!existsSync(filePath)) {
      return {
        success: false,
        error: `Không tìm thấy file Word tại: ${filePath}`,
        templateName: '',
        fields: [],
        isRedTextDetected: false,
        redFieldCount: 0,
        normalTagCount: 0,
        hasTable: false
      }
    }

    const fileBuffer = readFileSync(filePath)
    const zip = new PizZip(fileBuffer)
    const docXmlFile = zip.file('word/document.xml')
    if (!docXmlFile) {
      return {
        success: false,
        error: 'File Word không hợp lệ (thiếu word/document.xml).',
        templateName: basename(filePath, '.docx'),
        fields: [],
        isRedTextDetected: false,
        redFieldCount: 0,
        normalTagCount: 0,
        hasTable: false
      }
    }

    let docXml = docXmlFile.asText()
    const detectedFieldsMap = new Map<string, TemplateField>()
    let redFieldCount = 0
    let isRedTextDetected = false

    // ===== BƯỚC 1: Quét các đoạn văn bản bôi ĐỎ trong Word =====
    docXml = docXml.replace(/<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g, (pFull) => {
      // Quét tất cả các run <w:r> trong paragraph
      const runRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
      const runs: Array<{ raw: string; text: string; isRed: boolean }> = []
      let rMatch: RegExpExecArray | null

      while ((rMatch = runRegex.exec(pFull)) !== null) {
        const runContent = rMatch[1]
        const colorMatch = runContent.match(/<w:color\s+[^>]*?w:val="([^"]+)"/i)
        const highlightMatch = runContent.match(/<w:highlight\s+[^>]*?w:val="([^"]+)"/i)
        const textMatch = runContent.match(/<w:t\b[^>]*>([^<]*)<\/w:t>/)
        const text = textMatch ? textMatch[1] : ''
        const color = colorMatch ? colorMatch[1].toLowerCase() : ''
        const highlight = highlightMatch ? highlightMatch[1].toLowerCase() : ''

        // Các mã màu đỏ chuẩn trong Microsoft Word: FF0000, red, C00000, ED1C24, hoặc highlight red
        const isRed = /^(ff0000|red|c00000|ed1c24)$/i.test(color) || highlight === 'red'
        runs.push({ raw: rMatch[0], text, isRed })
      }

      let modifiedParagraph = pFull

      // Xử lý các run màu đỏ tìm thấy
      for (let i = 0; i < runs.length; i++) {
        if (runs[i].isRed && runs[i].text.trim()) {
          isRedTextDetected = true
          redFieldCount++

          const prefix = runs.slice(Math.max(0, i - 2), i).map((r) => r.text).join('').trim()
          const suffix = runs.slice(i + 1, i + 3).map((r) => r.text).join('').trim()
          const immediatePrefix = runs[i - 1]?.text || ''
          const analysis = analyzeRedContext(prefix, runs[i].text, suffix, immediatePrefix)

          // Đảm bảo key không bị trùng lặp, nếu trùng thì thêm hậu tố _2, _3
          let finalKey = analysis.key
          let counter = 2
          while (detectedFieldsMap.has(finalKey) && detectedFieldsMap.get(finalKey)?.defaultValue !== runs[i].text.trim()) {
            finalKey = `${analysis.key}_${counter++}`
          }

          if (!detectedFieldsMap.has(finalKey)) {
            detectedFieldsMap.set(finalKey, {
              id: String(Date.now() + Math.random()),
              key: finalKey,
              label: analysis.label,
              type: analysis.type,
              section: analysis.section,
              required: true,
              defaultValue: runs[i].text.trim(),
              placeholder: `Nhập ${analysis.label.toLowerCase()}...`
            })
          }

          // Thay thế đoạn run màu đỏ trong XML bằng thẻ {finalKey} màu bình thường
          const replacementRun = runs[i].raw
            .replace(/<w:color\b[^>]*?(?:\/>|>[\s\S]*?<\/w:color>)/gi, '')
            .replace(/<w:highlight\b[^>]*?(?:\/>|>[\s\S]*?<\/w:highlight>)/gi, '')
            .replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/gi, `<w:t>{${finalKey}}</w:t>`)

          modifiedParagraph = modifiedParagraph.replace(runs[i].raw, replacementRun)
        }
      }

      return modifiedParagraph
    })

    let processedDocxBase64: string | undefined = undefined
    if (isRedTextDetected) {
      zip.file('word/document.xml', docXml)
      const newBuf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
      processedDocxBase64 = newBuf.toString('base64')
    }

    // ===== BƯỚC 2: Quét các thẻ có sẵn qua InspectModule =====
    let normalTagCount = 0
    let hasTable = false

    try {
      const inspectZip = isRedTextDetected ? new PizZip(Buffer.from(processedDocxBase64!, 'base64')) : zip
      const iModule = InspectModule()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const doc = new Docxtemplater(inspectZip, {
        paragraphLoop: true,
        linebreaks: true,
        modules: [iModule]
      })

      const structured = iModule.getAllStructuredTags() || []
      for (const tag of structured) {
        if (tag.type === 'placeholder' && !tag.module) {
          const val = String(tag.value || '').trim()
          if (val && !detectedFieldsMap.has(val)) {
            normalTagCount++
            const fieldType = inferFieldType(val)
            detectedFieldsMap.set(val, {
              id: String(Date.now() + Math.random()),
              key: val,
              label: inferFriendlyLabel(val),
              type: fieldType,
              section: val.startsWith('bena_') ? 'Thông tin Bên A' : val.startsWith('benb_') ? 'Thông tin Bên B' : 'Thông tin văn bản',
              required: true,
              placeholder: `Nhập ${inferFriendlyLabel(val).toLowerCase()}...`
            })
          }
        } else if (tag.module === 'loop' || tag.type === 'loop') {
          hasTable = true
          const loopKey = String(tag.value || '').trim() || 'items'
          const subFields: TableSubField[] = (tag.subparsed || []).map((sub: any) => {
            const subVal = String(sub.value || '').trim()
            return {
              key: subVal,
              label: inferFriendlyLabel(subVal),
              type: inferFieldType(subVal) === 'currency' ? 'currency' : inferFieldType(subVal) === 'number' ? 'number' : 'text'
            }
          })

          detectedFieldsMap.set(loopKey, {
            id: String(Date.now() + Math.random()),
            key: loopKey,
            label: inferFriendlyLabel(loopKey) + ' (Bảng danh sách)',
            type: 'table',
            section: 'Bảng danh sách dữ liệu',
            required: false,
            subFields: subFields.length > 0 ? subFields : [
              { key: 'stt', label: 'STT', type: 'text' },
              { key: 'ten_hang', label: 'Tên hàng / Hạng mục', type: 'text' },
              { key: 'don_vi', label: 'Đơn vị', type: 'text' },
              { key: 'don_gia', label: 'Đơn giá', type: 'currency' }
            ]
          })
        }
      }
    } catch (inspectErr) {
      console.warn('Lỗi phân tích thẻ docxtemplater thông thường:', inspectErr)
    }

    // Tên gợi ý cho template từ file gốc
    const rawFileName = basename(filePath, '.docx')
    const friendlyTitle = inferFriendlyLabel(rawFileName.replace(/[-_]/g, ' '))

    return {
      success: true,
      templateName: friendlyTitle,
      fields: Array.from(detectedFieldsMap.values()),
      isRedTextDetected,
      redFieldCount,
      normalTagCount,
      hasTable,
      processedDocxBase64
    }
  } catch (err: any) {
    console.error('Lỗi khi phân tích template Word:', err)
    return {
      success: false,
      error: err.message || 'Lỗi không xác định khi phân tích file Word.',
      templateName: basename(filePath, '.docx'),
      fields: [],
      isRedTextDetected: false,
      redFieldCount: 0,
      normalTagCount: 0,
      hasTable: false
    }
  }
}
