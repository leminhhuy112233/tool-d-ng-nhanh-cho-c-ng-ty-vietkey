/**
 * VietKey DocGen — useDocumentToast Hook
 * Quản lý trạng thái thông báo Toast khi tạo/xuất tài liệu, phát âm thanh hoàn tất và tự động đóng
 */

import { useState, useCallback } from 'react'
import { playSuccessChime } from '../lib/sound'

export interface DocumentToastState {
  type: 'success' | 'error'
  text: string
  filePath?: string
  pdfPath?: string
}

export function useDocumentToast() {
  const [toast, setToast] = useState<DocumentToastState | null>(null)

  const showToast = useCallback(
    (type: 'success' | 'error', text: string, filePath?: string, pdfPath?: string) => {
      setToast({ type, text, filePath, pdfPath })
      if (type === 'success') {
        playSuccessChime()
      }
      setTimeout(() => setToast(null), 7000)
    },
    []
  )

  const clearToast = useCallback(() => {
    setToast(null)
  }, [])

  return {
    toast,
    showToast,
    clearToast
  }
}
