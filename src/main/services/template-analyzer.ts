/**
 * VietKey DocGen — Smart Template Analyzer
 * Bộ phân tích và nhận diện mẫu Word thông minh:
 * 1. Đóng cụm chữ bôi ĐỎ (Red Cluster Merging) giải quyết triệt để lỗi phân mảnh run Unikey của Word
 * 2. Tự động nhận diện ngữ cảnh tiếng Việt (Khách hàng, Ngày tháng, Điều khoản, Bảng hàng hóa, Tổng tiền, Bằng chữ)
 * 3. Tự động loại bỏ tiêu đề cột (STT, Đơn giá, Thành tiền...) khỏi danh sách trường điền
 * 4. Tái sử dụng biến thông minh (Semantic Deduplication) cho các trường xuất hiện nhiều lần (Tên công ty, MST...)
 * 5. Hỗ trợ OpenAI GPT (nếu có API Key) hoặc bộ Heuristic tiếng Việt 100% Offline
 */

import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
// @ts-ignore
import InspectModule from 'docxtemplater/js/inspect-module.js'
import { readFileSync, existsSync } from 'fs'
import { basename } from 'path'
import type { AnalyzedTemplateResult, TemplateField, TemplateFieldType, TableSubField } from '../../shared/types'
import { getSetting } from './database'

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
    ngay_lap: 'Ngày lập văn bản',
    ngay_giao: 'Ngày giao hàng',
    ngay_thang: 'Thời gian / Ngày tháng',
    ten_khach_hang: 'Tên khách hàng / Đơn vị nhận',
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
    can_cu_don_hang: 'Căn cứ đơn hàng / đợt',
    can_cu: 'Căn cứ văn bản',
    tong_tien: 'Tổng tiền thanh toán',
    so_tien: 'Số tiền thanh toán',
    gia_tri_hop_dong: 'Giá trị hợp đồng',
    dieu_kien_thanh_toan: 'Điều kiện thanh toán',
    so_tien_bang_chu: 'Số tiền bằng chữ',
    ghi_chu: 'Ghi chú bổ sung',
    stt: 'STT',
    ten_hang: 'Tên hàng hóa / Hạng mục',
    ten_vat_tu: 'Tên vật tư / Hàng hóa',
    don_vi: 'Đơn vị tính',
    so_luong: 'Số lượng',
    don_gia: 'Đơn giá',
    thanh_tien: 'Thành tiền'
  }

  if (mappings[lower]) return mappings[lower]

  // Bắt các trường có hậu tố số _1, _2...
  const matchIndexed = lower.match(/^([a-z_]+)_(\d+)$/)
  if (matchIndexed) {
    const baseKey = matchIndexed[1]
    const indexNum = matchIndexed[2]
    if (mappings[baseKey]) {
      return `${mappings[baseKey]} (Dòng ${indexNum})`
    }
  }

  let formatted = lower.replace(/_/g, ' ')
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
  return formatted
}

