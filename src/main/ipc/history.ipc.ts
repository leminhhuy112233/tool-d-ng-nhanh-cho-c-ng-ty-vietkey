/**
 * VietKey DocGen — Export History IPC Handlers
 * Quản lý lịch sử tạo và xuất tài liệu của người dùng
 */

import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getHistory, addHistoryRecord, deleteHistoryRecord, clearHistory } from '../services/database'

export function registerHistoryHandlers(): void {
  // Lấy toàn bộ danh sách lịch sử xuất
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, () => {
    return getHistory()
  })

  // Thêm một bản ghi lịch sử mới
  ipcMain.handle(IPC_CHANNELS.HISTORY_ADD, (_event, record) => {
    return addHistoryRecord(record)
  })

  // Xóa một bản ghi lịch sử theo ID
  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, (_event, id: string) => {
    return deleteHistoryRecord(id)
  })

  // Xóa toàn bộ lịch sử xuất
  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    return clearHistory()
  })
}
