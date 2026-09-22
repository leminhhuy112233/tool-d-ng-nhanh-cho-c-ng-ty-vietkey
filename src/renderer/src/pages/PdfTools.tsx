/**
 * PdfTools — Trang chính của bộ công cụ PDF (Enterprise Edition)
 * Kết hợp:
 * - PdfHeader (thanh tệp tin trên cùng)
 * - PdfRibbon (hệ thống tab ribbon 5 nhóm chức năng)
 * - PdfViewer (Studio Canvas với đổ bóng đa tầng)
 * - PdfSidebarThumbnails (Sidebar đa tab)
 * - PdfThumbnailGrid (Dàn trang trực quan với batch action bar)
 * - PdfFloatingHud (Thanh điều khiển nổi kính mờ ở đáy màn hình)
 * - Empty State đẳng cấp kèm nút nạp tài liệu mẫu 1-click
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  FileUp,
  Upload,
  Merge,
  FileText,
  Scissors,
  FileSignature,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Copy,
  Droplet,
  FileImage
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { usePdfStore } from '../stores/pdfTools.store'
import { PdfHeader } from '../components/pdf/PdfHeader'
import { PdfRibbon } from '../components/pdf/PdfRibbon'
import { PdfViewer, ActiveAnnotation } from '../components/pdf/PdfViewer'
import { PdfSidebarThumbnails, PdfThumbnailGrid } from '../components/pdf/PdfThumbnails'
import { PdfFloatingHud } from '../components/pdf/PdfFloatingHud'
import { DeletePagesDialog, SplitPdfDialog } from '../components/pdf/PageManager'
import { PdfSignatureModal, SignatureResult, SignatureTab } from '../components/pdf/PdfSignatureModal'
import { PdfWatermarkModal } from '../components/pdf/PdfWatermarkModal'
import type { PdfWatermarkOptions } from '../../../shared/types'
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
    canUndo,
    updatePdfData,
    setHasChanges
  } = usePdfStore()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showSplitDialog, setShowSplitDialog] = useState(false)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [sigModalTab, setSigModalTab] = useState<SignatureTab>('draw')
  const [showWatermarkModal, setShowWatermarkModal] = useState(false)
  const [activeAnnotation, setActiveAnnotation] = useState<ActiveAnnotation | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Helper hiển thị thông báo Toast
  const showToast = useCallback((message: string, type: ToastType = 'success', allowUndo = false) => {
    setToast({ message, type, canUndo: allowUndo })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

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
          showToast(`Đã mở thành công ${result.fileName} (${result.pageCount} trang)`)
        }
      } catch (err: any) {
        setError(err.message || 'Lỗi mở file')
        showToast('Lỗi mở file PDF', 'error')
      } finally {
        setLoading(false)
      }
    } else {
      // Chạy trên trình duyệt Web: kích hoạt input file ẩn
      fileInputRef.current?.click()
    }
  }, [loadPdf, setLoading, setError, showToast])

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
          const { pdfjsLib, base64ToUint8Array } = await import('../utils/pdfConfig')
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

  const handleSaveFile = useCallback(async () => {
    if (!pdfBase64) return
    try {
      const result = await window.api?.pdfSaveFile(pdfBase64, fileName || 'tai-lieu-vietkey.pdf')
      if (result?.success) {
        setHasChanges(false)
        showToast('Đã lưu file PDF thành công!', 'success')
      } else if (result?.error) {
        showToast(result.error, 'error')
      }
    } catch {
      showToast('Lỗi lưu file', 'error')
    }
  }, [pdfBase64, fileName, setHasChanges, showToast])

  // ===== 2. Nạp Tài liệu Mẫu Thử Nghiệm 1-Click =====
  const handleLoadSamplePdf = useCallback(async () => {
    setLoading(true)
    try {
      const pdfDoc = await PDFDocument.create()
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

      // Trang 1: Hợp đồng nguyên tắc VietKey
      const page1 = pdfDoc.addPage([595.28, 841.89]) // A4
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
        color: rgb(0.15, 0.15, 0.15)
      })
      page1.drawText('1. Cung cap he thong quan ly ho so chung tu VietKey DocGen 2026.', {
        x: 60,
        y: 520,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })
      page1.drawText('2. Tich hop bo cong cu bien tap PDF Enterprise (Xoay, Cat, Ghep, Ky so).', {
        x: 60,
        y: 502,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })
      page1.drawText('3. Bao mat du lieu cuc bo tuyet doi, ho tro van hanh offline 100%.', {
        x: 60,
        y: 484,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })

      // Trang 2: Bảng phụ lục chi phí
      const page2 = pdfDoc.addPage([595.28, 841.89])
      page2.drawText('PHU LUC I - BANG BAO GIA GIAI PHAP 2026', {
        x: 50,
        y: 770,
        size: 15,
        font: boldFont,
        color: rgb(0.05, 0.35, 0.55)
      })
      page2.drawText('Hang muc 01: License VietKey DocGen Pro - So luong: 01 goi - Don gia: 15.000.000 VND', {
        x: 60,
        y: 730,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      })
      page2.drawText('Hang muc 02: Module PDF Enterprise Suite - So luong: 01 goi - Don gia: 8.500.000 VND', {
        x: 60,
        y: 705,
        size: 10,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2)
      })
      page2.drawText('Tong gia tri hop dong: 23.500.000 VND (Hai muoi ba trieu nam tram ngan dong)', {
        x: 60,
        y: 670,
        size: 11,
        font: boldFont,
        color: rgb(0.05, 0.45, 0.25)
      })

      // Trang 3: Xác nhận & Chữ ký
      const page3 = pdfDoc.addPage([595.28, 841.89])
      page3.drawText('DIEU KHOAN CHUNG & XAC NHAN CUA CAC BEN', {
        x: 50,
        y: 770,
        size: 15,
        font: boldFont,
        color: rgb(0.05, 0.35, 0.55)
      })
      page3.drawText('Hop dong nay co hieu luc ke tu ngay ky va lap thanh 02 ban co gia tri nhu nhau.', {
        x: 50,
        y: 735,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })
      page3.drawText('DAI DIEN BEN A (Ky & Dong dau)', {
        x: 80,
        y: 670,
        size: 11,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.15)
      })
      page3.drawText('DAI DIEN BEN B (Ky & Dong dau)', {
        x: 350,
        y: 670,
        size: 11,
        font: boldFont,
        color: rgb(0.15, 0.15, 0.15)
      })

      const base64 = await pdfDoc.saveAsBase64({ dataUri: false })
      const pages = [
        { pageIndex: 0, width: 595.28, height: 841.89, rotation: 0 },
        { pageIndex: 1, width: 595.28, height: 841.89, rotation: 0 },
        { pageIndex: 2, width: 595.28, height: 841.89, rotation: 0 }
      ]

      loadPdf('Mau_Hop_Dong_VietKey_2026.pdf', null, base64, pages, '125.4 KB')
      showToast('Đã nạp thành công tài liệu mẫu thử nghiệm (3 trang)', 'success')
    } catch (err: any) {
      setError(err.message || 'Lỗi tạo file mẫu')
      showToast('Lỗi tạo file mẫu', 'error')
    } finally {
      setLoading(false)
    }
  }, [loadPdf, setLoading, setError, showToast])

  // ===== 3. Thao tác Trang PDF =====
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

  // ===== Nhân bản trang =====
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

  // ===== Thêm Watermark Bản Quyền =====
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

  // ===== Nhận Chữ ký từ Modal và tạo Annotation Overlay =====
  const handleSignatureConfirm = useCallback(
    (result: SignatureResult) => {
      setActiveAnnotation({
        id: Date.now().toString(),
        type: 'image',
        pageIndex: currentPage,
        x: 80,
        y: 120,
        width: result.initialWidth,
        height: result.initialHeight,
        imageBase64: result.imageBase64,
        label: result.label
      })
      showToast(`Đã nạp ${result.label}. Kéo thả để đặt vị trí rồi bấm 'Áp dụng'!`, 'info')
    },
    [currentPage, showToast]
  )

  // ===== Áp dụng / Nung Annotation vào PDF vĩnh viễn =====
  const handleApplyAnnotation = useCallback(
    async (ann: ActiveAnnotation) => {
      if (!pdfBase64) return
      const scale = zoomLevel / 100
      pushUndo()
      setLoading(true)
      try {
        const result = await window.api?.pdfFlattenAnnotations(pdfBase64, [
          {
            type: ann.type,
            pageIndex: ann.pageIndex,
            x: ann.x / scale,
            y: ann.y / scale,
            width: ann.width / scale,
            height: ann.height / scale,
            imageBase64: ann.imageBase64,
            text: ann.text,
            fontSize: ann.fontSize ? ann.fontSize / scale : undefined,
            color: ann.color
          }
        ])
        if (result?.base64 && result?.pages) {
          updatePdfData(result.base64, result.pages)
          setActiveAnnotation(null)
          showToast(`Đã cố định ${ann.label} vào tài liệu thành công!`, 'success', true)
        } else if (result?.error) {
          showToast(result.error, 'error')
        }
      } catch {
        showToast('Lỗi cố định chữ ký', 'error')
      } finally {
        setLoading(false)
      }
    },
    [pdfBase64, zoomLevel, pushUndo, updatePdfData, showToast, setLoading]
  )

  // ===== Chèn Ký hiệu Nhanh (Dấu tick, Dấu X, Ngày, Chữ) =====
  const handleInsertQuickSymbol = useCallback(
    (type: 'check' | 'cross' | 'date' | 'text') => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let label = ''
      let width = 60
      let height = 60

      if (type === 'check') {
        canvas.width = 120
        canvas.height = 120
        width = 50
        height = 50
        label = 'Dấu tick xanh'
        ctx.fillStyle = '#10b981'
        ctx.font = 'bold 80px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✓', 60, 60)
      } else if (type === 'cross') {
        canvas.width = 120
        canvas.height = 120
        width = 50
        height = 50
        label = 'Dấu X đỏ'
        ctx.fillStyle = '#ef4444'
        ctx.font = 'bold 80px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('✕', 60, 60)
      } else if (type === 'date') {
        const today = new Date()
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
        canvas.width = 300
        canvas.height = 90
        width = 130
        height = 40
        label = 'Ngày tháng'
        ctx.fillStyle = '#1e293b'
        ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(dateStr, 150, 45)
      } else if (type === 'text') {
        canvas.width = 360
        canvas.height = 100
        width = 160
        height = 45
        label = 'Văn bản điền đơn'
        ctx.fillStyle = '#0f172a'
        ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Văn bản điền đơn', 180, 50)
      }

      const dataUrl = canvas.toDataURL('image/png')
      setActiveAnnotation({
        id: Date.now().toString(),
        type: 'image',
        pageIndex: currentPage,
        x: 100,
        y: 120,
        width,
        height,
        imageBase64: dataUrl,
        label
      })
      showToast(`Đã nạp [${label}]. Kéo thả để đặt đúng vị trí rồi bấm 'Áp dụng'!`, 'info')
    },
    [currentPage, showToast]
  )

  // ===== Xuất PDF sang Ảnh PNG Nét Cao =====
  const handleExportPdfToImages = useCallback(async () => {
    if (!pdfBase64 || pageCount === 0) return
    showToast('Đang kết xuất các trang thành ảnh nét cao...', 'info')
    setLoading(true)
    try {
      const { pdfjsLib, base64ToUint8Array } = await import('../utils/pdfConfig')
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
          await page.render({ canvasContext: ctx, viewport }).promise
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

  // ===== Tạo PDF từ nhiều file ảnh =====
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
        const result = await window.api.pdfImagesToPdf(imageItems)
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

  // ===== 4. Kéo & Thả File =====
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
        // Fallback đọc trực tiếp qua FileReader
        setLoading(true)
        try {
          const reader = new FileReader()
          reader.onload = async () => {
            try {
              const dataUrl = reader.result as string
              const base64 = dataUrl.split(',')[1]
              const { pdfjsLib, base64ToUint8Array } = await import('../utils/pdfConfig')
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

  // Phím tắt toàn cục
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfBase64) return

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undo()
        showToast('Đã hoàn tác thao tác vừa thực hiện', 'info')
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveFile()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault()
        handleOpenFile()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        window.print()
      }
      if (e.key === 'Delete' && (selectedPages.length > 0 || pageCount > 1)) {
        setShowDeleteDialog(true)
      }
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && (e.target as HTMLElement).tagName !== 'INPUT') {
        handleRotatePages(90)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pdfBase64, selectedPages, pageCount, undo, handleSaveFile, handleOpenFile, handleRotatePages, showToast])

  return (
    <div
      className="pdf-tools-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. Header Bar phía trên cùng */}
      <PdfHeader
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onPrint={() => window.print()}
      />

      {/* 2. Thanh Ribbon Đa Chức Năng (nếu đã mở PDF) */}
      {pdfBase64 && (
        <PdfRibbon
          onOpenFile={handleOpenFile}
          onSaveFile={handleSaveFile}
          onDeletePages={() => setShowDeleteDialog(true)}
          onRotatePages={(deg) => handleRotatePages(deg)}
          onMerge={handleMerge}
          onSplit={() => setShowSplitDialog(true)}
          onExtractPages={handleExtractPages}
          onDuplicatePages={handleDuplicatePages}
          onOpenSignatureModal={(tab) => {
            setSigModalTab(tab || 'draw')
            setShowSignatureModal(true)
          }}
          onOpenWatermarkModal={() => setShowWatermarkModal(true)}
          onExportImages={handleExportPdfToImages}
          onImagesToPdf={handleImagesToPdf}
          onInsertQuickSymbol={handleInsertQuickSymbol}
          onPlaceholderAction={(name) => showToast(`Tính năng [${name}] đang sẵn sàng trong Phase tiếp theo`, 'info')}
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

            <div className="pdf-quick-card" onClick={() => showToast('Mở tài liệu trước để thực hiện tách trang', 'info')}>
              <div className="pdf-quick-card-icon">
                <Scissors size={18} />
              </div>
              <span className="pdf-quick-card-title">Tách & Trích xuất</span>
              <p className="pdf-quick-card-desc">Chia nhỏ file hoặc trích xuất các trang tài liệu quan trọng</p>
            </div>

            <div className="pdf-quick-card" onClick={handleLoadSamplePdf}>
              <div className="pdf-quick-card-icon text-amber-400">
                <Sparkles size={18} />
              </div>
              <span className="pdf-quick-card-title">Mẫu thử nghiệm (1-Click)</span>
              <p className="pdf-quick-card-desc">Nạp hợp đồng mẫu VietKey 3 trang để thử ngay giao diện mới</p>
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
              onExtractPage={(idx) => {
                usePdfStore.getState().selectPageRange(idx, idx)
                handleExtractPages()
              }}
            />
          )}

          {/* Central Viewport: Page Studio Canvas hoặc Organize Light-Table */}
          {viewMode === 'page' ? (
            <>
              <PdfViewer
                onRotatePages={handleRotatePages}
                onDeletePages={() => setShowDeleteDialog(true)}
                onExtractPages={handleExtractPages}
                activeAnnotation={activeAnnotation}
                onUpdateAnnotation={setActiveAnnotation}
                onApplyAnnotation={handleApplyAnnotation}
              />
              <PdfFloatingHud />
            </>
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
    </div>
  )
}