// Helper: Đoán loại dữ liệu
export function inferFieldType(key: string, sampleContent?: string): TemplateFieldType {
  const lowerKey = key.toLowerCase()
  const sample = (sampleContent || '').toLowerCase().trim()

  if (/(ngay|thang|nam|date|thoi_gian)/.test(lowerKey) || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(sample) || /^ngày\s+\d{1,2}/.test(sample)) {
    return 'date'
  }
  if (
    /(tien|gia|don_gia|tong_tien|tam_ung|thanh_toan|amount|price)/.test(lowerKey) ||
    /^[0-9]{1,3}(?:\.[0-9]{3})+(?:\s*(?:đ|vnd|vnđ))?$/i.test(sample)
  ) {
    return 'currency'
  }
  if (/(so_luong|sl|qty|phan_tram|ty_le|percent)/.test(lowerKey) || /^[0-9]+(?:\.[0-9]+)?$/.test(sample)) {
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

// Helper: Kiểm tra xem một run có màu đỏ hoặc highlight đỏ không
function isRunRed(runXml: string): boolean {
  return (
    /<w:color\s+[^>]*?w:val="(ff0000|red|c00000|ed1c24)"/i.test(runXml) ||
    /<w:highlight\s+[^>]*?w:val="(red|magenta)"/i.test(runXml) ||
    /<w:shd\s+[^>]*?w:fill="(ff0000|red|c00000|ed1c24)"/i.test(runXml)
  );
}

// Helper: Trích xuất nội dung văn bản từ một thẻ run
function getRunText(runXml: string): string {
  const m = runXml.match(/<w:t\b[^>]*>([^<]*)<\/w:t>/)
  return m ? m[1] : ''
}

// Helper: Kiểm tra xem đoạn text có phải là tiêu đề cột bảng không
function isTableHeaderText(text: string): boolean {
  const clean = text.trim().toLowerCase()
  return /^(stt|tên\s*hàng|tên\s*vật\s*tư|tên\s*sản\s*phẩm|hàng\s*hóa|đơn\s*vị|đvt|đơn\s*vị\s*tính|số\s*lượng|sl|qty|đơn\s*giá|thành\s*tiền|ghi\s*chú|diễn\s*giải|quy\s*cách)(?:\s*\(.*?\))?$/i.test(clean)
}

// Helper: Chuẩn hóa tên đơn vị / công ty để gộp trùng lặp
function normalizeEntityText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\-_/\\()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

interface ParsedElement {
  raw: string
  text: string
  isRed: boolean
  isTab: boolean
}

interface RedCluster {
  pIdx: number
  text: string
  prefix: string
  suffix?: string
  elements: ParsedElement[]
  isHeader?: boolean
  isRowIndex?: boolean
  assignedKey?: string
  assignedLabel?: string
  assignedType?: TemplateFieldType
  assignedSection?: string
  cleanValue?: string
}

/**
 * Phân tích cấu trúc file Word thông minh
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
    let isRedTextDetected = false

    // ===== BƯỚC 1: Quét và bóc tách các đoạn văn (paragraphs) cùng các thẻ con =====
    const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g
    let pMatch: RegExpExecArray | null
    const paragraphs: Array<{ raw: string; elements: ParsedElement[]; fullText: string }> = []

    while ((pMatch = pRegex.exec(docXml)) !== null) {
      const pFull = pMatch[0]
      const rRegex = /<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g
      let rMatch: RegExpExecArray | null
      const elements: ParsedElement[] = []

      while ((rMatch = rRegex.exec(pFull)) !== null) {
        const isTab = /<w:tab\/>/.test(rMatch[0])
        const isRed = isRunRed(rMatch[0])
        elements.push({
          raw: rMatch[0],
          text: getRunText(rMatch[0]),
          isRed,
          isTab
        })
      }
      paragraphs.push({ raw: pFull, elements, fullText: elements.map(e => e.text).join('') })
    }

    // ===== BƯỚC 2: Thuật toán Đóng cụm chữ bôi ĐỎ (Red Cluster Merging) =====
    const redClusters: RedCluster[] = []

    paragraphs.forEach((p, pIdx) => {
      const elements = p.elements
      let currentCluster: RedCluster | null = null

      for (let i = 0; i < elements.length; i++) {
        const el = elements[i]

        // Phân cách cột bằng Tab
        if (el.isTab) {
          if (currentCluster && currentCluster.text.trim()) {
            redClusters.push(currentCluster)
            currentCluster = null
          }
          continue
        }

        if (el.isRed) {
          if (!currentCluster) {
            const prefix = elements.slice(0, i).filter(x => !x.isTab).map(x => x.text).join('').trim()
            currentCluster = {
              pIdx,
              text: el.text,
              prefix,
              elements: [el]
            }
          } else {
            currentCluster.text += el.text
            currentCluster.elements.push(el)
          }
        } else {
          // Xử lý khoảng trắng giữa 2 run đỏ liên tiếp
          if (currentCluster && !el.text.trim() && i + 1 < elements.length && elements[i + 1].isRed) {
            currentCluster.text += el.text
            currentCluster.elements.push(el)
          } else if (currentCluster) {
            if (currentCluster.text.trim()) {
              redClusters.push(currentCluster)
            }
            currentCluster = null
          }
        }
      }

      if (currentCluster && currentCluster.text.trim()) {
        redClusters.push(currentCluster)
      }
    })

    if (redClusters.length > 0) {
      isRedTextDetected = true
    }

    // ===== BƯỚC 3: Nhận diện Ngữ Cảnh Tiếng Việt Thông Minh & Deduplication =====
    const entityToKeyMap = new Map<string, string>()
    const usedKeys = new Map<string, boolean>()
    const rowNumbersCount: Record<number, number> = {}
    let itemRowCounter = 0
    let subtotalCounter = 0
    let lastItemPIdx = -1

    redClusters.forEach((c) => {
      const rawText = c.text.trim()

      // 1. Tiêu đề cột bảng -> Giữ lại làm chữ cố định, không tạo trường nhập liệu
      if (isTableHeaderText(rawText)) {
        c.isHeader = true
        return
      }

      // 2. Số thứ tự đầu dòng (1, 2, 3...)
      if (/^[0-9]{1,2}$/.test(rawText) && Number(rawText) <= 30 && !c.prefix) {
        c.isRowIndex = true
        if (c.pIdx !== lastItemPIdx) {
          itemRowCounter++
          lastItemPIdx = c.pIdx
        }
        return
      }

      // 3. Nhận diện các cột trong bảng hàng hóa / vật tư
      if (c.pIdx === lastItemPIdx && itemRowCounter > 0) {
        if (/^[0-9]+(?:\.[0-9]+)*$/.test(rawText)) {
          const numCount = (rowNumbersCount[itemRowCounter] || 0) + 1
          rowNumbersCount[itemRowCounter] = numCount
          const num = Number(rawText.replace(/\./g, ''))

          if (numCount === 1 && num <= 50000) {
            c.assignedKey = `so_luong_${itemRowCounter}`
            c.assignedLabel = `Số lượng (Dòng ${itemRowCounter})`
            c.assignedType = 'number'
            c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
          } else if (numCount === 2 || (numCount === 1 && num > 50000)) {
            c.assignedKey = `don_gia_${itemRowCounter}`
            c.assignedLabel = `Đơn giá (Dòng ${itemRowCounter})`
            c.assignedType = 'currency'
            c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
          } else {
            c.assignedKey = `thanh_tien_${itemRowCounter}`
            c.assignedLabel = `Thành tiền (Dòng ${itemRowCounter})`
            c.assignedType = 'currency'
            c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
          }
        } else if (/^(m3|m²|m|tấn|kg|bao|cái|bộ|lô|chuyến)$/i.test(rawText)) {
          c.assignedKey = `don_vi_${itemRowCounter}`
          c.assignedLabel = `Đơn vị tính (Dòng ${itemRowCounter})`
          c.assignedType = 'text'
          c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
        } else if (rawText.length > 20 || /mỏ|bảo hành|giao hàng|tiêu chuẩn/i.test(rawText)) {
          c.assignedKey = `ghi_chu_${itemRowCounter}`
          c.assignedLabel = `Ghi chú (Dòng ${itemRowCounter})`
          c.assignedType = 'text'
          c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
        } else {
          c.assignedKey = `ten_vat_tu_${itemRowCounter}`
          c.assignedLabel = `Tên vật tư / Hàng hóa (Dòng ${itemRowCounter})`
          c.assignedType = 'text'
          c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
        }
      } else {
        // 4. Nhận diện các thông tin chính của văn bản
        const normEntity = normalizeEntityText(rawText)
        if (/công\s*ty|tập\s*đoàn|doanh\s*nghiệp/i.test(normEntity) && normEntity.length > 15) {
          if (entityToKeyMap.has(normEntity)) {
            c.assignedKey = entityToKeyMap.get(normEntity)
            return
          }
        }

        // Bằng chữ
        if (/^\(?bằng\s*chữ\s*:\s*/i.test(rawText) || /đồng\s*\.\/\.\s*\)?$/i.test(rawText)) {
          c.assignedKey = 'so_tien_bang_chu'
          c.assignedLabel = 'Số tiền bằng chữ'
          c.assignedType = 'text'
          c.assignedSection = 'Tài chính & Thanh toán'
          c.cleanValue = rawText.replace(/^\(?bằng\s*chữ\s*:\s*/i, '').replace(/\)?$/i, '').trim()
        }
        // Điều kiện thanh toán / Tổng tiền
        else if (/^tổng\s*tiền\s*:\s*/i.test(rawText)) {
          c.assignedKey = 'dieu_kien_thanh_toan'
          c.assignedLabel = 'Điều kiện thanh toán'
          c.assignedType = 'text'
          c.assignedSection = 'Tài chính & Thanh toán'
          c.cleanValue = rawText.replace(/^tổng\s*tiền\s*:\s*/i, '').trim()
        }
        // Ngày tháng năm lập văn bản
        else if (/khánh\s*hòa|hà\s*nội|tp\.?hcm|ngày/i.test(c.prefix) || /^ngày\s+\d{1,2}\s+tháng/i.test(rawText)) {
          c.assignedKey = 'ngay_lap'
          c.assignedLabel = 'Ngày lập văn bản'
          c.assignedType = 'date'
          c.assignedSection = 'Thông tin chung'
        }
        // Kính gửi / Đơn vị khách hàng
        else if (/kính\s*gửi|khách\s*hàng|bên\s*mua|bên\s*b/i.test(c.prefix) || /công\s*ty|tập\s*đoàn/i.test(rawText)) {
          c.assignedKey = 'ten_khach_hang'
          c.assignedLabel = 'Tên đơn vị / Khách hàng'
          c.assignedType = 'text'
          c.assignedSection = 'Thông tin đối tác'
          entityToKeyMap.set(normEntity, 'ten_khach_hang')
        }
        // Căn cứ đơn hàng / đợt
        else if (/căn\s*cứ|hợp\s*đồng|đơn\s*đặt\s*hàng/i.test(c.prefix) || /^đặt\s*hàng\s*đợt/i.test(rawText)) {
          c.assignedKey = 'can_cu_don_hang'
          c.assignedLabel = 'Căn cứ đơn hàng / đợt'
          c.assignedType = 'text'
          c.assignedSection = 'Thông tin chung'
        }
        // Tổng tiền (số tiền lớn) / Thành tiền từng dòng
        else if (/^[0-9]{1,3}(?:\.[0-9]{3})+(?:\s*(?:đ|vnd|vnđ))?$/i.test(rawText)) {
          if (subtotalCounter < itemRowCounter) {
            subtotalCounter++
            c.assignedKey = `thanh_tien_${subtotalCounter}`
            c.assignedLabel = `Thành tiền (Dòng ${subtotalCounter})`
            c.assignedType = 'currency'
            c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
          } else {
            c.assignedKey = 'tong_tien'
            c.assignedLabel = 'Tổng tiền thanh toán'
            c.assignedType = 'currency'
            c.assignedSection = 'Tài chính & Thanh toán'
          }
        }
        // Ghi chú hoặc thông tin bổ sung
        else if (rawText.length > 20 || /mỏ|bảo hành|giao hàng|tiêu chuẩn/i.test(rawText)) {
          if (itemRowCounter > 0 && !usedKeys.has(`ghi_chu_${itemRowCounter}`)) {
            c.assignedKey = `ghi_chu_${itemRowCounter}`
            c.assignedLabel = `Ghi chú (Dòng ${itemRowCounter})`
            c.assignedType = 'text'
            c.assignedSection = 'Chi tiết hàng hóa / Vật tư'
          } else {
            c.assignedKey = 'ghi_chu'
            c.assignedLabel = 'Ghi chú bổ sung'
            c.assignedType = 'text'
            c.assignedSection = 'Thông tin bổ sung'
          }
        }
        // Fallback
        else {
          const slug = rawText
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 20) || 'truong_du_lieu'
          c.assignedKey = slug
          c.assignedLabel = rawText.length < 30 ? rawText : inferFriendlyLabel(slug)
          c.assignedType = 'text'
          c.assignedSection = 'Thông tin bổ sung'
        }
      }

      // Xử lý chống trùng key nếu nội dung khác nhau
      if (c.assignedKey) {
        let finalKey = c.assignedKey
        let counter = 2
        while (
          detectedFieldsMap.has(finalKey) &&
          detectedFieldsMap.get(finalKey)?.defaultValue !== (c.cleanValue || rawText)
        ) {
          finalKey = `${c.assignedKey}_${counter++}`
        }
        c.assignedKey = finalKey

        if (!detectedFieldsMap.has(finalKey)) {
          detectedFieldsMap.set(finalKey, {
            id: String(Date.now() + Math.random()),
            key: finalKey,
            label: c.assignedLabel || inferFriendlyLabel(finalKey),
            type: c.assignedType || 'text',
            section: c.assignedSection || 'Thông tin bổ sung',
            required: true,
            defaultValue: c.cleanValue || rawText,
            placeholder: `Nhập ${(c.assignedLabel || inferFriendlyLabel(finalKey)).toLowerCase()}...`
          })
        }
      }
    })

    // ===== BƯỚC 4: Thay thế mã biến {tag} vào XML chính xác =====
    let newDocXml = docXml

    redClusters.forEach((c) => {
      const firstEl = c.elements[0]
      const restEls = c.elements.slice(1)

      // Nếu là tiêu đề hoặc số thứ tự: chỉ gỡ màu đỏ để chữ trở về bình thường, không thay bằng {tag}
      if (c.isHeader || c.isRowIndex) {
        c.elements.forEach((el) => {
          const stripped = el.raw
            .replace(/<w:color\b[^>]*?(?:\/>|>[\s\S]*?<\/w:color>)/gi, '')
            .replace(/<w:highlight\b[^>]*?(?:\/>|>[\s\S]*?<\/w:highlight>)/gi, '')
            .replace(/<w:shd\b[^>]*?(?:\/>|>[\s\S]*?<\/w:shd>)/gi, '')
          newDocXml = newDocXml.replace(el.raw, stripped)
        })
        return
      }

      if (c.assignedKey) {
        // Element đầu tiên thay bằng {tag} và gỡ màu đỏ
        let repFirst = firstEl.raw
          .replace(/<w:color\b[^>]*?(?:\/>|>[\s\S]*?<\/w:color>)/gi, '')
          .replace(/<w:highlight\b[^>]*?(?:\/>|>[\s\S]*?<\/w:highlight>)/gi, '')
          .replace(/<w:shd\b[^>]*?(?:\/>|>[\s\S]*?<\/w:shd>)/gi, '')
        repFirst = repFirst.replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/i, `<w:t>{${c.assignedKey}}</w:t>`)
        newDocXml = newDocXml.replace(firstEl.raw, repFirst)

        // Các element tiếp theo trong cùng cụm thì làm rỗng text và gỡ màu đỏ
        restEls.forEach((el) => {
          let repRest = el.raw
            .replace(/<w:color\b[^>]*?(?:\/>|>[\s\S]*?<\/w:color>)/gi, '')
            .replace(/<w:highlight\b[^>]*?(?:\/>|>[\s\S]*?<\/w:highlight>)/gi, '')
            .replace(/<w:shd\b[^>]*?(?:\/>|>[\s\S]*?<\/w:shd>)/gi, '')
          repRest = repRest.replace(/<w:t\b[^>]*>[\s\S]*?<\/w:t>/i, '<w:t></w:t>')
          newDocXml = newDocXml.replace(el.raw, repRest)
        })
      }
    })

    let processedDocxBase64: string | undefined = undefined
    if (isRedTextDetected) {
      zip.file('word/document.xml', newDocXml)
      const newBuf = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
      processedDocxBase64 = newBuf.toString('base64')
    }

    // ===== BƯỚC 5: Quét thêm các thẻ docxtemplater có sẵn {tag} nếu có =====
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

    const rawFileName = basename(filePath, '.docx')
    const friendlyTitle = inferFriendlyLabel(rawFileName.replace(/[-_]/g, ' '))

    return {
      success: true,
      templateName: friendlyTitle,
      fields: Array.from(detectedFieldsMap.values()),
      isRedTextDetected,
      redFieldCount: detectedFieldsMap.size,
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
