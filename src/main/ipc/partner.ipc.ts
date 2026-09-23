/**
 * VietKey DocGen — Partner Memory IPC Handlers
 * Quản lý kho lưu trữ thông tin đối tác / khách hàng để gợi ý tự động (autocomplete)
 */

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getPartners, savePartner } from '../services/database'

export function registerPartnerHandlers(): void {
  // Lấy toàn bộ danh sách đối tác đã lưu
  ipcMain.handle(IPC_CHANNELS.PARTNER_GET_ALL, () => {
    return getPartners()
  })

  // Lưu hoặc cập nhật thông tin đối tác
  ipcMain.handle(IPC_CHANNELS.PARTNER_SAVE, (_event, profile) => {
    return savePartner(profile)
  })
}
