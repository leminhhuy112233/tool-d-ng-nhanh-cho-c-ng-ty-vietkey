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
    join(app.getAppPath(), 'templates', fileName),
    join(process.cwd(), 'templates', fileName),
    join(__dirname, '..', '..', 'templates', fileName),
    join(__dirname, '..', 'templates', fileName)
  ].filter(Boolean)

  const found = candidatePaths.find((p) => existsSync(p))
  return found || null
}

// ===== 1. Xuất Hợp đồng nguyên tắc =====
export function generateContractDocx(
  data: ContractData,
  targetPath: string
): { success: boolean; error?: string } {
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

    const content = readFileSync(templatePath, 'binary')
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
    writeFileSync(targetPath, buf)

    return { success: true }
  } catch (err: any) {
    console.error('Lỗi xuất Word Hợp đồng:', err)
    return {
      success: false,
      error: err.message || 'Lỗi không xác định khi xuất file Word.'
    }
  }
}

// ===== 2. Xuất Báo giá =====
export function generateQuotationDocx(
  data: QuotationData,
  targetPath: string
): { success: boolean; error?: string } {
  try {
    const isWithNotes = Boolean(data.co_ghi_chu)
    const templateFileName = isWithNotes ? 'BaoGia_CoGhiChu.docx' : 'BaoGia.docx'
    console.log(`[generateQuotationDocx] Bắt đầu xuất báo giá: co_ghi_chu = ${isWithNotes} -> Template: ${templateFileName}`)

    const templatePath = resolveTemplatePath(templateFileName)
    if (!templatePath) {
      console.error(`[generateQuotationDocx] Không tìm thấy file template ${templateFileName}`)
      return { success: false, error: `Không tìm thấy template ${templateFileName} trong hệ thống.` }
    }

    console.log(`[generateQuotationDocx] Đã tìm thấy template tại: ${templatePath}`)

    const content = readFileSync(templatePath, 'binary')
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    // Prepare table items with auto formatted STT (01, 02, 03...)
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
    writeFileSync(targetPath, buf)

    return { success: true }
  } catch (err: any) {
    console.error('Lỗi xuất Word Báo giá:', err)
    return {
      success: false,
      error: err.message || 'Lỗi không xác định khi xuất file Báo giá Word.'
    }
  }
}

// ===== 3. Xuất Đề nghị Tạm ứng =====
export function generateAdvanceRequestDocx(
  data: AdvanceRequestData,
  targetPath: string
): { success: boolean; error?: string } {
  try {
    const templatePath = resolveTemplatePath('DeNghiTamUng.docx')
    if (!templatePath) {
      return { success: false, error: 'Không tìm thấy template DeNghiTamUng.docx trong hệ thống.' }
    }

    const content = readFileSync(templatePath, 'binary')
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    // Tên công ty khách hàng luôn IN HOA toàn bộ
    const clientCompanyUpper = (data.ten_cong_ty_khach || '').toUpperCase()

    doc.render({
      ngay: data.ngay || '',
      thang: data.thang || '',
      nam: data.nam || '',
      ten_cong_ty_khach: clientCompanyUpper,
      noi_dung_cung_cap: data.noi_dung_cung_cap || 'VLXD các loại',
      dot_tam_ung: data.dot_tam_ung || '1',
      gia_tri_don_hang: data.gia_tri_don_hang || '0',
      gia_tri_tam_ung: data.gia_tri_tam_ung || '0',
      so_tien_bang_chu: data.so_tien_bang_chu || 'Không'
    })

    const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' })
    writeFileSync(targetPath, buf)

    return { success: true }
  } catch (err: any) {
    console.error('Lỗi xuất Word Đề nghị Tạm ứng:', err)
    return {
      success: false,
      error: err.message || 'Lỗi không xác định khi xuất file Đề nghị Tạm ứng Word.'
    }
  }
}

// ===== 4. Xuất Mẫu Tùy Biến (Custom Dynamic Template) =====
export function generateCustomDocx(
  templateFilePath: string,
  data: Record<string, any>,
  targetPath: string
): { success: boolean; error?: string } {
  try {
    if (!existsSync(templateFilePath)) {
      return { success: false, error: `Không tìm thấy file mẫu tại: ${templateFilePath}` }
    }

    const content = readFileSync(templateFilePath, 'binary')
    const zip = new PizZip(content)

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    })

    // Tự động chuẩn hóa dữ liệu: nếu có mảng items thì format STT
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
    writeFileSync(targetPath, buf)

    return { success: true }
  } catch (err: any) {
    console.error('Lỗi xuất Word Mẫu Tùy Biến:', err)
    return {
      success: false,
      error: err.message || 'Lỗi không xác định khi xuất file Word tùy biến.'
    }
  }
}

