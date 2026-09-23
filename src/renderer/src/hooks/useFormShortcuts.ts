/**
 * VietKey DocGen — Form Helper Hooks
 * useExportShortcut: Lắng nghe phím tắt Ctrl + Enter để xuất tài liệu nhanh
 * useDefaultExportDir: Tự động nạp thư mục xuất mặc định từ cài đặt hệ thống
 */

import { useEffect } from 'react'

export function useExportShortcut(onExport: () => void, isExporting = false): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isExporting) {
        e.preventDefault()
        onExport()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onExport, isExporting])
}

export function useDefaultExportDir(onSetDir: (dir: string) => void): void {
  useEffect(() => {
    let cancelled = false
    const loadDefaultDir = async () => {
      if (window.api?.getSetting) {
        try {
          const dir = await window.api.getSetting('defaultExportDir')
          if (!cancelled && dir) {
            onSetDir(dir)
          }
        } catch (err) {
          console.error('Lỗi đọc defaultExportDir:', err)
        }
      }
    }
    loadDefaultDir()
    return () => {
      cancelled = true
    }
  }, [onSetDir])
}
