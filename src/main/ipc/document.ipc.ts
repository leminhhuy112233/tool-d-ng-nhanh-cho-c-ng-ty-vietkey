import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { generateContractDocx, generateQuotationDocx, generateAdvanceRequestDocx } from '../services/docx-engine'
import { convertDocxToPdf } from '../services/pdf-converter'
import { parseTextWithAI, parseQuotationTextWithAI } from '../services/ai-parser'
import type { ContractData, QuotationData, AdvanceRequestData, ExportResult } from '../../shared/types'

export function registerDocumentHandlers(): void {
  // 1. Xuất Hợp đồng nguyên tắc (Word / PDF / Cả 2)
  ipcMain.handle(
    IPC_CHANNELS.DOCUMENT_EXPORT_CONTRACT,
    async (_event, data: ContractData, targetPath: string): Promise<ExportResult> => {
      const docxRes = generateContractDocx(data, targetPath)
      if (!docxRes.success) return docxRes

      const exportType = data.export_type || 'word'
      if (exportType === 'word') {
        return { success: true, filePath: targetPath }
      }

      const pdfPath = targetPath.replace(/\.docx$/i, '') + '.pdf'
      const pdfRes = await convertDocxToPdf(targetPath, pdfPath)
      const actualPdfPath = pdfRes.pdfPath || pdfPath

      if (exportType === 'pdf') {
        return pdfRes.success
          ? { success: true, pdfPath: actualPdfPath }
          : { success: false, error: pdfRes.error }
      }

      return {
        success: true,
        filePath: targetPath,
        pdfPath: pdfRes.success ? actualPdfPath : undefined,
        error: pdfRes.success ? undefined : `Đã xuất file Word thành công, nhưng gặp lỗi PDF: ${pdfRes.error}`
      }
    }
  )

  // 2. Xuất Báo giá (Word / PDF / Cả 2)
  ipcMain.handle(
    IPC_CHANNELS.DOCUMENT_EXPORT_QUOTATION,
    async (_event, data: QuotationData, targetPath: string): Promise<ExportResult> => {
      const docxRes = generateQuotationDocx(data, targetPath)
      if (!docxRes.success) return docxRes

      const exportType = data.export_type || 'word'
      if (exportType === 'word') {
        return { success: true, filePath: targetPath }
      }

      const pdfPath = targetPath.replace(/\.docx$/i, '') + '.pdf'
      const pdfRes = await convertDocxToPdf(targetPath, pdfPath)
      const actualPdfPath = pdfRes.pdfPath || pdfPath

      if (exportType === 'pdf') {
        return pdfRes.success
          ? { success: true, pdfPath: actualPdfPath }
          : { success: false, error: pdfRes.error }
      }

      return {
        success: true,
        filePath: targetPath,
        pdfPath: pdfRes.success ? actualPdfPath : undefined,
        error: pdfRes.success ? undefined : `Đã xuất file Word thành công, nhưng gặp lỗi PDF: ${pdfRes.error}`
      }
    }
  )

  // 3. Xuất Đề nghị Tạm ứng (Word / PDF / Cả 2)
  ipcMain.handle(
    IPC_CHANNELS.DOCUMENT_EXPORT_ADVANCE_REQUEST,
    async (_event, data: AdvanceRequestData, targetPath: string): Promise<ExportResult> => {
      const docxRes = generateAdvanceRequestDocx(data, targetPath)
      if (!docxRes.success) return docxRes

      const exportType = data.export_type || 'word'
      if (exportType === 'word') {
        return { success: true, filePath: targetPath }
      }

      const pdfPath = targetPath.replace(/\.docx$/i, '') + '.pdf'
      const pdfRes = await convertDocxToPdf(targetPath, pdfPath)
      const actualPdfPath = pdfRes.pdfPath || pdfPath

      if (exportType === 'pdf') {
        return pdfRes.success
          ? { success: true, pdfPath: actualPdfPath }
          : { success: false, error: pdfRes.error }
      }

      return {
        success: true,
        filePath: targetPath,
        pdfPath: pdfRes.success ? actualPdfPath : undefined,
        error: pdfRes.success ? undefined : `Đã xuất file Word thành công, nhưng gặp lỗi PDF: ${pdfRes.error}`
      }
    }
  )

  // 4. AI Parsing Hợp đồng
  ipcMain.handle(IPC_CHANNELS.DOCUMENT_PARSE_AI, async (_event, rawText: string) => {
    return await parseTextWithAI(rawText)
  })

  // 5. AI Parsing Báo giá
  ipcMain.handle(IPC_CHANNELS.DOCUMENT_PARSE_QUOTATION_AI, async (_event, rawText: string) => {
    return await parseQuotationTextWithAI(rawText)
  })
}
