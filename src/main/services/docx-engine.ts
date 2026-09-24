import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { app } from 'electron'
import type { ContractData, QuotationData, AdvanceRequestData } from '../../shared/types'

// Helper: Tách danh xưng (Ông/Bà) và chuẩn hóa tên viết hoa toàn bộ
export function formatRepresentativeName(
  inputName: string,
  defaultPrefix: 'Ông' | 'Bà' = 'Ông'
): { prefix: 'Ông' | 'Bà'; name: string } {
  let name = (inputName || '').trim()
  let prefix: 'Ông' | 'Bà' = defaultPrefix

  if (/^bà\s+/i.test(name)) {
    prefix = 'Bà'
    name = name.replace(/^bà\s+/i, '').trim()
  } else if (/^ông\s+/i.test(name)) {
    prefix = 'Ông'
    name = name.replace(/^ông\s+/i, '').trim()
  }

  return {
    prefix,
    name: name.toUpperCase()
  }
}

/**
 * Tìm đường dẫn file template chuẩn xác:
 * 1. Ưu tiên mẫu tùy biến người dùng (User Templates) tại VietKey_Data/Templates/
 * 2. Mẫu mặc định hệ thống (System Templates) đóng gói cùng ứng dụng
 */
export function resolveTemplatePath(fileName: string): string | null {
  // 1. Kiểm tra mẫu người dùng trong VietKey_Data/Templates
  try {
    const userTplDir = join(homedir(), 'VietKey_Data', 'Templates')
    const userTplPath = join(userTplDir, fileName)
    if (existsSync(userTplPath)) return userTplPath
  } catch {
    // ignore
  }

  // 2. Mẫu hệ thống mặc định đi kèm bản cài
  const candidatePaths = [
    process.resourcesPath ? join(process.resourcesPath, 'templates', fileName) : '',
    app?.getAppPath ? join(app.getAppPath(), 'templates', fileName) : '',
    join(process.cwd(), 'templates', fileName),
    join(__dirname, '..', '..', 'templates', fileName),
    join(__dirname, '..', 'templates', fileName)
  ].filter(Boolean)

  const found = candidatePaths.find((p) => existsSync(p))
  return found || null
}

// ===== In-Memory Binary Template Cache (Tối ưu hiệu năng nạp mẫu) =====
interface TemplateCacheEntry {
  mtimeMs: number
  buffer: Buffer
}

const templateBinaryCache = new Map<string, TemplateCacheEntry>()

export function getCachedTemplateBuffer(filePath: string): Buffer {
  try {
    const stats = statSync(filePath)
    const cached = templateBinaryCache.get(filePath)
    if (cached && cached.mtimeMs === stats.mtimeMs) {
      return cached.buffer
    }
    const buf = readFileSync(filePath)
    templateBinaryCache.set(filePath, { mtimeMs: stats.mtimeMs, buffer: buf })
    return buf
  } catch {
    const buf = readFileSync(filePath)
    return buf
  }
}

export function invalidateTemplateCache(filePath?: string): void {
  if (filePath) {
    templateBinaryCache.delete(filePath)
  } else {
    templateBinaryCache.clear()
  }
}

// ===== 1. Render Buffer Hợp đồng nguyên tắc =====
export function renderContractDocxBuffer(
  data: ContractData
): { success: boolean; buffer?: Buffer; error?: string } {
  try {
    const templatePath = resolveTemplatePath('HopDongNguyenTac.docx')
    if (!templatePath) {
      return { success: false, error: 'Không tìm thấy template HopDongNguyenTac.docx trong hệ thống.' }
    }

    const benaFormatted = formatRepresentativeName(
      data.bena_dai_dien,
      data.bena_xung_danh || 'Ông'
    )
    const benbFormatted = formatRepresentativeName(
      data.benb_dai_dien,
      data.benb_xung_danh || 'Bà'
    )

    const content = getCachedTemplateBuffer(templatePath)
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    doc.render({
      so_hd: data.so_hd || '',
      ngay: data.ngay || '',
      thang: data.thang || '',
      nam: data.nam || '',
      noi_dung_mua_ban: data.noi_dung_mua_ban || 'mua bán vật tư, vật liệu xây dựng',

      bena_xung_danh: benaFormatted.prefix,
      bena_ten_cong_ty: (data.bena_ten_cong_ty || '').toUpperCase(),
      bena_dai_dien: benaFormatted.name,
      bena_chuc_vu: data.bena_chuc_vu || 'Giám đốc',
      bena_dia_chi: data.bena_dia_chi || '',
      bena_tai_khoan: data.bena_tai_khoan || '',
      bena_mst: data.bena_mst || '',

      benb_xung_danh: benbFormatted.prefix,
      benb_ten_cong_ty: (data.benb_ten_cong_ty || '').toUpperCase(),
      benb_dai_dien: benbFormatted.name,
      benb_chuc_vu: data.benb_chuc_vu || 'Giám đốc',
      benb_dia_chi: data.benb_dia_chi || '',
      benb_tai_khoan: data.benb_tai_khoan || '',
      benb_mst: data.benb_mst || ''
    })

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
    return { success: true, buffer: buf }
  } catch (err: any) {
    console.error('Error rendering Contract buffer:', err)
    return { success: false, error: err.message || 'Lỗi không xác định khi tạo buffer Hợp đồng.' }
  }
}

