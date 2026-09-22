/**
 * VietKey PDF Studio — PDF Document Manager & Memory Lifecycle Cache
 * Quản lý vòng đời PDFDocumentProxy duy nhất, giải mã Base64 siêu tốc và tự động giải phóng RAM WebAssembly.
 */

import { pdfjsLib } from './pdfConfig'

// Bảng tra cứu Base64 (Lookup Table - LUT) giúp giải mã cực nhanh không qua atob chuỗi trung gian
const b64Lookup = new Uint8Array(256)
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (let i = 0; i < chars.length; i++) {
  b64Lookup[chars.charCodeAt(i)] = i
}

/**
 * Giải mã Base64 sang Uint8Array với hiệu năng cao, không tạo chuỗi nhị phân trung gian trong V8
 */
export function base64ToUint8ArrayFast(base64: string): Uint8Array {
  const commaIdx = base64.indexOf(',')
  const str = commaIdx >= 0 ? base64.slice(commaIdx + 1) : base64
  const len = str.length
  if (len === 0) return new Uint8Array(0)

  let padding = 0
  if (str.endsWith('==')) padding = 2
  else if (str.endsWith('=')) padding = 1

  const byteLength = Math.floor((len * 3) / 4) - padding
  const bytes = new Uint8Array(byteLength)

  let p = 0
  const mainLen = padding > 0 ? len - 4 : len

  for (let i = 0; i < mainLen; i += 4) {
    const e1 = b64Lookup[str.charCodeAt(i)]
    const e2 = b64Lookup[str.charCodeAt(i + 1)]
    const e3 = b64Lookup[str.charCodeAt(i + 2)]
    const e4 = b64Lookup[str.charCodeAt(i + 3)]

    bytes[p++] = (e1 << 2) | (e2 >> 4)
    bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2)
    bytes[p++] = ((e3 & 3) << 6) | e4
  }

  if (padding === 2) {
    const e1 = b64Lookup[str.charCodeAt(len - 4)]
    const e2 = b64Lookup[str.charCodeAt(len - 3)]
    bytes[p++] = (e1 << 2) | (e2 >> 4)
  } else if (padding === 1) {
    const e1 = b64Lookup[str.charCodeAt(len - 4)]
    const e2 = b64Lookup[str.charCodeAt(len - 3)]
    const e3 = b64Lookup[str.charCodeAt(len - 2)]
    bytes[p++] = (e1 << 2) | (e2 >> 4)
    bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2)
  }

  return bytes
}

// Bộ nhớ đệm Document Proxy duy nhất
let cachedBase64: string | null = null
let cachedDoc: pdfjsLib.PDFDocumentProxy | null = null
let cachedLoadingPromise: Promise<pdfjsLib.PDFDocumentProxy> | null = null

/**
 * Lấy tài liệu PDFDocumentProxy dùng chung cho toàn bộ ứng dụng (PdfViewer, Sidebar, Grid).
 * Đảm bảo chỉ giải mã Base64 và khởi tạo Web Worker đúng 1 LẦN.
 * Tự động hủy (destroy) tài liệu cũ để giải phóng RAM WebAssembly khi nạp tài liệu mới.
 */
export async function getSharedPdfDoc(base64: string): Promise<pdfjsLib.PDFDocumentProxy> {
  if (!base64) {
    destroySharedPdfDoc()
    throw new Error('Chuỗi Base64 PDF rỗng')
  }

  // Nếu cùng tài liệu đã nạp sẵn, trả về ngay lập tức (0ms)
  if (cachedBase64 === base64 && cachedDoc) {
    return cachedDoc
  }

  // Nếu đang trong quá trình tải cùng một tài liệu, trả về promise đang chờ
  if (cachedBase64 === base64 && cachedLoadingPromise) {
    return cachedLoadingPromise
  }

  // Giải phóng tài liệu cũ trước khi nạp mới (chống rò rỉ bộ nhớ)
  destroySharedPdfDoc()

  cachedBase64 = base64
  cachedLoadingPromise = (async () => {
    try {
      const bytes = base64ToUint8ArrayFast(base64)
      const loadingTask = pdfjsLib.getDocument({
        data: bytes,
        cMapPacked: true
      })
      const doc = await loadingTask.promise
      cachedDoc = doc
      return doc
    } catch (err) {
      cachedBase64 = null
      cachedDoc = null
      throw err
    } finally {
      cachedLoadingPromise = null
    }
  })()

  return cachedLoadingPromise
}

/**
 * Hủy bỏ và giải phóng bộ nhớ của tài liệu PDF hiện tại
 */
export function destroySharedPdfDoc(): void {
  if (cachedDoc) {
    try {
      cachedDoc.destroy()
    } catch {
      // Bỏ qua lỗi nếu doc đã bị destroy trước đó
    }
    cachedDoc = null
  }
  cachedBase64 = null
  cachedLoadingPromise = null
}
