/**
 * PageLayoutManager — Tính toán kích thước, tỉ lệ xoay và vị trí cộng dồn của từng trang PDF
 * Hỗ trợ tài liệu có kích thước hỗn hợp (A4, A3, khổ ngang, khổ dọc) với hiệu năng O(1) sau khi khởi tạo.
 */

import { PdfPageInfo } from '../../stores/pdfTools.store'

export interface PageLayoutMeta {
  index: number
  baseWidth: number
  baseHeight: number
  rotation: number
  actualWidth: number
  actualHeight: number
  displayWidth: number
  displayHeight: number
  offsetTop: number
  scale: number
}

export class PageLayoutManager {
  private layouts: PageLayoutMeta[] = []
  private offsets: number[] = []
  private totalHeight: number = 0
  private maxWidth: number = 0
  private currentScale: number = 1
  private pageGap: number = 24

  constructor(pageGap = 24) {
    this.pageGap = pageGap
  }

  /**
   * Tính toán trước toàn bộ tọa độ và chiều cao của tất cả các trang
   */
  public computeLayouts(pages: PdfPageInfo[], zoomLevel: number): void {
    const scale = zoomLevel / 100
    this.currentScale = scale
    this.layouts = new Array(pages.length)
    this.offsets = new Array(pages.length)

    let currentOffsetTop = this.pageGap
    let maxW = 0

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const baseW = page.width || 595.28
      const baseH = page.height || 841.89
      const rotation = (page.rotation || 0) % 360
      const isRotated = rotation === 90 || rotation === 270

      const actualW = isRotated ? baseH : baseW
      const actualH = isRotated ? baseW : baseH

      const displayW = Math.round(actualW * scale)
      const displayH = Math.round(actualH * scale)

      if (displayW > maxW) {
        maxW = displayW
      }

      this.offsets[i] = currentOffsetTop

      this.layouts[i] = {
        index: i,
        baseWidth: baseW,
        baseHeight: baseH,
        rotation,
        actualWidth: actualW,
        actualHeight: actualH,
        displayWidth: displayW,
        displayHeight: displayH,
        offsetTop: currentOffsetTop,
        scale
      }

      currentOffsetTop += displayH + this.pageGap
    }

    this.totalHeight = currentOffsetTop
    this.maxWidth = maxW
  }

  public getLayout(index: number): PageLayoutMeta | undefined {
    return this.layouts[index]
  }

  public getAllLayouts(): PageLayoutMeta[] {
    return this.layouts
  }

  public getOffsets(): number[] {
    return this.offsets
  }

  public getTotalHeight(): number {
    return this.totalHeight
  }

  public getMaxWidth(): number {
    return this.maxWidth
  }

  public getScale(): number {
    return this.currentScale
  }
}
