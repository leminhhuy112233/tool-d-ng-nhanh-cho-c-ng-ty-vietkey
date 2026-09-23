/**
 * VietKey PDF Tools — IPC Handlers
 * Đăng ký tất cả IPC channels cho PDF manipulation
 */

import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename, dirname, extname } from 'path'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  readPdfFile,
  getPdfInfo,
  deletePages,
  rotatePages,
  reorderPages,
  duplicatePages,
  extractPages,
  splitPdf,
  mergePdfs,
  savePdfToFile,
  flattenAnnotations,
  addWatermark,
  imagesToPdf,
  addBlankPage,
  importPdfPages,
  compressPdf,
  updateMetadata
} from '../services/pdf-service'
import type { PdfAnnotation, SplitRange, WatermarkOptions } from '../services/pdf-service'

export function registerPdfHandlers(): void {
  // ===== Mở file PDF (hiện dialog chọn file) =====
  ipcMain.handle(IPC_CHANNELS.PDF_OPEN_FILE, async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: 'Chọn file PDF',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    try {
      const pdfBytes = await readPdfFile(filePath)
      const info = await getPdfInfo(pdfBytes)
      // Trả về base64 để gửi qua IPC (Uint8Array không serialize tốt qua IPC)
      const base64 = Buffer.from(pdfBytes).toString('base64')
      return {
        filePath,
        fileName: basename(filePath),
        base64,
        pageCount: info.pageCount,
        pages: info.pages
      }
    } catch (err: any) {
      console.error('Lỗi mở file PDF:', err)
      return { error: err.message || 'Không thể mở file PDF' }
    }
  })

  // ===== Đọc file PDF từ đường dẫn =====
  ipcMain.handle(IPC_CHANNELS.PDF_READ_FILE, async (_event, filePath: string) => {
    try {
      const pdfBytes = await readPdfFile(filePath)
      const info = await getPdfInfo(pdfBytes)
      const base64 = Buffer.from(pdfBytes).toString('base64')
      return {
        filePath,
        fileName: basename(filePath),
        base64,
        pageCount: info.pageCount,
        pages: info.pages
      }
    } catch (err: any) {
      return { error: err.message || 'Không thể đọc file PDF' }
    }
  })

  // ===== Lưu file PDF =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_SAVE_FILE,
    async (_event, pdfBase64: string, suggestedName?: string) => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { error: 'Không tìm thấy cửa sổ' }

      const result = await dialog.showSaveDialog(win, {
        title: 'Lưu file PDF',
        defaultPath: suggestedName || 'output.pdf',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      })

      if (result.canceled || !result.filePath) return { canceled: true }

      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        savePdfToFile(pdfBytes, result.filePath)
        return { success: true, filePath: result.filePath }
      } catch (err: any) {
        return { error: err.message || 'Lỗi khi lưu file' }
      }
    }
  )

  // ===== Xóa trang =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_DELETE_PAGES,
    async (_event, pdfBase64: string, pageIndices: number[]) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await deletePages(pdfBytes, pageIndices)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi xóa trang' }
      }
    }
  )

  // ===== Xoay trang =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_ROTATE_PAGES,
    async (_event, pdfBase64: string, pageIndices: number[], angleDegrees: number) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await rotatePages(pdfBytes, pageIndices, angleDegrees)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi xoay trang' }
      }
    }
  )

  // ===== Sắp xếp lại trang =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_REORDER_PAGES,
    async (_event, pdfBase64: string, newOrder: number[]) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await reorderPages(pdfBytes, newOrder)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi sắp xếp trang' }
      }
    }
  )

  // ===== Nhân bản trang =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_DUPLICATE_PAGES,
    async (_event, pdfBase64: string, pageIndices: number[]) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await duplicatePages(pdfBytes, pageIndices)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi nhân bản trang' }
      }
    }
  )

  // ===== Trích xuất trang =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_EXTRACT_PAGES,
    async (_event, pdfBase64: string, pageIndices: number[]) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await extractPages(pdfBytes, pageIndices)
        return {
          base64: Buffer.from(result).toString('base64')
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi trích xuất trang' }
      }
    }
  )

  // ===== Tách PDF =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_SPLIT,
    async (_event, pdfBase64: string, ranges: SplitRange[]) => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return { error: 'Không tìm thấy cửa sổ' }

      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const results = await splitPdf(pdfBytes, ranges)

        // Cho user chọn thư mục xuất
        const dirResult = await dialog.showOpenDialog(win, {
          title: 'Chọn thư mục lưu file PDF đã tách',
          properties: ['openDirectory']
        })
        if (dirResult.canceled || dirResult.filePaths.length === 0) return { canceled: true }

        const outputDir = dirResult.filePaths[0]
        const outputPaths: string[] = []

        for (let i = 0; i < results.length; i++) {
          const fileName = `split_part_${i + 1}.pdf`
          const outputPath = join(outputDir, fileName)
          savePdfToFile(results[i], outputPath)
          outputPaths.push(outputPath)
        }

        return { success: true, outputPaths }
      } catch (err: any) {
        return { error: err.message || 'Lỗi tách PDF' }
      }
    }
  )

  // ===== Ghép PDF (Merge) =====
  ipcMain.handle(IPC_CHANNELS.PDF_MERGE, async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { error: 'Không tìm thấy cửa sổ' }

    const result = await dialog.showOpenDialog(win, {
      title: 'Chọn các file PDF để ghép',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled || result.filePaths.length === 0) return { canceled: true }

    try {
      const pdfBytesArray = result.filePaths.map((fp) => new Uint8Array(readFileSync(fp)))
      const merged = await mergePdfs(pdfBytesArray)
      const info = await getPdfInfo(merged)
      return {
        base64: Buffer.from(merged).toString('base64'),
        pageCount: info.pageCount,
        pages: info.pages,
        mergedFiles: result.filePaths.map((fp) => basename(fp))
      }
    } catch (err: any) {
      return { error: err.message || 'Lỗi ghép PDF' }
    }
  })

  // ===== Flatten Annotations =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_FLATTEN_ANNOTATIONS,
    async (_event, pdfBase64: string, annotations: PdfAnnotation[]) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await flattenAnnotations(pdfBytes, annotations)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi flatten annotations' }
      }
    }
  )

  // ===== Thêm Watermark =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_ADD_WATERMARK,
    async (_event, pdfBase64: string, options: WatermarkOptions) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await addWatermark(pdfBytes, options)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi thêm watermark' }
      }
    }
  )

  // ===== Chuyển Ảnh sang PDF =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_IMAGES_TO_PDF,
    async (_event, images: { base64: string; type?: 'png' | 'jpg' }[]) => {
      try {
        const result = await imagesToPdf(images)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi tạo PDF từ ảnh' }
      }
    }
  )

  // ===== Thêm trang trắng A4 =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_ADD_BLANK_PAGE,
    async (_event, pdfBase64: string, position: 'before' | 'after' | 'end', targetIndex: number) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await addBlankPage(pdfBytes, position, targetIndex)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi thêm trang trắng' }
      }
    }
  )

  // ===== Nhập trang từ PDF khác =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_IMPORT_PAGES,
    async (
      _event,
      targetBase64: string,
      sourceBytesArr: number[],
      position: 'before' | 'after' | 'end',
      targetIndex: number,
      pageIndices?: number[]
    ) => {
      try {
        const targetBytes = new Uint8Array(Buffer.from(targetBase64, 'base64'))
        const sourceBytes = new Uint8Array(sourceBytesArr)
        const result = await importPdfPages(
          targetBytes,
          sourceBytes,
          position,
          targetIndex,
          pageIndices
        )
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi nhập trang từ PDF khác' }
      }
    }
  )

  // ===== Nén file PDF =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_COMPRESS,
    async (_event, pdfBase64: string, level: 'low' | 'medium' | 'high') => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await compressPdf(pdfBytes, level)
        const info = await getPdfInfo(result)
        const base64 = Buffer.from(result).toString('base64')
        return {
          base64,
          pageCount: info.pageCount,
          pages: info.pages,
          newSizeBytes: result.length
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi nén PDF' }
      }
    }
  )

  // ===== Cập nhật hoặc Xóa Metadata =====
  ipcMain.handle(
    IPC_CHANNELS.PDF_UPDATE_METADATA,
    async (_event, pdfBase64: string, metadata: any) => {
      try {
        const pdfBytes = new Uint8Array(Buffer.from(pdfBase64, 'base64'))
        const result = await updateMetadata(pdfBytes, metadata)
        const info = await getPdfInfo(result)
        return {
          base64: Buffer.from(result).toString('base64'),
          pageCount: info.pageCount,
          pages: info.pages
        }
      } catch (err: any) {
        return { error: err.message || 'Lỗi cập nhật metadata' }
      }
    }
  )
}
