/**
 * DraftRecoveryManager — Quản lý Lưu nháp Tự động và Khôi phục khi gặp sự cố (Nhóm W - Crash Autosave)
 * Tự động ghi nhớ trạng thái các đối tượng đã chèn vào localStorage/IndexedDB.
 * Nếu trình duyệt bị đóng đột ngột, mất điện hoặc crash, người dùng có thể khôi phục lại nguyên vẹn.
 */

import { EditorObject } from './EditorObjects'

export interface EditorDraft {
  fileKey: string
  fileName: string
  timestamp: number
  objects: EditorObject[]
}

const DRAFT_PREFIX = 'vietkey_pdf_draft_'

export class DraftRecoveryManager {
  /**
   * Tạo khóa định danh tài liệu dựa trên tên file và kích thước/dung lượng
   */
  public static generateFileKey(fileName: string, fileSize?: number): string {
    return `${fileName}_${fileSize || 0}`.replace(/[^a-zA-Z0-9_-]/g, '_')
  }

  /**
   * Lưu bản nháp vào bộ nhớ cục bộ
   */
  public static saveDraft(fileKey: string, fileName: string, objects: EditorObject[]): void {
    if (!fileKey || objects.length === 0) return
    try {
      const draft: EditorDraft = {
        fileKey,
        fileName,
        timestamp: Date.now(),
        objects
      }
      localStorage.setItem(`${DRAFT_PREFIX}${fileKey}`, JSON.stringify(draft))
    } catch (e) {
      console.warn('Không thể lưu bản nháp PDF:', e)
    }
  }

  /**
   * Kiểm tra xem có bản nháp nào khả dụng cho file hiện tại không
   */
  public static hasDraft(fileKey: string): boolean {
    if (!fileKey) return false
    return localStorage.getItem(`${DRAFT_PREFIX}${fileKey}`) !== null
  }

  /**
   * Tải lại bản nháp đã lưu
   */
  public static loadDraft(fileKey: string): EditorDraft | null {
    if (!fileKey) return null
    try {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${fileKey}`)
      if (!raw) return null
      return JSON.parse(raw) as EditorDraft
    } catch (e) {
      console.error('Lỗi khi nạp bản nháp PDF:', e)
      return null
    }
  }

  /**
   * Xóa bản nháp sau khi người dùng đã lưu/xuất file thành công
   */
  public static clearDraft(fileKey: string): void {
    if (!fileKey) return
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${fileKey}`)
    } catch (e) {
      console.warn('Lỗi khi xóa bản nháp:', e)
    }
  }

  /**
   * Dọn dẹp các bản nháp quá hạn (lớn hơn 7 ngày)
   */
  public static cleanupOldDrafts(maxAgeDays = 7): void {
    try {
      const now = Date.now()
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(DRAFT_PREFIX)) {
          const raw = localStorage.getItem(key)
          if (raw) {
            const draft = JSON.parse(raw) as EditorDraft
            if (now - draft.timestamp > maxAgeMs) {
              localStorage.removeItem(key)
            }
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi dọn dẹp bản nháp cũ:', e)
    }
  }
}
