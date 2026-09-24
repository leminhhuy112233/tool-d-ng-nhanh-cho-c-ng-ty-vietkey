/**
 * RenderManager — Bộ điều phối kết xuất trang PDF tập trung
 * Tích hợp LRU Cache + Priority Queue + DevicePixelRatio Clamping + Hủy tác vụ an toàn.
 */

import { pdfjsLib } from '../../utils/pdfConfig'
import { RenderCache } from './RenderCache'
import { RenderQueue, RenderPriority, RenderJob } from './RenderQueue'

export class RenderManager {
  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null
  private cache: RenderCache
  private queue: RenderQueue
  private isProcessing = false

  constructor(maxCachedPages = 6, maxConcurrentJobs = 2) {
    this.cache = new RenderCache(maxCachedPages)
    this.queue = new RenderQueue(maxConcurrentJobs)
  }

  public setDocument(doc: pdfjsLib.PDFDocumentProxy | null): void {
    if (this.pdfDoc !== doc) {
      this.queue.cancelAll()
      this.cache.clear()
      this.pdfDoc = doc
    }
  }

  public getCache(): RenderCache {
    return this.cache
  }

  public getQueue(): RenderQueue {
    return this.queue
  }

  /**
   * Yêu cầu render một trang lên canvas đích với độ ưu tiên xác định
   */
  public requestRender(
    pageIndex: number,
    scale: number,
    canvas: HTMLCanvasElement,
    priority: RenderPriority = RenderPriority.VISIBLE
  ): Promise<boolean> {
    if (!this.pdfDoc) return Promise.resolve(false)

    // Nếu đã có sẵn trong LRU Cache ở đúng tỉ lệ zoom: coi như xong ngay
    if (this.cache.has(pageIndex, scale)) {
      return Promise.resolve(true)
    }

    return new Promise((resolve, reject) => {
      const job: RenderJob = {
        id: `${pageIndex}_${scale}_${Date.now()}`,
        pageIndex,
        scale,
        priority,
        createdAt: Date.now(),
        canvas,
        resolve,
        reject
      }

      this.queue.enqueue(job)
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (!this.pdfDoc || this.isProcessing) return
    this.isProcessing = true

    try {
      while (this.queue.canRunNext()) {
        const job = this.queue.dequeue()
        if (!job) break

        this.executeJob(job)
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async executeJob(job: RenderJob): Promise<void> {
    const { pageIndex, scale, canvas, resolve } = job
    if (!this.pdfDoc) {
      if (resolve) resolve(false)
      return
    }

    try {
      const page = await this.pdfDoc.getPage(pageIndex + 1)

      // Giới hạn max DPR = 1.5 để bảo vệ VRAM trên màn hình 2K/4K/Retina
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const viewport = page.getViewport({ scale: scale * dpr })

      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${viewport.width / dpr}px`
      canvas.style.height = `${viewport.height / dpr}px`

      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) {
        if (resolve) resolve(false)
        return
      }

      const renderTask = page.render({
        canvas,
        canvasContext: ctx,
        viewport
      })

      this.queue.registerActive(pageIndex, job, renderTask)

      await renderTask.promise

      // Đánh dấu thành công vào LRU cache
      this.cache.put(pageIndex, scale, canvas)
      if (resolve) resolve(true)
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error(`Lỗi render trang ${pageIndex + 1}:`, err)
      }
      if (resolve) resolve(false)
    } finally {
      this.queue.unregisterActive(pageIndex)
      // Tiếp tục xử lý các công việc tiếp theo trong hàng đợi
      this.processQueue()
    }
  }

  /**
   * Cập nhật dải trang nhìn thấy và hủy toàn bộ các job thừa ngoài cửa sổ
   */
  public updateVisibleWindow(activePageIndices: Set<number>): void {
    this.queue.cancelStaleJobs(activePageIndices)
  }

  public clear(): void {
    this.queue.cancelAll()
    this.cache.clear()
    this.pdfDoc = null
  }
}
