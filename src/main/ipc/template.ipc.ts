/**
 * VietKey DocGen — Template Management & AI Analysis IPC Handlers
 * Quản lý mở thư mục template, mở file mẫu, phân tích mẫu Word bằng AI và CRUD Custom Templates
 */

import { ipcMain, app, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  getCustomTemplates,
  getCustomTemplateById,
  saveCustomTemplate,
  deleteCustomTemplate
} from '../services/database'
import { analyzeDocxTemplate } from '../services/template-analyzer'

function getTemplatesDirectory(): string {
  const candidateDirs = [
    process.resourcesPath ? join(process.resourcesPath, 'templates') : '',
    join(app.getAppPath(), 'templates'),
    join(process.cwd(), 'templates'),
    join(__dirname, '..', '..', 'templates')
  ].filter(Boolean)

  const found = candidateDirs.find((d) => existsSync(d))
  return found || join(process.cwd(), 'templates')
}

export function registerTemplateHandlers(): void {
  // Mở thư mục chứa các mẫu Word chính thức
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_LIST, async () => {
    const templateDir = getTemplatesDirectory()
    if (existsSync(templateDir)) {
      await shell.openPath(templateDir)
    }
  })

  // Mở một tệp mẫu Word cụ thể bằng Microsoft Word
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET, async (_event, fileName: string) => {
    const templateDir = getTemplatesDirectory()
    const filePath = join(templateDir, fileName)
    if (existsSync(filePath)) {
      await shell.openPath(filePath)
    }
  })

  // Phân tích cấu trúc file Word và tự động nhận diện các đoạn chữ đỏ bằng AI
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_ANALYZE, async (_event, filePath: string) => {
    return await analyzeDocxTemplate(filePath)
  })

  // Lấy danh sách toàn bộ các mẫu Word tùy biến đã lưu
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_LIST, async () => {
    return getCustomTemplates()
  })

  // Lấy chi tiết mẫu Word tùy biến theo ID
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_GET, async (_event, id: string) => {
    return getCustomTemplateById(id)
  })

  // Lưu hoặc cập nhật mẫu Word tùy biến
  ipcMain.handle(
    IPC_CHANNELS.TEMPLATE_CUSTOM_SAVE,
    async (_event, templateData: any, processedDocxBase64?: string) => {
      try {
        const saved = saveCustomTemplate(templateData, processedDocxBase64)
        return { success: true, template: saved }
      } catch (err: any) {
        console.error('Lỗi lưu custom template:', err)
        return { success: false, error: err.message || 'Lỗi không xác định khi lưu mẫu tùy biến.' }
      }
    }
  )

  // Xóa mẫu Word tùy biến theo ID
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_DELETE, async (_event, id: string) => {
    try {
      const ok = deleteCustomTemplate(id)
      return { success: ok }
    } catch (err: any) {
      console.error('Lỗi xóa custom template:', err)
      return { success: false, error: err.message || 'Lỗi không xác định khi xóa mẫu.' }
    }
  })
}
