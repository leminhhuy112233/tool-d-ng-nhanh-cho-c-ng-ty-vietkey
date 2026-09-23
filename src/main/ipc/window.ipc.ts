/**
 * VietKey DocGen — Window Control IPC Handlers
 * Quản lý các sự kiện thu nhỏ, phóng to, đóng và chuyển đổi cửa sổ mini (floating mode)
 */

import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

let isMiniMode = false

export function registerWindowHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Thu nhỏ cửa sổ
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    getMainWindow()?.minimize()
  })

  // Phóng to / Khôi phục kích thước
  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  // Đóng cửa sổ
  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    getMainWindow()?.close()
  })

  // Bật/tắt chế độ cửa sổ Mini tiện ích góc màn hình
  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_MINI, () => {
    const win = getMainWindow()
    if (!win) return false
    isMiniMode = !isMiniMode
    if (isMiniMode) {
      win.setSize(440, 680)
      win.setAlwaysOnTop(true, 'floating')
    } else {
      win.setAlwaysOnTop(false)
      win.setSize(1280, 800)
    }
    return isMiniMode
  })

  // Kiểm tra trạng thái phóng to
  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return getMainWindow()?.isMaximized() ?? false
  })
}
