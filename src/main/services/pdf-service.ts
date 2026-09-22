/**
 * VietKey PDF Tools — PDF Manipulation Service
 * Sử dụng pdf-lib để xử lý PDF (merge, split, xóa/xoay/reorder trang)
 */

import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib'
import { readFileSync, writeFileSync } from 'fs'

// ===== Đọc file PDF thành Uint8Array =====
export async function readPdfFile(filePath: string): Promise<Uint8Array> {
  const buffer = readFileSync(filePath)
  return new Uint8Array(buffer)
}

// ===== Lấy thông tin cơ bản của PDF =====
export interface PdfPageInfo {
  index: number
  width: number
  height: number
  rotation: number
}

export async function getPdfInfo(
  pdfBytes: Uint8Array
): Promise<{ pageCount: number; pages: PdfPageInfo[] }> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()
  return {
    pageCount: pages.length,
    pages: pages.map((page, index) => ({
      index,
      width: page.getWidth(),
      height: page.getHeight(),
      rotation: page.getRotation().angle
    }))
  }
}

// ===== Xóa trang =====
export async function deletePages(
  pdfBytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  // Xóa từ cuối lên đầu để tránh lệch index
  const sorted = [...pageIndices].sort((a, b) => b - a)
  for (const idx of sorted) {
    if (idx >= 0 && idx < pdfDoc.getPageCount()) {
      pdfDoc.removePage(idx)
    }
  }
  const result = await pdfDoc.save()
  return new Uint8Array(result)
}

// ===== Xoay trang =====
export async function rotatePages(
  pdfBytes: Uint8Array,
  pageIndices: number[],
  angleDegrees: number // 90, 180, 270
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()
  for (const idx of pageIndices) {
    if (idx >= 0 && idx < pages.length) {
      const currentRotation = pages[idx].getRotation().angle
      pages[idx].setRotation(degrees(currentRotation + angleDegrees))
    }
  }
  const result = await pdfDoc.save()
  return new Uint8Array(result)
}

// ===== Sắp xếp lại trang =====
export async function reorderPages(
  pdfBytes: Uint8Array,
  newOrder: number[] // [2, 0, 1] = trang 3 lên đầu, rồi trang 1, rồi trang 2
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const newDoc = await PDFDocument.create()

  for (const srcIdx of newOrder) {
    if (srcIdx >= 0 && srcIdx < srcDoc.getPageCount()) {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [srcIdx])
      newDoc.addPage(copiedPage)
    }
  }

  const result = await newDoc.save()
  return new Uint8Array(result)
}

// ===== Nhân bản trang =====
export async function duplicatePages(
  pdfBytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const newDoc = await PDFDocument.create()
  const pageCount = srcDoc.getPageCount()
  const toDuplicate = new Set(pageIndices)

  for (let i = 0; i < pageCount; i++) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [i])
    newDoc.addPage(copiedPage)
    if (toDuplicate.has(i)) {
      const [duplicatePage] = await newDoc.copyPages(srcDoc, [i])
      newDoc.addPage(duplicatePage)
    }
  }

  const result = await newDoc.save()
  return new Uint8Array(result)
}

// ===== Trích xuất trang =====
export async function extractPages(
  pdfBytes: Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const newDoc = await PDFDocument.create()

  for (const idx of pageIndices) {
    if (idx >= 0 && idx < srcDoc.getPageCount()) {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [idx])
      newDoc.addPage(copiedPage)
    }
  }

  const result = await newDoc.save()
  return new Uint8Array(result)
}

// ===== Tách PDF (Split) =====
export interface SplitRange {
  start: number // 0-indexed
  end: number // 0-indexed, inclusive
}

export async function splitPdf(
  pdfBytes: Uint8Array,
  ranges: SplitRange[]
): Promise<Uint8Array[]> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const results: Uint8Array[] = []

  for (const range of ranges) {
    const newDoc = await PDFDocument.create()
    for (let i = range.start; i <= range.end && i < srcDoc.getPageCount(); i++) {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i])
      newDoc.addPage(copiedPage)
    }
    const bytes = await newDoc.save()
    results.push(new Uint8Array(bytes))
  }

  return results
}

// ===== Ghép PDF (Merge) =====
export async function mergePdfs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create()

  for (const pdfBytes of pdfBytesArray) {
    const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
    const pageCount = srcDoc.getPageCount()
    const indices = Array.from({ length: pageCount }, (_, i) => i)
    const copiedPages = await mergedDoc.copyPages(srcDoc, indices)
    for (const page of copiedPages) {
      mergedDoc.addPage(page)
    }
  }

  const result = await mergedDoc.save()
  return new Uint8Array(result)
}

