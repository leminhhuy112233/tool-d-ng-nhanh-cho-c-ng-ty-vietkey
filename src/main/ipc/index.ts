/**
 * VietKey DocGen — IPC Master Registration Hub
 * Khởi tạo và liên kết toàn bộ các kênh giao tiếp IPC giữa Main Process và Renderer Process
 */

import { BrowserWindow } from 'electron'
import { registerWindowHandlers } from './window.ipc'
import { registerDialogHandlers } from './dialog.ipc'
import { registerPartnerHandlers } from './partner.ipc'
import { registerHistoryHandlers } from './history.ipc'
import { registerTemplateHandlers } from './template.ipc'
import { registerDocumentHandlers } from './document.ipc'
import { registerPdfHandlers } from './pdf.ipc'
import { registerSettingsHandlers } from './settings.ipc'
import { registerStorageHandlers } from './storage.ipc'

export function registerAllIpc(getMainWindow: () => BrowserWindow | null): void {
  registerWindowHandlers(getMainWindow)
  registerDialogHandlers(getMainWindow)
  registerPartnerHandlers()
  registerHistoryHandlers()
  registerTemplateHandlers()
  registerDocumentHandlers()
  registerPdfHandlers()
  registerSettingsHandlers()
  registerStorageHandlers()
}