export function generateContractDocx(
  data: ContractData,
  targetPath: string
): { success: boolean; error?: string } {
  const res = renderContractDocxBuffer(data)
  if (!res.success || !res.buffer) {
    return { success: false, error: res.error }
  }
  try {
    writeFileSync(targetPath, res.buffer)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ===== 2. Render Buffer Báo giá =====
export function renderQuotationDocxBuffer(
  data: QuotationData
): { success: boolean; buffer?: Buffer; error?: string } {
  try {
    const isWithNotes = Boolean(data.co_ghi_chu)
    const templateFileName = isWithNotes ? 'BaoGia_CoGhiChu.docx' : 'BaoGia.docx'

    const templatePath = resolveTemplatePath(templateFileName)
    if (!templatePath) {
      return { success: false, error: `Không tìm thấy template ${templateFileName} trong hệ thống.` }
    }

    const content = getCachedTemplateBuffer(templatePath)
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    const formattedItems = (data.items || []).map((item, idx) => ({
      stt: item.stt || String(idx + 1).padStart(2, '0'),
      ten_hang: item.ten_hang || '',
      ghi_chu: item.ghi_chu || '',
      don_vi: item.don_vi || 'M³',
      don_gia: (item.don_gia_sau_tang && item.don_gia_sau_tang.trim() !== '') ? item.don_gia_sau_tang : (item.don_gia || '0')
    }))

    doc.render({
      ngay: data.ngay || '',
      thang: data.thang || '',
      nam: data.nam || '',
      ten_khach_hang: data.ten_khach_hang || 'Quý khách hàng!',
      items: formattedItems
    })

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
    return { success: true, buffer: buf }
  } catch (err: any) {
    console.error('Error rendering Quotation buffer:', err)
    return { success: false, error: err.message || 'Lỗi không xác định khi tạo buffer Báo giá.' }
  }
}

export function generateQuotationDocx(
  data: QuotationData,
  targetPath: string
): { success: boolean; error?: string } {
  const res = renderQuotationDocxBuffer(data)
  if (!res.success || !res.buffer) {
    return { success: false, error: res.error }
  }
  try {
    writeFileSync(targetPath, res.buffer)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ===== 3. Render Buffer Đề nghị Tạm ứng =====
export function renderAdvanceRequestDocxBuffer(
  data: AdvanceRequestData
): { success: boolean; buffer?: Buffer; error?: string } {
  try {
    const templatePath = resolveTemplatePath('DeNghiTamUng.docx')
    if (!templatePath) {
      return { success: false, error: 'Không tìm thấy template DeNghiTamUng.docx trong hệ thống.' }
    }

    const content = getCachedTemplateBuffer(templatePath)
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    const clientCompanyUpper = (data.ten_cong_ty_khach || '').toUpperCase()

    const rawTotal = data.tong_tien || data.gia_tri_tam_ung || '0'
    const totalFormatted = rawTotal ? (rawTotal.includes('₫') ? rawTotal : `${rawTotal} ₫`) : '0 ₫'

    const items = (data.items && data.items.length > 0)
      ? data.items.map((it, idx) => {
          const qtyNum = typeof it.so_luong === 'number' ? it.so_luong : Number(String(it.so_luong || '').replace(/[^0-9]/g, ''))
          const priceNum = typeof it.don_gia === 'number' ? it.don_gia : Number(String(it.don_gia || '').replace(/[^0-9]/g, ''))
          let subtotalStr = it.thanh_tien
          if (!subtotalStr && qtyNum && priceNum) {
            subtotalStr = (qtyNum * priceNum).toLocaleString('vi-VN')
          }
          const formattedSubtotal = subtotalStr
            ? (String(subtotalStr).includes('₫') ? String(subtotalStr) : `${subtotalStr} ₫`)
            : ''

          return {
            stt: it.stt || idx + 1,
            ten_vat_tu: it.ten_vat_tu || '',
            don_vi: it.don_vi || 'M3',
            so_luong: typeof it.so_luong === 'number' ? it.so_luong.toLocaleString('vi-VN') : (it.so_luong || ''),
            don_gia: typeof it.don_gia === 'number' ? it.don_gia.toLocaleString('vi-VN') : (it.don_gia || ''),
            thanh_tien: formattedSubtotal,
            ghi_chu: it.ghi_chu || ''
          }
        })
      : [
          {
            stt: 1,
            ten_vat_tu: data.noi_dung_cung_cap || 'VLXD các loại',
            don_vi: 'Lô',
            so_luong: '1',
            don_gia: totalFormatted,
            thanh_tien: totalFormatted,
            ghi_chu: ''
          }
        ]

    let wordsText = data.so_tien_bang_chu || 'Không đồng'
    if (wordsText && !wordsText.endsWith('./.') && !wordsText.endsWith('.')) {
      wordsText += './.'
    }

    doc.render({
      ngay: data.ngay || '',
      thang: data.thang || '',
      nam: data.nam || '',
      ten_cong_ty_khach: clientCompanyUpper,
      noi_dung_cung_cap: data.noi_dung_cung_cap || 'đá các loại',
      dot_tam_ung: data.dot_tam_ung || '1',
      ngay_don_hang: data.ngay_don_hang || data.ngay || '',
      thang_don_hang: data.thang_don_hang || data.thang || '',
      nam_don_hang: data.nam_don_hang || data.nam || '',
      items,
      dieu_kien_thanh_toan: data.dieu_kien_thanh_toan || 'Thanh toán trước 100% đơn hàng',
      tong_tien: totalFormatted,
      so_tien_bang_chu: wordsText,
      // Backward-compatible fields
      gia_tri_don_hang: data.gia_tri_don_hang || data.tong_tien || '0',
      gia_tri_tam_ung: data.gia_tri_tam_ung || data.tong_tien || '0'
    })

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
    return { success: true, buffer: buf }
  } catch (err: any) {
    console.error('Error rendering Advance Request buffer:', err)
    return { success: false, error: err.message || 'Lỗi không xác định khi tạo buffer Đề nghị Tạm ứng.' }
  }
}

export function generateAdvanceRequestDocx(
  data: AdvanceRequestData,
  targetPath: string
): { success: boolean; error?: string } {
  const res = renderAdvanceRequestDocxBuffer(data)
  if (!res.success || !res.buffer) {
    return { success: false, error: res.error }
  }
  try {
    writeFileSync(targetPath, res.buffer)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ===== 4. Render Buffer Mẫu Tùy Biến (Custom Dynamic Template) =====
export function renderCustomDocxBuffer(
  templateFilePath: string,
  data: Record<string, any>
): { success: boolean; buffer?: Buffer; error?: string } {
  try {
    if (!existsSync(templateFilePath)) {
      return { success: false, error: `Không tìm thấy file mẫu tại: ${templateFilePath}` }
    }

    const content = getCachedTemplateBuffer(templateFilePath)
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    const renderData: Record<string, any> = { ...data }
    for (const key of Object.keys(renderData)) {
      if (Array.isArray(renderData[key])) {
        renderData[key] = renderData[key].map((item: any, idx: number) => {
          if (typeof item === 'object' && item !== null) {
            return {
              stt: item.stt || String(idx + 1).padStart(2, '0'),
              ...item
            }
          }
          return item
        })
      }
    }

    doc.render(renderData)

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
    return { success: true, buffer: buf }
  } catch (err: any) {
    console.error('Error rendering Custom Template buffer:', err)
    return { success: false, error: err.message || 'Lỗi không xác định khi tạo buffer Word tùy biến.' }
  }
}

export function generateCustomDocx(
  templateFilePath: string,
  data: Record<string, any>,
  targetPath: string
): { success: boolean; error?: string } {
  const res = renderCustomDocxBuffer(templateFilePath, data)
  if (!res.success || !res.buffer) {
    return { success: false, error: res.error }
  }
  try {
    writeFileSync(targetPath, res.buffer)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// ===== 5. Helper chung cho Preview In-Memory DOCX =====
export function renderPreviewDocxBuffer(
  type: 'quotation' | 'contract' | 'advance' | 'custom',
  data: any,
  customTemplateFilePath?: string
): { success: boolean; buffer?: Buffer; error?: string } {
  if (type === 'quotation') return renderQuotationDocxBuffer(data)
  if (type === 'contract') return renderContractDocxBuffer(data)
  if (type === 'advance') return renderAdvanceRequestDocxBuffer(data)
  if (type === 'custom') {
    if (!customTemplateFilePath) {
      return { success: false, error: 'Thiếu đường dẫn template tùy biến.' }
    }
    return renderCustomDocxBuffer(customTemplateFilePath, data)
  }
  return { success: false, error: `Loại tài liệu không hợp lệ: ${type}` }
}