// ===== Lưu PDF ra file =====
export function savePdfToFile(pdfBytes: Uint8Array, outputPath: string): void {
  writeFileSync(outputPath, Buffer.from(pdfBytes))
}

// ===== Flatten Annotations vào PDF (chèn ảnh/text tại vị trí chỉ định) =====
export interface PdfAnnotation {
  type: 'image' | 'text'
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  // For image
  imageBase64?: string
  imageType?: 'png' | 'jpg'
  // For text
  text?: string
  fontSize?: number
  color?: { r: number; g: number; b: number }
  opacity?: number
}

export async function flattenAnnotations(
  pdfBytes: Uint8Array,
  annotations: PdfAnnotation[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()

  for (const ann of annotations) {
    if (ann.pageIndex < 0 || ann.pageIndex >= pages.length) continue
    const page = pages[ann.pageIndex]
    const pageHeight = page.getHeight()

    if (ann.type === 'image' && ann.imageBase64) {
      let raw = ann.imageBase64
      if (raw.includes(',')) {
        raw = raw.split(',')[1]
      }
      const imgBytes = Buffer.from(raw, 'base64')
      let image
      if (ann.imageType === 'jpg') {
        try {
          image = await pdfDoc.embedJpg(imgBytes)
        } catch {
          image = await pdfDoc.embedPng(imgBytes)
        }
      } else {
        try {
          image = await pdfDoc.embedPng(imgBytes)
        } catch {
          image = await pdfDoc.embedJpg(imgBytes)
        }
      }
      page.drawImage(image, {
        x: ann.x,
        y: pageHeight - ann.y - ann.height,
        width: ann.width,
        height: ann.height,
        opacity: ann.opacity ?? 1
      })
    } else if (ann.type === 'text' && ann.text) {
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      page.drawText(ann.text, {
        x: ann.x,
        y: pageHeight - ann.y - (ann.fontSize || 14),
        size: ann.fontSize || 14,
        font,
        color: ann.color
          ? rgb(ann.color.r / 255, ann.color.g / 255, ann.color.b / 255)
          : rgb(0, 0, 0),
        opacity: ann.opacity ?? 1
      })
    }
  }

  const result = await pdfDoc.save()
  return new Uint8Array(result)
}

// ===== Thêm Watermark vào PDF =====
export interface WatermarkOptions {
  text: string
  opacity?: number
  fontSize?: number
  color?: { r: number; g: number; b: number }
  rotationDegrees?: number
  pageIndices?: number[]
}

export async function addWatermark(
  pdfBytes: Uint8Array,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()
  const targetPages =
    options.pageIndices && options.pageIndices.length > 0
      ? options.pageIndices
      : Array.from({ length: pages.length }, (_, i) => i)

  const fontSize = options.fontSize || 46
  const text = options.text || 'VIETKEY SOLUTIONS'
  const textWidth = font.widthOfTextAtSize(text, fontSize)
  const textHeight = font.heightAtSize(fontSize)
  const opacity = options.opacity ?? 0.22
  const rot = options.rotationDegrees ?? -45
  const c = options.color || { r: 120, g: 120, b: 120 }

  for (const idx of targetPages) {
    if (idx < 0 || idx >= pages.length) continue
    const page = pages[idx]
    const { width, height } = page.getSize()

    const x = (width - textWidth) / 2
    const y = (height - textHeight) / 2

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(c.r / 255, c.g / 255, c.b / 255),
      opacity,
      rotate: degrees(rot)
    })
  }

  const result = await pdfDoc.save()
  return new Uint8Array(result)
}

// ===== Tạo PDF từ danh sách ảnh =====
export async function imagesToPdf(
  images: { base64: string; type?: 'png' | 'jpg' }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  for (const imgItem of images) {
    let raw = imgItem.base64
    if (raw.includes(',')) {
      raw = raw.split(',')[1]
    }
    const imgBytes = Buffer.from(raw, 'base64')
    const isJpg = imgItem.type === 'jpg' || imgItem.base64.startsWith('data:image/jpeg')
    let image
    try {
      image = isJpg ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes)
    } catch {
      image = isJpg ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes)
    }
    const page = pdfDoc.addPage([image.width, image.height])
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    })
  }

  const result = await pdfDoc.save()
  return new Uint8Array(result)
}
