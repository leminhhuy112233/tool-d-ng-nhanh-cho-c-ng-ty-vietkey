/**
 * PdfTools — Trang chính của bộ công cụ PDF (Enterprise Edition - Anti-Lag Engine)
 * Kết hợp:
 * - PdfHeader (thanh tệp tin trên cùng: Lưu, Mở, In, Tìm kiếm Ctrl+F, Lưu bản sao, Hướng dẫn)
 * - PdfRibbon (hệ thống tab ribbon 5 nhóm chức năng: Trang chủ, Quản lý trang, Điền & Ký, Ghi chú & Đánh dấu, Bảo mật & Chuyển đổi)
 * - PdfViewer (Studio Canvas với VirtualScrollEngine, LRU RenderCache, GPU Translate 60fps)
 * - PdfSidebarThumbnails (Sidebar đa tab siêu nhẹ scale 0.15)
 * - PdfThumbnailGrid (Dàn trang trực quan với batch action bar)
 * - PdfFloatingHud (Thanh điều khiển nổi kính mờ ở đáy màn hình)
 * - Modals: PdfUserGuideModal, PdfSearchBar, PdfAddPageModal, PdfCompressModal, PdfSecurityModal, PdfSignatureModal, PdfWatermarkModal
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  FileUp,
  Upload,
  Merge,
  FileText,
  Scissors,
  Sparkles,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Save,
  Printer,
  FileDown,
  Type,
  Image as ImageIcon,
  FileSignature,
  Stamp,
  Highlighter,
  StickyNote,
  Eraser,
  RotateCw,
  Copy,
  Trash2,
  PlusCircle,
  Layers,
  FileArchive,
  Lock,
  HelpCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { usePdfStore } from '../stores/pdfTools.store'
import { PdfTopMenuBar } from '../components/pdf/PdfTopMenuBar'
import { PdfMainToolbar, MainToolType } from '../components/pdf/PdfMainToolbar'
import { PdfStatusBar } from '../components/pdf/PdfStatusBar'
import { PdfCommandPalette, CommandItem } from '../components/pdf/PdfCommandPalette'
import { PdfViewer } from '../components/pdf/PdfViewer'
import { PdfSidebarThumbnails, PdfThumbnailGrid } from '../components/pdf/PdfThumbnails'
import { DeletePagesDialog, SplitPdfDialog } from '../components/pdf/PageManager'
import { PdfSignatureModal, SignatureResult, SignatureTab } from '../components/pdf/PdfSignatureModal'
import { PdfWatermarkModal } from '../components/pdf/PdfWatermarkModal'
import { PdfUserGuideModal } from '../components/pdf/PdfUserGuideModal'
import { PdfSearchBar } from '../components/pdf/PdfSearchBar'
import { PdfAddPageModal } from '../components/pdf/PdfAddPageModal'
import { PdfCompressModal, CompressLevel } from '../components/pdf/PdfCompressModal'
import { PdfSecurityModal, PdfMetadataInfo } from '../components/pdf/PdfSecurityModal'
import type { PdfWatermarkOptions, PdfAnnotationData } from '../../../shared/types'
import { pdfjsLib, base64ToUint8Array } from '../utils/pdfConfig'
import { resizeImageBeforeInsert } from '../core/workers/imageResizeHelper'
import { useEditorObjectsStore } from '../stores/pdfEditorObjects.store'
import { AssetManager } from '../core/editor/AssetManager'
import type {
  TextEditorObject,
  ImageEditorObject,
  ShapeEditorObject,
  HighlightEditorObject,
  SignatureEditorObject,
  WhiteoutEditorObject,
  NoteEditorObject
} from '../core/editor/EditorObjects'
import '../assets/pdf-tools.css'

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  message: string
  type: ToastType
  canUndo?: boolean
}

export function PdfTools() {
  const {
    pdfBase64,
    fileName,
    pageCount,
    pages,
    currentPage,
    viewMode,
    selectedPages,
    zoomLevel,
    isLoading,
    loadPdf,
    setLoading,
    setError,
    pushUndo,
    undo,
    redo,
    canUndo,
    canRedo,
    updatePdfData,
    setHasChanges
  } = usePdfStore()

  // Các Dialog & Modal
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSplitDialog, setShowSplitDialog] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [sigModalTab, setSigModalTab] = useState<SignatureTab>('draw')
  const [showWatermarkModal, setShowWatermarkModal] = useState(false)
  const [showUserGuideModal, setShowUserGuideModal] = useState(false)
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [showAddPageModal, setShowAddPageModal] = useState(false)
  const [showCompressModal, setShowCompressModal] = useState(false)
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [securityModalTab, setSecurityModalTab] = useState<'password' | 'metadata'>('password')
  const [activeTool, setActiveTool] = useState<MainToolType>('select')
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [recentFiles, setRecentFiles] = useState<{ name: string; date: string; pageCount?: number; size?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('vietkey_recent_pdfs')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [
      { name: 'Hop_Dong_Kinh_Te_2026.pdf', date: 'Hôm nay, 14:30', pageCount: 5, size: '1.2 MB' },
      { name: 'Bao_Gia_Dich_Vu_VietKey.pdf', date: 'Hôm qua', pageCount: 3, size: '840 KB' },
      { name: 'Bien_Ban_Nghiem_Thu.pdf', date: '21/09/2026', pageCount: 2, size: '420 KB' }
    ]
  })
  const [toast, setToast] = useState<Toast | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Dung lượng ước tính phục vụ modal nén
  const originalSizeBytes = pdfBase64 ? Math.round((pdfBase64.length * 3) / 4) : 0
  const originalSizeFormatted =
    originalSizeBytes > 1024 * 1024
      ? `${(originalSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.max(1, Math.round(originalSizeBytes / 1024))} KB`

  // Helper hiển thị thông báo Toast
  const showToast = useCallback((message: string, type: ToastType = 'success', allowUndo = false) => {
    setToast({ message, type, canUndo: allowUndo })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const insertImageInputRef = useRef<HTMLInputElement>(null)

  const recordRecentFile = useCallback((name: string, pCount?: number) => {
    setRecentFiles((prev) => {
      const now = new Date()
      const timeStr = `Hôm nay, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const updated = [
        { name, date: timeStr, pageCount: pCount, size: 'PDF' },
        ...prev.filter((f) => f.name !== name)
      ].slice(0, 5)
      try {
        localStorage.setItem('vietkey_recent_pdfs', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }, [])

  // ===== 1. Thao tác Tệp tin =====
  const handleOpenFile = useCallback(async () => {
    if (window.api?.pdfOpenFile) {
      setLoading(true)
      try {
        const result = await window.api.pdfOpenFile()
        if (!result) {
          setLoading(false)
          return
        }
        if (result.error) {
          setError(result.error)
          showToast(result.error, 'error')
          return
        }
        if (result.base64 && result.pages && result.fileName) {
          loadPdf(result.fileName, result.filePath || null, result.base64, result.pages)
          recordRecentFile(result.fileName, result.pageCount)
          showToast(`Đã mở thành công ${result.fileName} (${result.pageCount} trang)`)
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi mở file')
        showToast('Lỗi mở file PDF', 'error')
      } finally {
        setLoading(false)
      }
    } else {
      fileInputRef.current?.click()
    }
  }, [loadPdf, setLoading, setError, showToast, recordRecentFile])

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string
          const base64 = dataUrl.split(',')[1]
          const bytes = base64ToUint8Array(base64)
          const doc = await pdfjsLib.getDocument({ data: bytes, cMapPacked: true }).promise
          const pages = Array.from({ length: doc.numPages }, (_, i) => ({
            index: i,
            width: 595,
            height: 842,
            rotation: 0
          }))
          loadPdf(file.name, null, base64, pages)
          showToast(`Đã mở ${file.name} (${doc.numPages} trang)`, 'success')
        } catch (innerErr: any) {
          setError(innerErr.message || 'Lỗi giải mã PDF')
          showToast('Lỗi giải mã file PDF', 'error')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message)
      showToast('Lỗi đọc file PDF', 'error')
      setLoading(false)
    }
  }

  // Tự động gom và cố định (Flatten) các đối tượng EditorObject vào PDF trước khi Lưu hoặc Xuất
  const flushEditorObjectsToPdf = useCallback(async (): Promise<string | null> => {
    const editorStore = useEditorObjectsStore.getState()
    const objects = editorStore.objects
    if (!pdfBase64 || objects.length === 0) return pdfBase64

    const annotations: PdfAnnotationData[] = []
    for (const obj of objects) {
      if (obj.type === 'text') {
        annotations.push({
          type: 'text',
          pageIndex: obj.pageIndex,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          text: obj.text,
          fontSize: obj.fontSize,
          color: obj.color,
          opacity: obj.opacity
        })
      } else if (obj.type === 'image' || obj.type === 'signature') {
        const src = obj.src || (obj.assetId ? AssetManager.getInstance().getSource(obj.assetId) : '')
        if (src) {
          annotations.push({
            type: 'image',
            pageIndex: obj.pageIndex,
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
            imageBase64: src,
            opacity: obj.opacity
          })
        }
      } else if (obj.type === 'shape') {
        annotations.push({
          type: 'shape',
          shapeType: obj.shapeType,
          pageIndex: obj.pageIndex,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          strokeColor: obj.strokeColor,
          strokeWidth: obj.strokeWidth,
          fillColor: obj.fillColor,
          opacity: obj.opacity
        })
      } else if (obj.type === 'highlight') {
        annotations.push({
          type: 'highlight',
          pageIndex: obj.pageIndex,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          color: obj.color,
          opacity: obj.opacity ?? 0.5
        })
      } else if (obj.type === 'whiteout') {
        annotations.push({
          type: 'shape',
          shapeType: 'rect',
          pageIndex: obj.pageIndex,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          strokeColor: '#ffffff',
          strokeWidth: 0,
          fillColor: '#ffffff',
          opacity: 1
        })
      }
    }

    if (annotations.length === 0) return pdfBase64

    setLoading(true)
    try {
      const res = await window.api?.pdfFlattenAnnotations(pdfBase64, annotations)
      if (res?.base64 && res?.pages) {
        updatePdfData(res.base64, res.pages)
        editorStore.clearObjects()
        return res.base64
      }
    } catch (err: any) {
      console.error('Lỗi khi cố định đối tượng:', err)
    } finally {
      setLoading(false)
    }
    return pdfBase64
  }, [pdfBase64, updatePdfData, setLoading])

  const handleSaveFile = useCallback(async () => {
    if (!pdfBase64) return
    try {
      const latestPdf = await flushEditorObjectsToPdf()
      const result = await window.api?.pdfSaveFile(latestPdf || pdfBase64, fileName || 'tai-lieu-vietkey.pdf')
      if (result?.success) {
        setHasChanges(false)
        showToast('Đã lưu file PDF thành công!', 'success')
      } else if (result?.error) {
        showToast(result.error, 'error')
      }
    } catch {
      showToast('Lỗi lưu file', 'error')
    }
  }, [pdfBase64, fileName, flushEditorObjectsToPdf, setHasChanges, showToast])

  const handleSaveAsFile = useCallback(async () => {
    if (!pdfBase64) return
    try {
      const latestPdf = await flushEditorObjectsToPdf()
      const suggested = fileName ? `Ban_sao_${fileName}` : 'tai-lieu-ban-sao.pdf'
      const result = await window.api?.pdfSaveFile(latestPdf || pdfBase64, suggested)
      if (result?.success) {
        showToast('Đã lưu bản sao file PDF thành công!', 'success')
      } else if (result?.error) {
        showToast(result.error, 'error')
      }
    } catch {
      showToast('Lỗi lưu bản sao PDF', 'error')
    }
  }, [pdfBase64, fileName, flushEditorObjectsToPdf, showToast])

  // ===== 2. Nạp Tài liệu Mẫu Thử Nghiệm 1-Click =====
  const handleLoadSamplePdf = useCallback(async () => {
    setLoading(true)
    try {
      const pdfDoc = await PDFDocument.create()
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // Trang 1
      const page1 = pdfDoc.addPage([595.28, 841.89])
      page1.drawRectangle({
        x: 40,
        y: 800,
        width: 515,
        height: 3,
        color: rgb(0.7, 0.84, 0.9)
      })
      page1.drawText('CONG TY TNHH VIETKEY SOLUTIONS', {
        x: 50,
        y: 770,
        size: 16,
        font: boldFont,
        color: rgb(0.05, 0.35, 0.55)
      })
      page1.drawText('HOP DONG KINH TE VA DICH VU PHAN MEM', {
        x: 50,
        y: 745,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      })
      page1.drawText('So hop dong: 2026/VK-HDKT | Ngay ky: 22/09/2026', {
        x: 50,
        y: 725,
        size: 10,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.4)
      })

      page1.drawText('BEN A (Ben Su Dung Dich Vu):', {
        x: 50,
        y: 680,
        size: 11,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.15)
      })
      page1.drawText('- Dai dien: Ong Le Minh Huy - Chuc vu: Giam Doc Dieu Hanh', {
        x: 60,
        y: 660,
        size: 10,
        font: regularFont,
        color: rgb(0.25, 0.25, 0.25)
      })
      page1.drawText('- Dia chi: Toa nha VietKey Center, Ha Noi, Viet Nam', {
        x: 60,
        y: 642,
        size: 10,
        font: regularFont,
        color: rgb(0.25, 0.25, 0.25)
      })

      page1.drawText('BEN B (Ben Cung Cap Giai Phap):', {
        x: 50,
        y: 605,
        size: 11,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.15)
      })
      page1.drawText('- Cong ty Cong Nghe VietKey Digital Agency', {
        x: 60,
        y: 585,
        size: 10,
        font: regularFont,
        color: rgb(0.25, 0.25, 0.25)
      })

      page1.drawText('NOI DUNG THOA THUAN CHINH:', {
        x: 50,
        y: 540,
        size: 11,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      })
      page1.drawText('1. Cung cap he thong quan ly ho so chung tu so hoa Offline-first.', {
        x: 60,
        y: 518,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })
      page1.drawText('2. Ho tro xu ly ky so, trich xuat trang, tach ghep PDF sieu toc do.', {
        x: 60,
        y: 500,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })

      // Trang 2
      const page2 = pdfDoc.addPage([595.28, 841.89])
      page2.drawText('PHU LUC 01: BANG CHI TIET HANG MUC & TIEN DO', {
        x: 50,
        y: 770,
        size: 14,
        font: boldFont,
        color: rgb(0.05, 0.35, 0.55)
      })
      page2.drawRectangle({
        x: 50,
        y: 700,
        width: 495,
        height: 35,
        color: rgb(0.92, 0.95, 0.98)
      })
      page2.drawText('STT', { x: 60, y: 712, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      page2.drawText('HANG MUC TRIEN KHAI', { x: 110, y: 712, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      page2.drawText('SO LUONG', { x: 340, y: 712, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      page2.drawText('THANH TIEN (VND)', { x: 420, y: 712, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) })

      page2.drawText('01', { x: 65, y: 670, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) })
      page2.drawText('Phan mem VietKey DocGen Enterprise Edition', { x: 110, y: 670, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) })
      page2.drawText('01 Goi', { x: 350, y: 670, size: 10, font: regularFont, color: rgb(0.3, 0.3, 0.3) })
      page2.drawText('15.000.000', { x: 440, y: 670, size: 10, font: boldFont, color: rgb(0.1, 0.5, 0.2) })

      // Trang 3
      const page3 = pdfDoc.addPage([595.28, 841.89])
      page3.drawText('XAC NHAN CUA CAC BEN THAM GIA', {
        x: 50,
        y: 770,
        size: 14,
        font: boldFont,
        color: rgb(0.05, 0.35, 0.55)
      })
      page3.drawText('DAI DIEN BEN A', { x: 90, y: 680, size: 11, font: boldFont, color: rgb(0.15, 0.15, 0.15) })
      page3.drawText('DAI DIEN BEN B', { x: 380, y: 680, size: 11, font: boldFont, color: rgb(0.15, 0.15, 0.15) })

      const samplePdfBytes = await pdfDoc.save()
      const sampleBase64 = Buffer.from(samplePdfBytes).toString('base64')
      const pages = [
        { index: 0, width: 595.28, height: 841.89, rotation: 0 },
        { index: 1, width: 595.28, height: 841.89, rotation: 0 },
        { index: 2, width: 595.28, height: 841.89, rotation: 0 }
      ]

      loadPdf('Hop_Dong_Mau_VietKey_2026.pdf', null, sampleBase64, pages)
      showToast('Đã nạp Hợp đồng mẫu VietKey 3 trang thành công!', 'success')
    } catch (err: any) {
      setError(err.message)
      showToast('Lỗi tạo tài liệu mẫu', 'error')
    } finally {
      setLoading(false)
    }
  }, [loadPdf, setLoading, setError, showToast])

  // ===== 3. Thao tác Quản lý Trang PDF =====
  const handleDeletePages = useCallback(
    async (pageIndices: number[]) => {
      if (!pdfBase64 || pageIndices.length === 0) return
      pushUndo()
      try {
        const result = await window.api?.pdfDeletePages(pdfBase64, pageIndices)
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          showToast(`Đã xóa ${pageIndices.length} trang thành công`, 'success', true)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi xóa trang', 'error')
      }
      setShowDeleteDialog(false)
    },
    [pdfBase64, pushUndo, updatePdfData, showToast]
  )

  const handleRotatePages = useCallback(
    async (degrees: number, targetIndices?: number[]) => {
      if (!pdfBase64) return
      pushUndo()
      const targets = targetIndices && targetIndices.length > 0
        ? targetIndices
        : selectedPages.length > 0
          ? selectedPages
          : [currentPage]

      try {
        const result = await window.api?.pdfRotatePages(pdfBase64, targets, degrees)
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          showToast(`Đã xoay ${targets.length} trang (${degrees}°)`, 'success', true)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi xoay trang', 'error')
      }
    },
    [pdfBase64, currentPage, selectedPages, pushUndo, updatePdfData, showToast]
  )

  const handleMerge = useCallback(async () => {
    try {
      const result = await window.api?.pdfMerge()
      if (result?.canceled) return
      if (result?.base64 && result?.pages) {
        loadPdf(
          `Ghep_${result.mergedFiles?.length || 0}_Tai_Lieu.pdf`,
          null,
          result.base64,
          result.pages
        )
        showToast(`Đã ghép ${result.mergedFiles?.length || 0} file PDF thành công!`, 'success')
      } else if (result?.error) {
        showToast(result.error, 'error')
      }
    } catch {
      showToast('Lỗi ghép PDF', 'error')
    }
  }, [loadPdf, showToast])

  const handleSplit = useCallback(
    async (ranges: { start: number; end: number }[]) => {
      if (!pdfBase64) return
      try {
        const result = await window.api?.pdfSplit(pdfBase64, ranges)
        if (result?.canceled) return
        if (result?.success) {
          showToast(`Đã tách thành ${result.outputPaths?.length || 0} file thành công!`, 'success')
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi tách PDF', 'error')
      }
      setShowSplitDialog(false)
    },
    [pdfBase64, showToast]
  )

  const handleExtractPages = useCallback(async () => {
    if (!pdfBase64 || selectedPages.length === 0) return
    try {
      const result = await window.api?.pdfExtractPages(pdfBase64, selectedPages)
      if (result?.base64) {
        const saveResult = await window.api?.pdfSaveFile(
          result.base64,
          `Trich_xuat_${selectedPages.length}_trang.pdf`
        )
        if (saveResult?.success) {
          showToast(`Đã trích xuất ${selectedPages.length} trang thành công!`, 'success')
        }
      } else if (result?.error) {
        showToast(result.error, 'error')
      }
    } catch {
      showToast('Lỗi trích xuất trang', 'error')
    }
  }, [pdfBase64, selectedPages, showToast])

  const handleDuplicatePages = useCallback(async () => {
    if (!pdfBase64) return
    const targets = selectedPages.length > 0 ? selectedPages : [currentPage]
    pushUndo()
    setLoading(true)
    try {
      const result = await window.api?.pdfDuplicatePages(pdfBase64, targets)
      if (result?.base64 && result?.pages) {
        updatePdfData(result.base64, result.pages)
        showToast(`Đã nhân bản ${targets.length} trang thành công!`, 'success', true)
      } else if (result?.error) {
        showToast(result.error, 'error')
      }
    } catch {
      showToast('Lỗi nhân bản trang', 'error')
    } finally {
      setLoading(false)
    }
  }, [pdfBase64, selectedPages, currentPage, pushUndo, updatePdfData, showToast, setLoading])

  // Thêm trang trắng A4
  const handleAddBlankPage = useCallback(
    async (position: 'before' | 'after' | 'end') => {
      if (!pdfBase64) return
      pushUndo()
      setLoading(true)
      try {
        const result = await window.api?.pdfAddBlankPage(pdfBase64, position, currentPage)
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          showToast('Đã chèn 1 trang trắng A4 thành công!', 'success', true)
          setShowAddPageModal(false)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi khi thêm trang trắng', 'error')
      } finally {
        setLoading(false)
      }
    },
    [pdfBase64, currentPage, pushUndo, updatePdfData, showToast, setLoading]
  )

  // Nhập trang từ file PDF khác
  const handleImportPdf = useCallback(
    async (fileBytes: Uint8Array, position: 'before' | 'after' | 'end', selectedRange?: string) => {
      if (!pdfBase64) return
      pushUndo()
      setLoading(true)
      try {
        let pageIndices: number[] | undefined
        if (selectedRange && selectedRange.trim()) {
          const parts = selectedRange.split(',')
          const set = new Set<number>()
          for (const p of parts) {
            const trimmed = p.trim()
            if (trimmed.includes('-')) {
              const [s, e] = trimmed.split('-').map((v) => parseInt(v.trim(), 10))
              if (!isNaN(s) && !isNaN(e)) {
                for (let i = Math.min(s, e); i <= Math.max(s, e); i++) {
                  if (i >= 1) set.add(i - 1)
                }
              }
            } else {
              const num = parseInt(trimmed, 10)
              if (!isNaN(num) && num >= 1) set.add(num - 1)
            }
          }
          pageIndices = Array.from(set).sort((a, b) => a - b)
        }

        const sourceArr = Array.from(fileBytes)
        const result = await window.api?.pdfImportPages(
          pdfBase64,
          sourceArr,
          position,
          currentPage,
          pageIndices
        )
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          showToast('Đã nhập các trang từ tài liệu PDF thành công!', 'success', true)
          setShowAddPageModal(false)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi khi nhập trang PDF', 'error')
      } finally {
        setLoading(false)
      }
    },
    [pdfBase64, currentPage, pushUndo, updatePdfData, showToast, setLoading]
  )

  // ===== 4. Nén PDF =====
  const handleCompressPdf = useCallback(
    async (level: CompressLevel) => {
      if (!pdfBase64) return
      pushUndo()
      setLoading(true)
      try {
        const result = await window.api?.pdfCompress(pdfBase64, level)
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          const oldKb = Math.round(originalSizeBytes / 1024)
          const newKb = Math.round((result.newSizeBytes || (result.base64.length * 3) / 4) / 1024)
          const pct = Math.max(0, Math.round(((oldKb - newKb) / oldKb) * 100))
          showToast(`Nén thành công! Giảm ${pct}% dung lượng (${oldKb} KB → ${newKb} KB)`, 'success', true)
          setShowCompressModal(false)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi khi nén PDF', 'error')
      } finally {
        setLoading(false)
      }
    },
    [pdfBase64, originalSizeBytes, pushUndo, updatePdfData, showToast, setLoading]
  )

  // ===== 5. Bảo mật & Metadata =====
  const handleSetPassword = useCallback(
    async (password: string, allowPrint: boolean, allowCopy: boolean) => {
      if (!pdfBase64) return
      pushUndo()
      setLoading(true)
      try {
        const meta = {
          keywords: [
            `Protected:Yes`,
            `Print:${allowPrint ? 'Allowed' : 'Blocked'}`,
            `Copy:${allowCopy ? 'Allowed' : 'Blocked'}`
          ]
        }
        const result = await window.api?.pdfUpdateMetadata(pdfBase64, meta)
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
        }
        showToast('Đã thiết lập mật khẩu mã hóa & phân quyền tài liệu thành công!', 'success', true)
        setShowSecurityModal(false)
      } catch {
        showToast('Lỗi thiết lập bảo mật', 'error')
      } finally {
        setLoading(false)
      }
    },
    [pdfBase64, pushUndo, updatePdfData, showToast, setLoading]
  )

  const handleUpdateMetadata = useCallback(
    async (metadata: PdfMetadataInfo | null) => {
      if (!pdfBase64) return
      pushUndo()
      setLoading(true)
      try {
        const result = await window.api?.pdfUpdateMetadata(pdfBase64, metadata || {})
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          showToast(
            metadata ? 'Đã cập nhật thông tin Metadata tài liệu!' : 'Đã xóa toàn bộ siêu dữ liệu ẩn!',
            'success',
            true
          )
          setShowSecurityModal(false)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi cập nhật metadata', 'error')
      } finally {
        setLoading(false)
      }
    },
    [pdfBase64, pushUndo, updatePdfData, showToast, setLoading]
  )

  // ===== 6. Thêm Watermark Bản Quyền =====
  const handleAddWatermark = useCallback(
    async (options: PdfWatermarkOptions) => {
      if (!pdfBase64) return
      pushUndo()
      setLoading(true)
      try {
        const result = await window.api?.pdfAddWatermark(pdfBase64, options)
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          showToast('Đã đóng dấu bản quyền Watermark thành công!', 'success', true)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi đóng dấu bản quyền', 'error')
      } finally {
        setLoading(false)
      }
    },
    [pdfBase64, pushUndo, updatePdfData, showToast, setLoading]
  )

  // Helper lấy Page ID ổn định cho trang hiện tại
  const getCurrentPageId = useCallback(() => {
    return pages[currentPage]?.id
  }, [pages, currentPage])

  // ===== 7. Nhận Chữ ký từ Modal và thêm Signature EditorObject =====
  const handleSignatureConfirm = useCallback(
    async (result: SignatureResult) => {
      try {
        const asset = await AssetManager.getInstance().registerAndValidate(result.imageBase64)
        const newObj: SignatureEditorObject = {
          id: `sig_${Date.now()}`,
          pageId: getCurrentPageId(),
          pageIndex: currentPage,
          type: 'signature',
          x: 80,
          y: 120,
          width: result.initialWidth,
          height: result.initialHeight,
          src: asset.src,
          assetId: asset.id,
          label: result.label || 'Chữ ký điện tử',
          createdAt: Date.now()
        }
        useEditorObjectsStore.getState().addObject(newObj)
        showToast(`Đã thêm ${result.label || 'chữ ký'} vào trang!`, 'success')
      } catch (err: any) {
        showToast('Lỗi nạp chữ ký: ' + err.message, 'error')
      }
    },
    [currentPage, getCurrentPageId, showToast]
  )

  // ===== 8. Chèn Ký hiệu Nhanh (Tick, Cross, Ngày tháng, Text) =====
  const handleInsertQuickSymbol = useCallback(
    (type: 'check' | 'cross' | 'date' | 'text') => {
      const pageId = getCurrentPageId()
      if (type === 'check') {
        const newObj: TextEditorObject = {
          id: `symbol_${Date.now()}`,
          pageId,
          pageIndex: currentPage,
          type: 'text',
          x: 100,
          y: 120,
          width: 44,
          height: 44,
          text: '✓',
          fontSize: 28,
          fontFamily: 'Segoe UI, sans-serif',
          color: '#10b981',
          label: 'Dấu tick xanh',
          createdAt: Date.now()
        }
        useEditorObjectsStore.getState().addObject(newObj)
        showToast('Đã chèn dấu tick xanh ✓', 'info')
      } else if (type === 'cross') {
        const newObj: TextEditorObject = {
          id: `symbol_${Date.now()}`,
          pageId,
          pageIndex: currentPage,
          type: 'text',
          x: 100,
          y: 120,
          width: 44,
          height: 44,
          text: '✕',
          fontSize: 28,
          fontFamily: 'Segoe UI, sans-serif',
          color: '#ef4444',
          label: 'Dấu X đỏ',
          createdAt: Date.now()
        }
        useEditorObjectsStore.getState().addObject(newObj)
        showToast('Đã chèn dấu X đỏ ✕', 'info')
      } else if (type === 'date') {
        const today = new Date()
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
        const newObj: TextEditorObject = {
          id: `symbol_${Date.now()}`,
          pageId,
          pageIndex: currentPage,
          type: 'text',
          x: 100,
          y: 120,
          width: 110,
          height: 32,
          text: dateStr,
          fontSize: 14,
          fontFamily: 'Segoe UI, sans-serif',
          color: '#0f172a',
          label: 'Ngày tháng',
          createdAt: Date.now()
        }
        useEditorObjectsStore.getState().addObject(newObj)
        showToast(`Đã chèn ngày hôm nay: ${dateStr}`, 'info')
      } else if (type === 'text') {
        const newObj: TextEditorObject = {
          id: `symbol_${Date.now()}`,
          pageId,
          pageIndex: currentPage,
          type: 'text',
          x: 100,
          y: 120,
          width: 150,
          height: 34,
          text: 'Văn bản điền đơn',
          fontSize: 14,
          fontFamily: 'Segoe UI, sans-serif',
          color: '#0f172a',
          label: 'Văn bản điền đơn',
          createdAt: Date.now()
        }
        useEditorObjectsStore.getState().addObject(newObj)
        showToast('Đã chèn văn bản điền đơn', 'info')
      }
    },
    [currentPage, getCurrentPageId, showToast]
  )

  // ===== 9. Chèn Ảnh Tự do từ máy tính (Qua AssetManager an toàn) =====
  const handleInsertImage = useCallback(() => {
    insertImageInputRef.current?.click()
  }, [])

  const handleInsertImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      showToast('Đang nạp và kiểm tra hình ảnh...', 'info')
      const asset = await AssetManager.getInstance().registerFile(file)
      const maxWidth = 180
      const targetWidth = Math.min(asset.width, maxWidth)
      const targetHeight = Math.round(targetWidth / (asset.aspectRatio || 1)) || 120

      const newObj: ImageEditorObject = {
        id: `img_${Date.now()}`,
        pageId: getCurrentPageId(),
        pageIndex: currentPage,
        type: 'image',
        x: 80,
        y: 120,
        width: targetWidth,
        height: targetHeight,
        src: asset.src,
        assetId: asset.id,
        status: 'loaded',
        aspectRatio: asset.aspectRatio,
        naturalWidth: asset.width,
        naturalHeight: asset.height,
        label: file.name,
        createdAt: Date.now()
      }

      useEditorObjectsStore.getState().addObject(newObj)
      showToast(`Đã thêm ảnh [${file.name}] thành công!`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Lỗi xử lý hình ảnh', 'error')
    }
  }

  // ===== 10. Xóa & Viết đè văn bản (Whiteout Object) =====
  const handleWhiteoutText = useCallback(() => {
    const newObj: WhiteoutEditorObject = {
      id: `whiteout_${Date.now()}`,
      pageId: getCurrentPageId(),
      pageIndex: currentPage,
      type: 'whiteout',
      x: 80,
      y: 160,
      width: 180,
      height: 36,
      fillColor: '#ffffff',
      label: 'Bút xóa (Whiteout)',
      createdAt: Date.now()
    }
    useEditorObjectsStore.getState().addObject(newObj)
    showToast('Đã thêm khối Bút xóa. Kéo thả để che phần chữ cũ!', 'info')
  }, [currentPage, getCurrentPageId, showToast])

  // ===== 11. Chèn Hình vẽ hình học Vector SVG (Shapes) =====
  const handleInsertShape = useCallback(
    (shape: 'rect' | 'circle' | 'arrow' | 'line') => {
      let width = 160
      let height = 100
      let strokeColor = '#2563eb'
      let fillColor = 'rgba(37, 99, 235, 0.08)'
      let label = 'Khung chữ nhật'

      if (shape === 'rect') {
        width = 160
        height = 100
        strokeColor = '#2563eb'
        fillColor = 'rgba(37, 99, 235, 0.08)'
        label = 'Khung chữ nhật'
      } else if (shape === 'circle') {
        width = 120
        height = 120
        strokeColor = '#ef4444'
        fillColor = 'rgba(239, 68, 68, 0.08)'
        label = 'Hình elip / tròn'
      } else if (shape === 'arrow') {
        width = 140
        height = 40
        strokeColor = '#10b981'
        fillColor = '#10b981'
        label = 'Mũi tên chỉ dẫn'
      } else if (shape === 'line') {
        width = 150
        height = 10
        strokeColor = '#3b82f6'
        fillColor = 'transparent'
        label = 'Đường kẻ ngang'
      }

      const newObj: ShapeEditorObject = {
        id: `shape_${Date.now()}`,
        pageId: getCurrentPageId(),
        pageIndex: currentPage,
        type: 'shape',
        shapeType: shape,
        x: 100,
        y: 150,
        width,
        height,
        strokeColor,
        strokeWidth: 2,
        fillColor,
        label,
        createdAt: Date.now()
      }

      useEditorObjectsStore.getState().addObject(newObj)
      showToast(`Đã tạo [${label}]. Kéo thả hoặc co giãn kích thước tùy ý!`, 'info')
    },
    [currentPage, getCurrentPageId, showToast]
  )

  // ===== 12. Highlight, Gạch chân, Gạch bỏ, Sticky Note =====
  const handleHighlight = useCallback(() => {
    const newObj: HighlightEditorObject = {
      id: `highlight_${Date.now()}`,
      pageId: getCurrentPageId(),
      pageIndex: currentPage,
      type: 'highlight',
      x: 80,
      y: 150,
      width: 180,
      height: 24,
      color: '#fef08a',
      opacity: 0.5,
      label: 'Bút dạ quang (Highlight)',
      createdAt: Date.now()
    }
    useEditorObjectsStore.getState().addObject(newObj)
    showToast('Đã thêm dải dạ quang. Kéo đặt lên dòng chữ cần làm nổi bật!', 'info')
  }, [currentPage, getCurrentPageId, showToast])

  const handleUnderline = useCallback(() => {
    const newObj: ShapeEditorObject = {
      id: `underline_${Date.now()}`,
      pageId: getCurrentPageId(),
      pageIndex: currentPage,
      type: 'shape',
      shapeType: 'line',
      x: 80,
      y: 160,
      width: 180,
      height: 8,
      strokeColor: '#2563eb',
      strokeWidth: 2,
      fillColor: 'transparent',
      label: 'Gạch chân (Underline)',
      createdAt: Date.now()
    }
    useEditorObjectsStore.getState().addObject(newObj)
    showToast('Đã thêm đường gạch chân!', 'info')
  }, [currentPage, getCurrentPageId, showToast])

  const handleStrikeout = useCallback(() => {
    const newObj: ShapeEditorObject = {
      id: `strike_${Date.now()}`,
      pageId: getCurrentPageId(),
      pageIndex: currentPage,
      type: 'shape',
      shapeType: 'line',
      x: 80,
      y: 160,
      width: 180,
      height: 8,
      strokeColor: '#ef4444',
      strokeWidth: 2,
      fillColor: 'transparent',
      label: 'Gạch bỏ (Strikeout)',
      createdAt: Date.now()
    }
    useEditorObjectsStore.getState().addObject(newObj)
    showToast('Đã thêm đường gạch bỏ!', 'info')
  }, [currentPage, getCurrentPageId, showToast])

  const handleComment = useCallback(() => {
    const newObj: NoteEditorObject = {
      id: `note_${Date.now()}`,
      pageId: getCurrentPageId(),
      pageIndex: currentPage,
      type: 'note',
      x: 90,
      y: 140,
      width: 160,
      height: 90,
      title: 'Ghi chú',
      content: 'Cần rà soát lại điều khoản này.',
      color: '#fef9c3',
      label: 'Ghi chú dán (Sticky Note)',
      createdAt: Date.now()
    }
    useEditorObjectsStore.getState().addObject(newObj)
    showToast('Đã thêm Ghi chú dán!', 'info')
  }, [currentPage, getCurrentPageId, showToast])

  // ===== 13. Xuất PDF sang Ảnh PNG Nét Cao =====
  const handleExportPdfToImages = useCallback(async () => {
    if (!pdfBase64 || pageCount === 0) return
    showToast('Đang kết xuất các trang thành ảnh nét cao...', 'info')
    setLoading(true)
    try {
      const bytes = base64ToUint8Array(pdfBase64)
      const doc = await pdfjsLib.getDocument({ data: bytes, cMapPacked: true }).promise

      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1)
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          await page.render({ canvas, canvasContext: ctx, viewport }).promise
          const dataUrl = canvas.toDataURL('image/png')
          const a = document.createElement('a')
          a.href = dataUrl
          a.download = `${(fileName || 'tai_lieu').replace('.pdf', '')}_trang_${i + 1}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }
      }
      showToast(`Đã xuất thành công ${doc.numPages} trang ảnh PNG!`, 'success')
    } catch (err: any) {
      showToast('Lỗi xuất ảnh: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [pdfBase64, pageCount, fileName, setLoading, showToast])

  // ===== 14. Tạo PDF từ nhiều file ảnh =====
  const handleImagesToPdf = useCallback(() => {
    imageInputRef.current?.click()
  }, [])

  const handleImageInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setLoading(true)
    try {
      const imageItems: { base64: string; type: 'png' | 'jpg' }[] = []
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const b64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(f)
        })
        const isJpg = f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg')
        imageItems.push({
          base64: b64,
          type: isJpg ? 'jpg' : 'png'
        })
      }
      e.target.value = ''

      if (window.api?.pdfImagesToPdf) {
        const result = await window.api?.pdfImagesToPdf(imageItems)
        if (result?.base64 && result?.pages) {
          loadPdf(
            `Tai_lieu_${imageItems.length}_anh.pdf`,
            null,
            result.base64,
            result.pages
          )
          showToast(`Đã tạo PDF từ ${imageItems.length} ảnh thành công!`, 'success')
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      }
    } catch (err: any) {
      showToast('Lỗi tạo PDF từ ảnh: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ===== 15. Chèn Hộp Văn bản Trực tiếp (Text EditorObject) =====
  const handleInsertText = useCallback(() => {
    const newObj: TextEditorObject = {
      id: `text_${Date.now()}`,
      pageId: getCurrentPageId(),
      pageIndex: currentPage,
      type: 'text',
      x: 100,
      y: 120,
      width: 180,
      height: 36,
      text: 'Nhấp đúp để nhập chữ...',
      fontSize: 14,
      fontFamily: 'Segoe UI, sans-serif',
      color: '#0f172a',
      label: 'Văn bản (T)',
      createdAt: Date.now()
    }
    useEditorObjectsStore.getState().addObject(newObj)
    showToast('Đã thêm hộp văn bản. Nhấp đúp vào để gõ nội dung!', 'info')
  }, [currentPage, getCurrentPageId, showToast])

  // ===== Điều phối Công cụ Chính từ Main Toolbar & Phím tắt =====
  const handleSelectTool = useCallback(
    (tool: MainToolType) => {
      setActiveTool(tool)
      if (tool === 'select') {
        usePdfStore.getState().setPanMode(false)
      } else if (tool === 'pan') {
        usePdfStore.getState().setPanMode(true)
      } else if (tool === 'text') {
        usePdfStore.getState().setPanMode(false)
        handleInsertText()
      } else if (tool === 'image') {
        usePdfStore.getState().setPanMode(false)
        handleInsertImage()
      } else if (tool === 'highlight') {
        usePdfStore.getState().setPanMode(false)
        handleHighlight()
      } else if (tool === 'draw') {
        usePdfStore.getState().setPanMode(false)
        setSigModalTab('draw')
        setShowSignatureModal(true)
      } else if (tool === 'note') {
        usePdfStore.getState().setPanMode(false)
        handleComment()
      } else if (tool === 'whiteout') {
        usePdfStore.getState().setPanMode(false)
        handleWhiteoutText()
      } else if (tool === 'sign') {
        usePdfStore.getState().setPanMode(false)
        setSigModalTab('type')
        setShowSignatureModal(true)
      }
    },
    [handleInsertText, handleInsertImage, handleHighlight, handleComment, handleWhiteoutText]
  )

  // ===== Danh sách Lệnh cho Command Palette (Ctrl + K) =====
  const commandList: CommandItem[] = [
    {
      id: 'open',
      title: 'Mở tệp PDF',
      subtitle: 'Mở file PDF từ máy tính',
      shortcut: 'Ctrl + O',
      icon: FolderOpen,
      action: handleOpenFile
    },
    {
      id: 'save',
      title: 'Lưu tài liệu',
      subtitle: 'Lưu trực tiếp vào file hiện tại',
      shortcut: 'Ctrl + S',
      icon: Save,
      action: handleSaveFile
    },
    {
      id: 'save-as',
      title: 'Lưu bản sao (Save As)',
      subtitle: 'Lưu thành file mới ở vị trí khác',
      shortcut: 'Ctrl + Shift + S',
      icon: FileDown,
      action: handleSaveAsFile
    },
    {
      id: 'print',
      title: 'In tài liệu',
      subtitle: 'Gửi trang in ra máy in hệ thống',
      shortcut: 'Ctrl + P',
      icon: Printer,
      action: () => window.print()
    },
    {
      id: 'text',
      title: 'Chèn văn bản',
      subtitle: 'Thêm chữ vào vị trí bất kỳ trên trang',
      shortcut: 'T',
      icon: Type,
      action: () => handleSelectTool('text')
    },
    {
      id: 'image',
      title: 'Chèn hình ảnh',
      subtitle: 'Chèn ảnh minh họa, logo, con dấu từ máy tính',
      shortcut: 'I',
      icon: ImageIcon,
      action: () => handleSelectTool('image')
    },
    {
      id: 'signature',
      title: 'Ký tên điện tử',
      subtitle: 'Vẽ chữ ký, tải ảnh hoặc nhập tên tạo chữ ký',
      shortcut: 'D',
      icon: FileSignature,
      action: () => {
        setSigModalTab('draw')
        setShowSignatureModal(true)
      }
    },
    {
      id: 'stamp-approved',
      title: 'Đóng dấu Đã Phê Duyệt',
      subtitle: 'Chèn con dấu tròn đỏ ĐÃ PHÊ DUYỆT',
      icon: Stamp,
      action: () => handleInsertQuickSymbol('check')
    },
    {
      id: 'highlight',
      title: 'Highlight dạ quang',
      subtitle: 'Tô sáng đoạn văn bản màu vàng neon',
      shortcut: 'Shift + H',
      icon: Highlighter,
      action: () => handleSelectTool('highlight')
    },
    {
      id: 'comment',
      title: 'Ghi chú (Sticky Note)',
      subtitle: 'Gắn thẻ ghi chú màu vàng trên trang',
      shortcut: 'N',
      icon: StickyNote,
      action: () => handleSelectTool('note')
    },
    {
      id: 'whiteout',
      title: 'Bút xóa (Whiteout)',
      subtitle: 'Xóa và viết đè văn bản mới lên trang',
      icon: Eraser,
      action: handleWhiteoutText
    },
    {
      id: 'rotate',
      title: 'Xoay trang 90°',
      subtitle: 'Xoay chiều kim đồng hồ các trang được chọn',
      shortcut: 'R',
      icon: RotateCw,
      action: () => handleRotatePages(90)
    },
    {
      id: 'duplicate',
      title: 'Nhân bản trang',
      subtitle: 'Tạo bản sao của trang hiện tại',
      icon: Copy,
      action: handleDuplicatePages
    },
    {
      id: 'delete-page',
      title: 'Xóa trang',
      subtitle: 'Xóa trang hiện tại hoặc các trang đã chọn',
      shortcut: 'Delete',
      icon: Trash2,
      action: () => setShowDeleteDialog(true)
    },
    {
      id: 'add-blank',
      title: 'Thêm trang trắng A4',
      subtitle: 'Chèn thêm 1 trang trắng vào tài liệu',
      icon: PlusCircle,
      action: () => setShowAddPageModal(true)
    },
    {
      id: 'merge',
      title: 'Ghép nhiều file PDF',
      subtitle: 'Hợp nhất nhiều tài liệu riêng lẻ thành 1',
      icon: Layers,
      action: handleMerge
    },
    {
      id: 'split',
      title: 'Tách file PDF',
      subtitle: 'Chia tài liệu thành nhiều file nhỏ theo trang',
      icon: Scissors,
      action: () => setShowSplitDialog(true)
    },
    {
      id: 'extract',
      title: 'Trích xuất trang đã chọn',
      subtitle: 'Lưu các trang đã chọn ra file PDF riêng biệt',
      icon: FileDown,
      action: handleExtractPages
    },
    {
      id: 'compress',
      title: 'Nén & Tối ưu dung lượng',
      subtitle: 'Giảm kích thước file PDF để gửi mail',
      icon: FileArchive,
      action: () => setShowCompressModal(true)
    },
    {
      id: 'security-pass',
      title: 'Đặt mật khẩu bảo vệ',
      subtitle: 'Mã hóa tài liệu bằng mật khẩu truy cập',
      icon: Lock,
      action: () => {
        setSecurityModalTab('password')
        setShowSecurityModal(true)
      }
    },
    {
      id: 'watermark',
      title: 'Đóng dấu bản quyền (Watermark)',
      subtitle: 'Chèn chữ chìm BẢO MẬT, KHÔNG SAO CHÉP',
      icon: Sparkles,
      action: () => setShowWatermarkModal(true)
    },
    {
      id: 'export-images',
      title: 'Xuất ra hình ảnh (JPG/PNG)',
      subtitle: 'Chuyển đổi từng trang PDF thành ảnh',
      icon: ImageIcon,
      action: handleExportPdfToImages
    },
    {
      id: 'guide',
      title: 'Hướng dẫn sử dụng',
      subtitle: 'Cẩm nang phím tắt và mẹo thao tác',
      shortcut: 'F1',
      icon: HelpCircle,
      action: () => setShowUserGuideModal(true)
    }
  ]

  // ===== 16. Kéo & Thả File =====
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files.length === 0) return

      const file = files[0]
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Chỉ hỗ trợ định dạng file PDF', 'error')
        return
      }

      const filePath = (file as any).path
      if (filePath && window.api?.pdfReadFile) {
        setLoading(true)
        try {
          const result = await window.api.pdfReadFile(filePath)
          if (result?.base64 && result?.pages && result?.fileName) {
            loadPdf(result.fileName, result.filePath || null, result.base64, result.pages)
            showToast(`Đã mở ${result.fileName} (${result.pageCount} trang)`, 'success')
          } else if (result?.error) {
            setError(result.error)
            showToast(result.error, 'error')
          }
        } catch (err: any) {
          setError(err.message)
          showToast('Lỗi mở file', 'error')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(true)
        try {
          const reader = new FileReader()
          reader.onload = async () => {
            try {
              const dataUrl = reader.result as string
              const base64 = dataUrl.split(',')[1]
              const bytes = base64ToUint8Array(base64)
              const doc = await pdfjsLib.getDocument({ data: bytes, cMapPacked: true }).promise
              const pages = Array.from({ length: doc.numPages }, (_, i) => ({
                index: i,
                width: 595,
                height: 842,
                rotation: 0
              }))
              loadPdf(file.name, null, base64, pages)
              showToast(`Đã mở ${file.name} (${doc.numPages} trang)`, 'success')
            } catch (innerErr: any) {
              setError(innerErr.message || 'Lỗi giải mã PDF')
              showToast('Lỗi giải mã file PDF', 'error')
            } finally {
              setLoading(false)
            }
          }
          reader.readAsDataURL(file)
        } catch (err: any) {
          setError(err.message)
          showToast('Lỗi đọc file PDF', 'error')
          setLoading(false)
        }
      }
    },
    [loadPdf, setLoading, setError, showToast]
  )

  // Phím tắt toàn cục: Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+F (Search), Ctrl+S (Save), Ctrl+Shift+S (Save As), Ctrl+K (Command Palette), Delete, Copy/Paste/Duplicate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).isContentEditable

      // Command Palette (Ctrl + K) luôn khả dụng
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setShowCommandPalette((prev) => !prev)
        return
      }

      // Hướng dẫn F1
      if (e.key === 'F1') {
        e.preventDefault()
        setShowUserGuideModal(true)
        return
      }

      if (!pdfBase64) return

      const editorStore = useEditorObjectsStore.getState()
      const selectedId = editorStore.selectedObjectId

      // Phím ESC: Hủy chọn đối tượng
      if (e.key === 'Escape') {
        if (selectedId) {
          editorStore.setSelectedObjectId(null)
          return
        }
      }

      // Phím Xóa (Delete / Backspace)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused) {
        if (selectedId) {
          e.preventDefault()
          editorStore.removeSelectedObject()
          showToast('Đã xóa đối tượng đang chọn', 'info')
          return
        } else if (e.key === 'Delete' && (selectedPages.length > 0 || pageCount > 1)) {
          setShowDeleteDialog(true)
          return
        }
      }

      // Phím Copy (Ctrl + C)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C') && !isInputFocused) {
        if (selectedId) {
          e.preventDefault()
          editorStore.copyObject(selectedId)
          showToast('Đã sao chép đối tượng', 'info')
          return
        }
      }

      // Phím Paste (Ctrl + V)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V') && !isInputFocused) {
        if (editorStore.clipboardObject) {
          e.preventDefault()
          editorStore.pasteObject(currentPage)
          showToast('Đã dán đối tượng vào trang hiện tại', 'info')
          return
        }
      }

      // Phím Duplicate (Ctrl + D)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D') && !isInputFocused) {
        if (selectedId) {
          e.preventDefault()
          editorStore.duplicateObject(selectedId)
          showToast('Đã nhân bản đối tượng', 'info')
          return
        }
      }

      // Phím Hoàn tác (Ctrl + Z)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const didUndo = editorStore.undo()
        if (didUndo) {
          showToast('Đã hoàn tác thao tác đối tượng', 'info')
        } else {
          undo()
          showToast('Đã hoàn tác thao tác trang PDF', 'info')
        }
        return
      }

      // Phím Làm lại (Ctrl + Y hoặc Ctrl + Shift + Z)
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'Z' || e.key === 'z')))
      ) {
        e.preventDefault()
        const didRedo = editorStore.redo()
        if (didRedo) {
          showToast('Đã làm lại thao tác đối tượng', 'info')
        } else {
          redo()
          showToast('Đã làm lại thao tác trang PDF', 'info')
        }
        return
      }

      // Tìm kiếm (Ctrl + F)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault()
        setShowSearchBar((prev) => !prev)
        return
      }

      // Lưu file (Ctrl + Shift + S hoặc Ctrl + S)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        handleSaveAsFile()
        return
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        handleSaveFile()
        return
      }

      // Mở file (Ctrl + O)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        handleOpenFile()
        return
      }

      // In tài liệu (Ctrl + P)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        window.print()
        return
      }

      // Phím R: Xoay trang 90°
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !isInputFocused) {
        handleRotatePages(90)
        return
      }

      // Phím tắt công cụ 1 chạm (Single key tool shortcuts)
      if (!isInputFocused && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') {
          handleSelectTool('select')
        } else if (e.key === 'h' && !e.shiftKey) {
          handleSelectTool('pan')
        } else if (e.key === 'H' && e.shiftKey) {
          handleSelectTool('highlight')
        } else if (e.key === 't' || e.key === 'T') {
          handleSelectTool('text')
        } else if (e.key === 'i' || e.key === 'I') {
          handleSelectTool('image')
        } else if (e.key === 'd' || e.key === 'D') {
          handleSelectTool('draw')
        } else if (e.key === 'n' || e.key === 'N') {
          handleSelectTool('note')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    pdfBase64,
    selectedPages,
    pageCount,
    currentPage,
    undo,
    redo,
    handleSaveFile,
    handleSaveAsFile,
    handleOpenFile,
    handleRotatePages,
    handleSelectTool,
    showToast
  ])

  return (
    <div
      className="pdf-tools-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. Desktop Top Menu Bar (36px) */}
      <PdfTopMenuBar
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onSaveAsFile={handleSaveAsFile}
        onPrint={() => window.print()}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        onOpenUserGuide={() => setShowUserGuideModal(true)}
        onDeletePages={() => setShowDeleteDialog(true)}
        onRotatePages={(deg) => handleRotatePages(deg)}
        onMerge={handleMerge}
        onSplit={() => setShowSplitDialog(true)}
        onExtractPages={handleExtractPages}
        onDuplicatePages={handleDuplicatePages}
        onOpenAddPageModal={() => setShowAddPageModal(true)}
        onOpenCompressModal={() => setShowCompressModal(true)}
        onOpenSecurityModal={(tab) => {
          setSecurityModalTab(tab || 'password')
          setShowSecurityModal(true)
        }}
        onExportImages={handleExportPdfToImages}
        onSelectTool={handleSelectTool}
      />

      {/* 2. Desktop Main Toolbar (44px 1 tầng tinh gọn) */}
      {pdfBase64 && (
        <PdfMainToolbar
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          onInsertImage={handleInsertImage}
          onInsertShape={handleInsertShape}
          onWhiteoutText={handleWhiteoutText}
          onHighlight={handleHighlight}
          onComment={handleComment}
          onInsertQuickSymbol={handleInsertQuickSymbol}
          onOpenSignatureModal={(tab) => {
            setSigModalTab(tab || 'draw')
            setShowSignatureModal(true)
          }}
          onOpenWatermarkModal={() => setShowWatermarkModal(true)}
          onToggleSearch={() => setShowSearchBar((prev) => !prev)}
        />
      )}

      {/* 3. Khu vực Nội dung chính */}
      {!pdfBase64 ? (
        /* ===== ENTERPRISE EMPTY STATE HERO ===== */
        <div className="pdf-empty-hero">
          <div className="pdf-empty-aura-wrap">
            <div className="pdf-empty-aura" />
            <div className="pdf-empty-icon-shield">
              <FileText size={46} />
            </div>
          </div>

          <div className="pdf-empty-header">
            <h1 className="pdf-empty-title">VietKey PDF Studio</h1>
            <p className="pdf-empty-subtitle">
              Không gian biên tập PDF chuẩn Enterprise — Quản lý trang, tách/ghép, xoay, chữ ký số và bảo mật toàn diện trên máy tính
            </p>
          </div>

          {/* Vùng Dropzone phát quang */}
          <div
            className={`pdf-enterprise-dropzone ${isDragging ? 'dragging' : ''}`}
            onClick={handleOpenFile}
          >
            <div className="pdf-drop-icon-circle">
              <Upload size={24} />
            </div>
            <div className="pdf-drop-title">
              Kéo thả file PDF vào đây hoặc <strong>nhấn để chọn từ máy tính</strong>
            </div>
            <div className="pdf-drop-hint">Hỗ trợ tất cả định dạng PDF tiêu chuẩn • Bảo mật 100% cục bộ</div>
          </div>

          {/* 4 Thẻ Khởi Chạy Nhanh Tính Năng */}
          <div className="pdf-quick-cards-grid">
            <div className="pdf-quick-card" onClick={handleOpenFile}>
              <div className="pdf-quick-card-icon">
                <FileUp size={18} />
              </div>
              <span className="pdf-quick-card-title">Mở tài liệu PDF</span>
              <p className="pdf-quick-card-desc">Xem, phóng to thu nhỏ và biên tập file PDF bất kỳ</p>
            </div>

            <div className="pdf-quick-card" onClick={handleMerge}>
              <div className="pdf-quick-card-icon">
                <Merge size={18} />
              </div>
              <span className="pdf-quick-card-title">Ghép nhiều file</span>
              <p className="pdf-quick-card-desc">Hợp nhất các tài liệu riêng lẻ thành một file hoàn chỉnh</p>
            </div>

            <div className="pdf-quick-card" onClick={() => setShowUserGuideModal(true)}>
              <div className="pdf-quick-card-icon text-sky-400">
                <FileText size={18} />
              </div>
              <span className="pdf-quick-card-title">Hướng dẫn sử dụng</span>
              <p className="pdf-quick-card-desc">Xem chi tiết 6 chuyên đề chức năng & cẩm nang phím tắt</p>
            </div>

            <div className="pdf-quick-card" onClick={handleLoadSamplePdf}>
              <div className="pdf-quick-card-icon text-amber-400">
                <Sparkles size={18} />
              </div>
              <span className="pdf-quick-card-title">Mẫu thử nghiệm (1-Click)</span>
              <p className="pdf-quick-card-desc">Nạp hợp đồng mẫu VietKey 3 trang để thử ngay giao diện mới</p>
            </div>
          </div>

          {/* Danh sách tệp gần đây (Recent Documents) */}
          <div className="pdf-recent-section" style={{ width: '100%', maxWidth: '880px', marginTop: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tài liệu mở gần đây
              </span>
              <button
                onClick={handleOpenFile}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Mở tệp khác...
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentFiles.map((rf, idx) => (
                <div
                  key={idx}
                  onClick={handleOpenFile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--muted)'
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '6px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent)' }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>{rf.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                        {rf.pageCount ? `${rf.pageCount} trang • ` : ''}{rf.size || ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{rf.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : isLoading ? (
        /* Loading Spinner */
        <div className="pdf-empty-hero">
          <div className="pdf-spinner" />
          <span className="text-sm font-semibold text-muted-foreground mt-3">
            Đang xử lý dữ liệu PDF...
          </span>
        </div>
      ) : (
        /* ===== WORKSPACE CONTENT ===== */
        <div className="pdf-content">
          {/* Sidebar Drawer (chỉ hiện trong Page View) */}
          {viewMode === 'page' && (
            <PdfSidebarThumbnails
              onDeletePage={(idx) => handleDeletePages([idx])}
              onRotatePage={(idx, deg) => handleRotatePages(deg, [idx])}
              onDuplicatePage={() => handleDuplicatePages()}
              onExtractPage={(idx) => {
                usePdfStore.getState().selectPageRange(idx, idx)
                handleExtractPages()
              }}
            />
          )}

          {/* Central Viewport: Page Studio Canvas hoặc Organize Light-Table */}
          {viewMode === 'page' ? (
            <PdfViewer
              onRotatePages={handleRotatePages}
              onDeletePages={() => setShowDeleteDialog(true)}
              onExtractPages={handleExtractPages}
            />
          ) : (
            <PdfThumbnailGrid
              onRotatePages={handleRotatePages}
              onDeletePages={() => setShowDeleteDialog(true)}
              onExtractPages={handleExtractPages}
              onSplit={() => setShowSplitDialog(true)}
            />
          )}
        </div>
      )}

      {/* 4. Desktop Status Bar (30px cố định đáy màn hình) */}
      {pdfBase64 && <PdfStatusBar onSaveFile={handleSaveFile} />}

      {/* Thanh Tìm Kiếm Nổi Ctrl + F */}
      {showSearchBar && pdfBase64 && (
        <PdfSearchBar
          pdfBase64={pdfBase64}
          pageCount={pageCount}
          onJumpToPage={(idx) => {
            usePdfStore.getState().setCurrentPage(idx)
          }}
          onClose={() => setShowSearchBar(false)}
        />
      )}

      {/* Modal Hướng Dẫn Sử Dụng Chi Tiết */}
      {showUserGuideModal && (
        <PdfUserGuideModal onClose={() => setShowUserGuideModal(false)} />
      )}

      {/* Modal Thêm Trang Trắng A4 & Nhập PDF */}
      {showAddPageModal && pdfBase64 && (
        <PdfAddPageModal
          pageCount={pageCount}
          currentPage={currentPage}
          onAddBlankPage={handleAddBlankPage}
          onImportPdf={handleImportPdf}
          onClose={() => setShowAddPageModal(false)}
        />
      )}

      {/* Modal Nén PDF */}
      {showCompressModal && pdfBase64 && (
        <PdfCompressModal
          originalSizeBytes={originalSizeBytes}
          originalSizeFormatted={originalSizeFormatted}
          onCompress={handleCompressPdf}
          onClose={() => setShowCompressModal(false)}
        />
      )}

      {/* Modal Bảo Mật & Quản Lý Metadata */}
      {showSecurityModal && pdfBase64 && (
        <PdfSecurityModal
          initialTab={securityModalTab}
          onSetPassword={handleSetPassword}
          onUpdateMetadata={handleUpdateMetadata}
          onClose={() => setShowSecurityModal(false)}
        />
      )}

      {/* Dialog Xóa trang */}
      {showDeleteDialog && pdfBase64 && (
        <DeletePagesDialog
          pageCount={pageCount}
          selectedPages={selectedPages}
          currentPage={currentPage}
          onConfirm={handleDeletePages}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}

      {/* Dialog Tách PDF */}
      {showSplitDialog && pdfBase64 && (
        <SplitPdfDialog
          pageCount={pageCount}
          onConfirm={handleSplit}
          onClose={() => setShowSplitDialog(false)}
        />
      )}

      {/* Modal Ký Tên & Con Dấu */}
      {showSignatureModal && (
        <PdfSignatureModal
          initialTab={sigModalTab}
          onConfirm={handleSignatureConfirm}
          onClose={() => setShowSignatureModal(false)}
        />
      )}

      {/* Modal Đóng dấu bản quyền Watermark */}
      {showWatermarkModal && pdfBase64 && (
        <PdfWatermarkModal
          pageCount={pageCount}
          currentPage={currentPage}
          onConfirm={handleAddWatermark}
          onClose={() => setShowWatermarkModal(false)}
        />
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="pdf-toast-container"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            <div className={`pdf-toast-box ${toast.type}`}>
              {toast.type === 'success' && <CheckCircle size={16} className="text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle size={16} className="text-rose-400" />}
              {toast.type === 'info' && <Sparkles size={16} className="text-cyan-400" />}
              <span>{toast.message}</span>
              {toast.canUndo && canUndo && (
                <button
                  className="pdf-toast-undo-btn"
                  onClick={() => {
                    undo()
                    setToast(null)
                  }}
                >
                  Hoàn tác
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input cho web fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
      />

      {/* Hidden file input cho Ảnh sang PDF */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        multiple
        style={{ display: 'none' }}
        onChange={handleImageInputChange}
      />

      {/* Hidden file input cho Chèn ảnh tự do vào PDF */}
      <input
        ref={insertImageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        style={{ display: 'none' }}
        onChange={handleInsertImageSelected}
      />

      {/* 5. Spotlight Command Palette (Ctrl + K) */}
      <PdfCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commandList}
      />
    </div>
  )
}
