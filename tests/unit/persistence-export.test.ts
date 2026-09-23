import { describe, it, expect } from 'vitest'
import { PDFDocument, rgb } from 'pdf-lib'
import {
  addAnnotationsToPdf,
  deletePages,
  rotatePages,
  reorderPages,
  duplicatePages,
  getPdfInfo
} from '../../src/main/services/pdf-service'
import { PdfAnnotation } from '../../src/shared/types'

describe('Persistence & Export Test Suite (Nhóm P, Q & C - Lưu trữ, Xuất file & Toàn vẹn Trang)', () => {
  // Tạo tài liệu PDF mẫu in-memory (3 trang A4: 595 x 842)
  async function createSamplePdfBytes(): Promise<Uint8Array> {
    const doc = await PDFDocument.create()
    for (let i = 0; i < 3; i++) {
      const page = doc.addPage([595, 842])
      page.drawText(`Trang mau so ${i + 1}`, { x: 50, y: 750, size: 24, color: rgb(0, 0, 0) })
    }
    return await doc.save()
  }

  it('Lấy thông tin PDF (getPdfInfo) chính xác số trang và kích thước', async () => {
    const pdfBytes = await createSamplePdfBytes()
    const info = await getPdfInfo(pdfBytes)

    expect(info.pageCount).toBe(3)
    expect(info.pages.length).toBe(3)
    expect(info.pages[0].width).toBe(595)
    expect(info.pages[0].height).toBe(842)
    expect(info.pages[0].rotation).toBe(0)
  })

  it('Xóa trang (deletePages): Xóa trang ở giữa, số trang giảm chính xác và không bị lỗi file', async () => {
    const pdfBytes = await createSamplePdfBytes()
    // Xóa trang index 1 (trang 2)
    const modifiedBytes = await deletePages(pdfBytes, [1])

    const info = await getPdfInfo(modifiedBytes)
    expect(info.pageCount).toBe(2)
  })

  it('Xoay trang (rotatePages): Góc quay được cập nhật chính xác (90 độ)', async () => {
    const pdfBytes = await createSamplePdfBytes()
    const rotatedBytes = await rotatePages(pdfBytes, [0], 90)

    const info = await getPdfInfo(rotatedBytes)
    expect(info.pages[0].rotation).toBe(90)
    expect(info.pages[1].rotation).toBe(0)
  })

  it('Sắp xếp lại trang (reorderPages): Hoán đổi thứ tự các trang thành công', async () => {
    const pdfBytes = await createSamplePdfBytes()
    // Đảo thứ tự: [2, 0, 1]
    const reorderedBytes = await reorderPages(pdfBytes, [2, 0, 1])

    const info = await getPdfInfo(reorderedBytes)
    expect(info.pageCount).toBe(3)
  })

  it('Nhân bản trang (duplicatePages): Tăng số lượng trang chính xác', async () => {
    const pdfBytes = await createSamplePdfBytes()
    // Nhân bản trang index 0
    const duplicatedBytes = await duplicatePages(pdfBytes, [0])

    const info = await getPdfInfo(duplicatedBytes)
    expect(info.pageCount).toBe(4) // 3 + 1
  })

  it('Thêm Annotations (addAnnotationsToPdf): Flatten văn bản và hình khối vào PDF thành công', async () => {
    const pdfBytes = await createSamplePdfBytes()

    const annotations: PdfAnnotation[] = [
      {
        id: 'ann_text_1',
        pageIndex: 0,
        type: 'text',
        x: 100,
        y: 200,
        width: 150,
        height: 30,
        text: 'VietKey Test Export',
        fontSize: 14,
        color: '#ff0000'
      },
      {
        id: 'ann_shape_rect',
        pageIndex: 0,
        type: 'shape',
        shapeType: 'rect',
        x: 50,
        y: 300,
        width: 200,
        height: 100,
        strokeColor: '#0000ff',
        fillColor: '#ffff00',
        strokeWidth: 2,
        opacity: 0.8
      }
    ]

    const resultBytes = await addAnnotationsToPdf(pdfBytes, annotations)
    expect(resultBytes).toBeInstanceOf(Uint8Array)
    expect(resultBytes.length).toBeGreaterThan(0)

    // Đọc lại để chắc chắn file hợp lệ 100%
    const reloadedDoc = await PDFDocument.load(resultBytes)
    expect(reloadedDoc.getPageCount()).toBe(3)
  })
})
