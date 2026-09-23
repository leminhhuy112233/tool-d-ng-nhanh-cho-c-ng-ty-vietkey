/**
 * CoordinateSystem — Chuyển đổi tọa độ hai chiều giữa Màn hình (Screen Pixel) và Chuẩn PDF (Points)
 * Đảm bảo vị trí đối tượng in ấn, nén, xuất file chuẩn xác 100% bất kể màn hình đang zoom bao nhiêu %.
 */

export interface Rect2D {
  x: number
  y: number
  width: number
  height: number
}

export class CoordinateSystem {
  /**
   * Chuyển đổi tọa độ từ Màn hình (Pixel tại zoomLevel) sang Tọa độ PDF gốc (Points)
   */
  public static screenToPdf(rect: Rect2D, zoomLevel: number): Rect2D {
    const scale = zoomLevel / 100
    if (scale <= 0) return { ...rect }
    return {
      x: rect.x / scale,
      y: rect.y / scale,
      width: rect.width / scale,
      height: rect.height / scale
    }
  }

  /**
   * Chuyển đổi tọa độ từ Chuẩn PDF gốc (Points) sang Tọa độ Màn hình (Pixel tại zoomLevel)
   */
  public static pdfToScreen(rect: Rect2D, zoomLevel: number): Rect2D {
    const scale = zoomLevel / 100
    return {
      x: Math.round(rect.x * scale),
      y: Math.round(rect.y * scale),
      width: Math.round(rect.width * scale),
      height: Math.round(rect.height * scale)
    }
  }

  /**
   * Tính toán tỉ lệ zoom fit theo chiều ngang của container
   */
  public static calculateFitWidthZoom(pageBaseWidth: number, containerWidth: number, padding = 48): number {
    if (pageBaseWidth <= 0 || containerWidth <= padding) return 100
    const availableW = containerWidth - padding
    const ratio = (availableW / pageBaseWidth) * 100
    return Math.max(30, Math.min(300, Math.round(ratio)))
  }

  /**
   * Tính toán tỉ lệ zoom fit trọn vẹn cả trang trong khung nhìn
   */
  public static calculateFitPageZoom(
    pageBaseWidth: number,
    pageBaseHeight: number,
    containerWidth: number,
    containerHeight: number,
    padding = 48
  ): number {
    const availW = containerWidth - padding
    const availH = containerHeight - padding
    if (availW <= 0 || availH <= 0) return 100

    const ratioW = availW / pageBaseWidth
    const ratioH = availH / pageBaseHeight
    const ratio = Math.min(ratioW, ratioH) * 100
    return Math.max(30, Math.min(300, Math.round(ratio)))
  }
}
