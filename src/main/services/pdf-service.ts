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
  type: 'image' | 'text' | 'shape' | 'highlight'
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
  color?: { r: number; g: number; b: number } | string
  fontFamily?: string
  fontWeight?: string
  // For shape
  shapeType?: 'rect' | 'circle' | 'arrow' | 'line'
  strokeColor?: string
  strokeWidth?: number
  fillColor?: string
  opacity?: number
}

function parsePdfColor(c?: string | { r: number; g: number; b: number }) {
  if (!c) return undefined
  if (typeof c === 'object') {
    return rgb(c.r / 255, c.g / 255, c.b / 255)
  }
  const str = c.trim()
  if (str === 'transparent' || str === '') return undefined
  if (str.startsWith('#')) {
    const hex = str.replace('#', '')
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16) / 255
      const g = parseInt(hex[1] + hex[1], 16) / 255
      const b = parseInt(hex[2] + hex[2], 16) / 255
      return rgb(r, g, b)
    } else if (hex.length >= 6) {
      const r = parseInt(hex.substring(0, 2), 16) / 255
      const g = parseInt(hex.substring(2, 4), 16) / 255
      const b = parseInt(hex.substring(4, 6), 16) / 255
      return rgb(r, g, b)
    }
  }
  if (str.startsWith('rgb')) {
    const match = str.match(/[\d.]+/g)
    if (match && match.length >= 3) {
      return rgb(Number(match[0]) / 255, Number(match[1]) / 255, Number(match[2]) / 255)
    }
  }
  return rgb(0, 0, 0)
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
      try {
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
      } catch (imgErr) {
        console.error('Lỗi nạp ảnh vào trang PDF:', imgErr)
      }
    } else if (ann.type === 'text' && ann.text) {
      try {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const textColor = parsePdfColor(ann.color) || rgb(0, 0, 0)
        page.drawText(ann.text, {
          x: ann.x,
          y: pageHeight - ann.y - (ann.fontSize || 14),
          size: ann.fontSize || 14,
          font,
          color: textColor,
          opacity: ann.opacity ?? 1
        })
      } catch (txtErr) {
        console.error('Lỗi vẽ chữ vào trang PDF:', txtErr)
      }
    } else if (ann.type === 'shape') {
      const bColor = parsePdfColor(ann.strokeColor)
      const fColor = parsePdfColor(ann.fillColor)
      const sWidth = ann.strokeWidth ?? 2
      const op = ann.opacity ?? 1

      if (ann.shapeType === 'rect') {
        page.drawRectangle({
          x: ann.x,
          y: pageHeight - ann.y - ann.height,
          width: ann.width,
          height: ann.height,
          borderColor: bColor,
          borderWidth: sWidth,
          color: fColor,
          opacity: op
        })
      } else if (ann.shapeType === 'circle') {
        page.drawEllipse({
          x: ann.x + ann.width / 2,
          y: pageHeight - ann.y - ann.height / 2,
          xScale: ann.width / 2,
          yScale: ann.height / 2,
          borderColor: bColor,
          borderWidth: sWidth,
          color: fColor,
          opacity: op
        })
      } else if (ann.shapeType === 'line') {
        const lineY = pageHeight - ann.y - ann.height / 2
        page.drawLine({
          start: { x: ann.x, y: lineY },
          end: { x: ann.x + ann.width, y: lineY },
          thickness: sWidth,
          color: bColor || rgb(0, 0, 0),
          opacity: op
        })
      } else if (ann.shapeType === 'arrow') {
        const lineY = pageHeight - ann.y - ann.height / 2
        const color = bColor || rgb(0, 0, 0)
        page.drawLine({
          start: { x: ann.x, y: lineY },
          end: { x: ann.x + ann.width - 8, y: lineY },
          thickness: sWidth,
          color,
          opacity: op
        })
        page.drawLine({
          start: { x: ann.x + ann.width - 14, y: lineY + 5 },
          end: { x: ann.x + ann.width, y: lineY },
          thickness: sWidth,
          color,
          opacity: op
        })
        page.drawLine({
          start: { x: ann.x + ann.width - 14, y: lineY - 5 },
          end: { x: ann.x + ann.width, y: lineY },
          thickness: sWidth,
          color,
          opacity: op
        })
      }
    } else if (ann.type === 'highlight') {
      const fColor = parsePdfColor(ann.color) || rgb(1, 0.94, 0.54)
      page.drawRectangle({
        x: ann.x,
        y: pageHeight - ann.y - ann.height,
        width: ann.width,
        height: ann.height,
        color: fColor,
        opacity: ann.opacity ?? 0.5
      })
    }
  }

  const result = await pdfDoc.save()
  return new Uint8Array(result)
}

export const addAnnotationsToPdf = flattenAnnotations

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

// ===== Thêm trang trắng A4 vào tài liệu =====
export async function addBlankPage(
  pdfBytes: Uint8Array,
  position: 'before' | 'after' | 'end',
  targetIndex: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const total = pdfDoc.getPageCount()
  const insertIdx =
    position === 'before'
      ? Math.max(0, targetIndex)
      : position === 'after'
        ? Math.min(total, targetIndex + 1)
        : total

  pdfDoc.insertPage(insertIdx, [595.28, 841.89]) // Chuẩn A4
  const result = await pdfDoc.save()
  return new Uint8Array(result)
}

// ===== Nhập trang từ file PDF khác =====
export async function importPdfPages(
  targetBytes: Uint8Array,
  sourceBytes: Uint8Array,
  position: 'before' | 'after' | 'end',
  targetIndex: number,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const targetDoc = await PDFDocument.load(targetBytes, { ignoreEncryption: true })
  const sourceDoc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true })

  const indices =
    pageIndices && pageIndices.length > 0 ? pageIndices : sourceDoc.getPageIndices()
  const copiedPages = await targetDoc.copyPages(sourceDoc, indices)

  let insertIdx =
    position === 'before'
      ? Math.max(0, targetIndex)
      : position === 'after'
        ? Math.min(targetDoc.getPageCount(), targetIndex + 1)
        : targetDoc.getPageCount()

  for (const page of copiedPages) {
    targetDoc.insertPage(insertIdx, page)
    insertIdx++
  }

  const result = await targetDoc.save()
  return new Uint8Array(result)
}

// ===== Nén giảm dung lượng PDF =====
export async function compressPdf(
  pdfBytes: Uint8Array,
  level: 'low' | 'medium' | 'high'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  // Nén luồng đối tượng (Object Streams)
  const result = await pdfDoc.save({ useObjectStreams: true })
  return new Uint8Array(result)
}

// ===== Cập nhật hoặc Xóa sạch Metadata =====
export async function updateMetadata(
  pdfBytes: Uint8Array,
  metadata: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
  } | null
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })

  if (metadata === null) {
    // Xóa sạch để ẩn danh tài liệu
    pdfDoc.setTitle('')
    pdfDoc.setAuthor('')
    pdfDoc.setSubject('')
    pdfDoc.setKeywords([])
    pdfDoc.setProducer('')
    pdfDoc.setCreator('')
  } else {
    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title)
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author)
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject)
    if (metadata.keywords !== undefined) {
      const kw = metadata.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      pdfDoc.setKeywords(kw)
    }
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator)
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer)
  }

  const result = await pdfDoc.save()
  return new Uint8Array(result)
}
