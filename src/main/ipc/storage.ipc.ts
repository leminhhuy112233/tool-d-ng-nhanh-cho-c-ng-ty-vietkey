import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { storageManager } from '../services/storage-manager'

export function registerStorageHandlers(): void {
  // Lấy thông tin kho lưu trữ PC
  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_INFO, async () => {
    return await storageManager.getDataHubInfo()
  })

  // Đổi thư mục lưu trữ
  ipcMain.handle(IPC_CHANNELS.STORAGE_SET_PATH, async (_event, newPath: string) => {
    return await storageManager.setDataHubPath(newPath)
  })

  // Mở thư mục bằng Windows Explorer
  ipcMain.handle(IPC_CHANNELS.STORAGE_OPEN_EXPLORER, async (_event, subfolder?: string) => {
    return await storageManager.openDataHubInExplorer(subfolder)
  })

  // Tạo bản sao lưu dự phòng (1-Click Backup)
  ipcMain.handle(IPC_CHANNELS.STORAGE_CREATE_BACKUP, async () => {
    return await storageManager.createBackup()
  })

  // Dọn dẹp cache & file tạm
  ipcMain.handle(IPC_CHANNELS.STORAGE_CLEANUP_TEMP, async () => {
    return await storageManager.cleanupTemp()
  })

  // Kiểm tra sức khỏe dữ liệu (Data Health Check)
  ipcMain.handle(IPC_CHANNELS.STORAGE_GET_HEALTH, async () => {
    return await storageManager.checkDataHealth()
  })

  // Khôi phục dữ liệu từ bản sao lưu
  ipcMain.handle(IPC_CHANNELS.STORAGE_RESTORE_BACKUP, async (_event, backupPath?: string) => {
    return await storageManager.restoreBackup(backupPath)
  })

  // Xuất bản sao lưu ra ngoài (USB/Desktop)
  ipcMain.handle(IPC_CHANNELS.STORAGE_EXPORT_BACKUP, async (_event, targetDir?: string) => {
    return await storageManager.exportBackup(targetDir)
  })
}

