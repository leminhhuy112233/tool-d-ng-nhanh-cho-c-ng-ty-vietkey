/**
 * RenderQueue — Hàng đợi render theo độ ưu tiên (Priority Queue) kèm cơ chế Hủy Tác Vụ Cũ
 * Ngăn chặn tình trạng tắc nghẽn PDF.js worker khi người dùng cuộn nhanh qua hàng trăm trang.
 */

export enum RenderPriority {
  CURRENT = 100,
  VISIBLE = 80,
  PREFETCH = 50,
  THUMBNAIL = 20,
  BACKGROUND = 5
}

export interface RenderJob {
  id: string
  pageIndex: number
  scale: number
  priority: RenderPriority
  createdAt: number
  canvas: HTMLCanvasElement
  resolve?: (success: boolean) => void
  reject?: (err: any) => void
}

export class RenderQueue {
  private queue: RenderJob[] = []
  private activeJobs = new Map<number, { job: RenderJob; task: any }>()
  private maxConcurrent: number

  constructor(maxConcurrent = 2) {
    this.maxConcurrent = maxConcurrent
  }

  public enqueue(job: RenderJob): void {
    // Nếu trang này đã có trong hàng đợi chờ: cập nhật priority nếu cao hơn
    const existingIdx = this.queue.findIndex((j) => j.pageIndex === job.pageIndex)
    if (existingIdx >= 0) {
      if (job.priority > this.queue[existingIdx].priority) {
        this.queue[existingIdx].priority = job.priority
        this.queue[existingIdx].scale = job.scale
        this.queue[existingIdx].canvas = job.canvas
      }
      this.sortQueue()
      return
    }

    this.queue.push(job)
    this.sortQueue()
  }

  private sortQueue(): void {
    // Sắp xếp giảm dần theo priority, nếu bằng nhau thì việc nào đến trước làm trước
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      return a.createdAt - b.createdAt
    })
  }

  public dequeue(): RenderJob | undefined {
    return this.queue.shift()
  }

  public registerActive(pageIndex: number, job: RenderJob, task: any): void {
    this.activeJobs.set(pageIndex, { job, task })
  }

  public unregisterActive(pageIndex: number): void {
    this.activeJobs.delete(pageIndex)
  }

  public isActive(pageIndex: number): boolean {
    return this.activeJobs.has(pageIndex)
  }

  public getActiveCount(): number {
    return this.activeJobs.size
  }

  public canRunNext(): boolean {
    return this.activeJobs.size < this.maxConcurrent && this.queue.length > 0
  }

  /**
   * Hủy bỏ ngay lập tức các tác vụ render đang chạy hoặc đang chờ nếu trang đó
   * đã trôi ra khỏi cửa sổ hiển thị (Visible Window)
   */
  public cancelStaleJobs(activeIndices: Set<number>): void {
    // 1. Hủy các job đang chờ trong hàng đợi không còn nằm trong active window
    this.queue = this.queue.filter((job) => {
      const keep = activeIndices.has(job.pageIndex)
      if (!keep && job.resolve) {
        job.resolve(false)
      }
      return keep
    })

    // 2. Hủy các task đang chạy trong PDF.js worker nếu trang đã trôi xa
    for (const [pageIndex, active] of this.activeJobs.entries()) {
      if (!activeIndices.has(pageIndex)) {
        try {
          active.task?.cancel?.()
        } catch {}
        this.activeJobs.delete(pageIndex)
        if (active.job.resolve) {
          active.job.resolve(false)
        }
      }
    }
  }

  public cancelAll(): void {
    for (const active of this.activeJobs.values()) {
      try {
        active.task?.cancel?.()
      } catch {}
      if (active.job.resolve) {
        active.job.resolve(false)
      }
    }
    this.activeJobs.clear()

    for (const job of this.queue) {
      if (job.resolve) job.resolve(false)
    }
    this.queue = []
  }

  public clearQueue(): void {
    this.queue = []
  }

  public getQueueLength(): number {
    return this.queue.length
  }
}
