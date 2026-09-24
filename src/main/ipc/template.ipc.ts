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
  updateCustomTemplate,
  rollbackCustomTemplateVersion,
  getTemplateVersions,
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

  // Lưu mẫu Word tùy biến mới (Version 1)
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

  // Cập nhật mẫu Word bằng phiên bản mới (Version n+1)
  ipcMain.handle(
    IPC_CHANNELS.TEMPLATE_CUSTOM_UPDATE,
    async (_event, id: string, updateData: any, processedDocxBase64?: string, changeNote?: string) => {
      try {
        const updated = updateCustomTemplate(id, updateData, processedDocxBase64, changeNote)
        if (!updated) {
          return { success: false, error: 'Không tìm thấy mẫu tài liệu cần cập nhật.' }
        }
        return { success: true, template: updated }
      } catch (err: any) {
        console.error('Lỗi cập nhật custom template:', err)
        return { success: false, error: err.message || 'Lỗi không xác định khi cập nhật mẫu.' }
      }
    }
  )

  // Lấy danh sách lịch sử các phiên bản của một mẫu
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_VERSIONS, async (_event, id: string) => {
    try {
      return getTemplateVersions(id)
    } catch (err: any) {
      console.error('Lỗi lấy lịch sử phiên bản:', err)
      return []
    }
  })

  // Khôi phục (Rollback) về một phiên bản cũ
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_ROLLBACK, async (_event, id: string, targetVersion: number) => {
    try {
      const rolledBack = rollbackCustomTemplateVersion(id, targetVersion)
      if (!rolledBack) {
        return { success: false, error: 'Không tìm thấy phiên bản cần khôi phục.' }
      }
      return { success: true, template: rolledBack }
    } catch (err: any) {
      console.error('Lỗi khôi phục phiên bản:', err)
      return { success: false, error: err.message || 'Lỗi không xác định khi khôi phục phiên bản.' }
    }
  })

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
