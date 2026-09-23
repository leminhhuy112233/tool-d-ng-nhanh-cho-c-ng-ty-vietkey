/**
 * VietKey DocGen — Dialog & Shell IPC Handlers
 * Quản lý hộp thoại chọn tệp, chọn thư mục và mở tệp/thư mục qua hệ thống Shell
 */

import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'

export function registerDialogHandlers(getMainWindow: () => BrowserWindow | null): void {
  // Mở đường dẫn tệp hoặc thư mục bằng ứng dụng mặc định của hệ điều hành
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_PATH, async (_event, pathStr: string) => {
    if (pathStr) {
      await shell.openPath(pathStr)
    }
  })

  // Hiển thị và chọn tệp trong Windows Explorer
  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, async (_event, pathStr: string) => {
    if (pathStr) {
      shell.showItemInFolder(pathStr)
    }
  })

  // Hộp thoại mở tệp
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (_event, filters) => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Hộp thoại chọn thư mục
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const win = getMainWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Hộp thoại lưu tệp
  ipcMain.handle(
    IPC_CHANNELS.DIALOG_SAVE_FILE,
    async (_event, defaultName?: string, filters?: { name: string; extensions: string[] }[]) => {
      const win = getMainWindow()
      if (!win) return null
      const result = await dialog.showSaveDialog(win, {
        defaultPath: defaultName,
        filters: filters || [{ name: 'All Files', extensions: ['*'] }]
      })
      return result.canceled ? null : result.filePath
    }
  )
}
