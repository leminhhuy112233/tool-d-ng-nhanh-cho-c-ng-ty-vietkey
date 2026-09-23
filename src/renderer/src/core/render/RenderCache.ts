/**
 * RenderCache — Bộ nhớ đệm LRU (Least Recently Used) cho các bề mặt Canvas trang PDF
 * Giới hạn ngân sách RAM nghiêm ngặt (chỉ giữ tối đa maxPages trang phân giải cao trong bộ nhớ).
 * Tự động hủy context 2D và thu hồi VRAM khi trang trôi ra khỏi vùng quan tâm.
 */

export interface CachedPageRender {
  pageIndex: number
  scale: number
  renderedAt: number
  canvas: HTMLCanvasElement
}

export class RenderCache {
  private cache = new Map<number, CachedPageRender>()
  private maxPages: number

  constructor(maxPages = 6) {
    this.maxPages = maxPages
  }

  public has(pageIndex: number, targetScale: number): boolean {
    const item = this.cache.get(pageIndex)
    if (!item) return false
    // Chỉ coi là cache hit nếu tỉ lệ zoom khớp nhau (sai số < 0.01)
    return Math.abs(item.scale - targetScale) < 0.01
  }

  public get(pageIndex: number): CachedPageRender | undefined {
    const item = this.cache.get(pageIndex)
    if (item) {
      // Đưa lên đầu danh sách LRU
      item.renderedAt = Date.now()
      this.cache.delete(pageIndex)
      this.cache.set(pageIndex, item)
    }
    return item
  }

  public put(pageIndex: number, scale: number, canvas: HTMLCanvasElement): void {
    if (this.cache.has(pageIndex)) {
      this.cache.delete(pageIndex)
    } else if (this.cache.size >= this.maxPages) {
      this.evictLeastRecentlyUsed()
    }

    this.cache.set(pageIndex, {
      pageIndex,
      scale,
      renderedAt: Date.now(),
      canvas
    })
  }

  public evict(pageIndex: number): void {
    const item = this.cache.get(pageIndex)
    if (item) {
      // Giải phóng bộ nhớ VRAM canvas triệt để
      try {
        const ctx = item.canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, item.canvas.width, item.canvas.height)
        }
        item.canvas.width = 1
        item.canvas.height = 1
      } catch {}
      this.cache.delete(pageIndex)
    }
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: number | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.renderedAt < oldestTime) {
        oldestTime = item.renderedAt
        oldestKey = key
      }
    }

    if (oldestKey !== null) {
      this.evict(oldestKey)
    }
  }

  public retainOnly(activePageIndices: Set<number>): void {
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (!activePageIndices.has(key)) {
        this.evict(key)
      }
    }
  }

  public clear(): void {
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      this.evict(key)
    }
    this.cache.clear()
  }

  public size(): number {
    return this.cache.size
  }
}
