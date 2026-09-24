/**
 * VietKey DocGen — Form Helper Hooks
 * useExportShortcut: Lắng nghe phím tắt Ctrl + Enter để xuất tài liệu nhanh
 * useDefaultExportDir: Tự động nạp thư mục xuất mặc định từ cài đặt hệ thống
 */

import { useEffect, useRef } from 'react'

export function useExportShortcut(onExport: () => void, isExporting = false): void {
  const onExportRef = useRef(onExport)
  onExportRef.current = onExport

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isExporting) {
        e.preventDefault()
        onExportRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExporting])
}

export function useDefaultExportDir(onSetDir: (dir: string) => void): void {
  const onSetDirRef = useRef(onSetDir)
  onSetDirRef.current = onSetDir

  useEffect(() => {
    let cancelled = false
    const loadDefaultDir = async () => {
      if (window.api?.getSetting) {
        try {
          const dir = await window.api.getSetting('defaultExportDir')
          if (!cancelled && dir) {
            onSetDirRef.current(dir)
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
  }, [])
}

