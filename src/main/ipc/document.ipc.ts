import { ipcMain } from 'electron'
import { basename } from 'path'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { generateContractDocx, generateQuotationDocx, generateAdvanceRequestDocx, generateCustomDocx } from '../services/docx-engine'
import { convertDocxToPdf } from '../services/pdf-converter'
import { parseTextWithAI, parseQuotationTextWithAI } from '../services/ai-parser'
import { addHistoryRecord, getCustomTemplateById } from '../services/database'
import type { ContractData, QuotationData, AdvanceRequestData, ExportResult, ExportFileType } from '../../shared/types'

export function registerDocumentHandlers(): void {
  // 1. Xuất Hợp đồng nguyên tắc (Word / PDF / Cả 2)
  ipcMain.handle(
    IPC_CHANNELS.DOCUMENT_EXPORT_CONTRACT,
    async (_event, data: ContractData, targetPath: string): Promise<ExportResult> => {
      const docxRes = generateContractDocx(data, targetPath)
      if (!docxRes.success) return docxRes

      const exportType = data.export_type || 'word'

      // Ghi nhận vào lịch sử xuất tài liệu kèm toàn bộ dữ liệu để chỉnh sửa tiếp
      try {
        addHistoryRecord({
          fileName: basename(targetPath),
          filePath: targetPath,
          docType: 'contract',
          exportType,
          customerName: (data.benb_ten_cong_ty || data.bena_ten_cong_ty || 'Hợp đồng nguyên tắc').trim(),
          dataSnapshot: data
        })
      } catch (err) {
        console.error('Lỗi lưu lịch sử xuất hợp đồng:', err)
      }

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

      // Ghi nhận vào lịch sử xuất tài liệu kèm toàn bộ dữ liệu để chỉnh sửa tiếp
      try {
        addHistoryRecord({
          fileName: basename(targetPath),
          filePath: targetPath,
          docType: 'quotation',
          exportType,
          customerName: (data.ten_khach_hang || 'Báo giá mới').trim(),
          dataSnapshot: data
        })
      } catch (err) {
        console.error('Lỗi lưu lịch sử xuất báo giá:', err)
      }

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

      // Ghi nhận vào lịch sử xuất tài liệu kèm toàn bộ dữ liệu để chỉnh sửa tiếp
      try {
        addHistoryRecord({
          fileName: basename(targetPath),
          filePath: targetPath,
          docType: 'advance_request',
          exportType,
          customerName: (data.ten_cong_ty_khach || 'Đề nghị tạm ứng').trim(),
          dataSnapshot: data
        })
      } catch (err) {
        console.error('Lỗi lưu lịch sử xuất đề nghị tạm ứng:', err)
      }

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

  // 6. Xuất Mẫu Tùy Biến (Custom Template)
  ipcMain.handle(
    IPC_CHANNELS.DOCUMENT_EXPORT_CUSTOM,
    async (
      _event,
      templateId: string,
      data: Record<string, any>,
      targetPath: string,
      exportType: ExportFileType = 'word'
    ): Promise<ExportResult> => {
      const template = getCustomTemplateById(templateId)
      if (!template) {
        return { success: false, error: `Không tìm thấy mẫu tài liệu với ID: ${templateId}` }
      }

      const docxRes = generateCustomDocx(template.docxFilePath, data, targetPath)
      if (!docxRes.success) return docxRes

      // Ghi nhận vào lịch sử xuất tài liệu
      try {
        const custName = data.ten_khach_hang || data.ten_cong_ty || data.dai_dien || template.name
        addHistoryRecord({
          fileName: basename(targetPath),
          filePath: targetPath,
          docType: 'custom',
          exportType,
          customerName: String(custName).trim(),
          templateId: template.id,
          templateName: template.name,
          dataSnapshot: data
        })
      } catch (err) {
        console.error('Lỗi lưu lịch sử xuất tài liệu tùy biến:', err)
      }

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
}
