/**
 * VirtualScrollEngine — Động cơ ảo hóa cuộn trang PDF với thuật toán Binary Search O(log N)
 * Chỉ giữ lại các trang thực sự hiển thị trong Viewport kèm đệm Overscan an toàn.
 */

import { PageLayoutMeta } from './PageLayoutManager'

export interface VisibleRange {
  startIndex: number
  endIndex: number
  visibleIndices: number[]
  currentVisiblePage: number
}

/**
 * Tìm kiếm nhị phân trang xuất hiện tại vị trí scrollTop trong mảng offsets
 * Độ phức tạp: O(log N) (chỉ ~8-9 bước cho 500 trang)
 */
export function findVisiblePageIndex(offsets: number[], scrollTop: number): number {
  if (offsets.length === 0) return 0
  let low = 0
  let high = offsets.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    if (offsets[mid] <= scrollTop) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return Math.max(0, high)
}

/**
 * Tính toán dải trang (Range) cần render trong viewport với bộ đệm (Overscan buffer)
 */
export function computeVisibleRange(
  offsets: number[],
  layouts: PageLayoutMeta[],
  scrollTop: number,
  viewportHeight: number,
  overscanBefore = 1,
  overscanAfter = 2
): VisibleRange {
  const totalPages = offsets.length
  if (totalPages === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      visibleIndices: [],
      currentVisiblePage: 0
    }
  }

  const scrollBottom = scrollTop + viewportHeight
  // Trang bắt đầu xuất hiện ở đỉnh viewport
  const firstVisible = findVisiblePageIndex(offsets, scrollTop)

  // Tìm trang cuối cùng xuất hiện ở đáy viewport
  let lastVisible = firstVisible
  while (lastVisible < totalPages - 1) {
    const nextOffset = offsets[lastVisible + 1]
    if (nextOffset <= scrollBottom) {
      lastVisible++
    } else {
      break
    }
  }

  // Mở rộng cửa sổ với đệm Overscan để người dùng cuộn mượt không bị chớp trắng
  const startIndex = Math.max(0, firstVisible - overscanBefore)
  const endIndex = Math.min(totalPages - 1, lastVisible + overscanAfter)

  const visibleIndices: number[] = []
  for (let i = startIndex; i <= endIndex; i++) {
    visibleIndices.push(i)
  }

  // Xác định trang chiếm diện tích lớn nhất trong viewport làm currentPage
  let currentVisiblePage = firstVisible
  let maxVisibleHeight = 0

  for (let i = firstVisible; i <= lastVisible; i++) {
    const meta = layouts[i]
    if (!meta) continue
    const top = meta.offsetTop
    const bottom = top + meta.displayHeight

    const visibleTop = Math.max(scrollTop, top)
    const visibleBottom = Math.min(scrollBottom, bottom)
    const visibleHeight = Math.max(0, visibleBottom - visibleTop)

    if (visibleHeight > maxVisibleHeight) {
      maxVisibleHeight = visibleHeight
      currentVisiblePage = i
    }
  }

  return {
    startIndex,
    endIndex,
    visibleIndices,
    currentVisiblePage
  }
}
