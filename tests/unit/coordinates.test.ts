import { describe, it, expect } from 'vitest'
import { CoordinateSystem, Rect2D } from '../../src/renderer/src/core/editor/CoordinateSystem'

describe('CoordinateSystem Test Suite (Nhóm E & O - Tọa độ & Zoom)', () => {
  it('Chuyển đổi screenToPdf chính xác tại các mức zoom chuẩn (50%, 100%, 200%, 400%, 800%)', () => {
    const screenRect: Rect2D = { x: 200, y: 300, width: 100, height: 50 }

    // 100% Zoom: Tọa độ Screen == PDF points
    const pdf100 = CoordinateSystem.screenToPdf(screenRect, 100)
    expect(pdf100).toEqual({ x: 200, y: 300, width: 100, height: 50 })

    // 50% Zoom: 1 point PDF hiển thị thành 0.5px -> Screen 200px = PDF 400 points
    const pdf50 = CoordinateSystem.screenToPdf(screenRect, 50)
    expect(pdf50).toEqual({ x: 400, y: 600, width: 200, height: 100 })

    // 200% Zoom: 1 point PDF hiển thị thành 2px -> Screen 200px = PDF 100 points
    const pdf200 = CoordinateSystem.screenToPdf(screenRect, 200)
    expect(pdf200).toEqual({ x: 100, y: 150, width: 50, height: 25 })

    // 400% Zoom
    const pdf400 = CoordinateSystem.screenToPdf(screenRect, 400)
    expect(pdf400).toEqual({ x: 50, y: 75, width: 25, height: 12.5 })

    // 800% Zoom
    const pdf800 = CoordinateSystem.screenToPdf(screenRect, 800)
    expect(pdf800).toEqual({ x: 25, y: 37.5, width: 12.5, height: 6.25 })
  })

  it('Chuyển đổi pdfToScreen chính xác và làm tròn pixel (Math.round)', () => {
    const pdfRect: Rect2D = { x: 100, y: 150, width: 50, height: 25 }

    const screen100 = CoordinateSystem.pdfToScreen(pdfRect, 100)
    expect(screen100).toEqual({ x: 100, y: 150, width: 50, height: 25 })

    const screen150 = CoordinateSystem.pdfToScreen(pdfRect, 150)
    expect(screen150).toEqual({ x: 150, y: 225, width: 75, height: 38 }) // 25 * 1.5 = 37.5 -> round 38
  })

  it('Tính toàn vẹn Round-trip (PDF -> Screen -> PDF) không bị lệch tọa độ', () => {
    const originalPdf: Rect2D = { x: 120, y: 240, width: 180, height: 90 }
    const zoom = 150

    const screen = CoordinateSystem.pdfToScreen(originalPdf, zoom)
    const backToPdf = CoordinateSystem.screenToPdf(screen, zoom)

    expect(Math.abs(backToPdf.x - originalPdf.x)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(backToPdf.y - originalPdf.y)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(backToPdf.width - originalPdf.width)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(backToPdf.height - originalPdf.height)).toBeLessThanOrEqual(0.5)
  })

  it('Bảo vệ an toàn khi zoomLevel <= 0 (Edge Cases)', () => {
    const screenRect: Rect2D = { x: 100, y: 100, width: 50, height: 50 }
    const zeroRes = CoordinateSystem.screenToPdf(screenRect, 0)
    expect(zeroRes).toEqual(screenRect)

    const negRes = CoordinateSystem.screenToPdf(screenRect, -50)
    expect(negRes).toEqual(screenRect)
  })

  it('Tính toán Fit-to-Width zoom chính xác và kẹp trong giới hạn [30%, 300%]', () => {
    // A4 width ~ 595pt, Container = 1200px, padding = 48px -> available = 1152px -> ratio = 1152/595 = 193.6% -> 194%
    const zoomFit = CoordinateSystem.calculateFitWidthZoom(595, 1200, 48)
    expect(zoomFit).toBe(194)

    // Container siêu nhỏ -> không nhỏ hơn 30%
    const zoomTiny = CoordinateSystem.calculateFitWidthZoom(595, 100, 48)
    expect(zoomTiny).toBe(30)

    // Container siêu to -> không vượt quá 300%
    const zoomHuge = CoordinateSystem.calculateFitWidthZoom(595, 5000, 48)
    expect(zoomHuge).toBe(300)
  })

  it('Tính toán Fit-to-Page zoom vừa khít cả chiều cao lẫn chiều rộng', () => {
    // A4 595 x 842. Khung nhìn 800 x 900, padding 48 -> availW = 752, availH = 852
    // ratioW = 752 / 595 = 1.2638 (126%), ratioH = 852 / 842 = 1.0118 (101%)
    // Lấy min là 101%
    const zoomFitPage = CoordinateSystem.calculateFitPageZoom(595, 842, 800, 900, 48)
    expect(zoomFitPage).toBe(101)
  })
})
