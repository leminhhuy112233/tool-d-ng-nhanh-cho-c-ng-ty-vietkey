import { app, shell } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync, statSync, readdirSync, unlinkSync, rmSync } from 'fs'
import type { StorageHubInfo } from '../../shared/types'
import { getSetting, setSetting, setDatabaseStorePath } from './database'

/**
 * VietKey Local Data Hub Manager
 * Quản lý kho dữ liệu trực tiếp trên ổ đĩa PC của người dùng.
 * Đảm bảo dữ liệu minh bạch, an toàn, không bị chôn giấu trong AppData/Cache.
 */
class StorageManager {
  private customHubPathKey = 'custom_data_hub_path'

  /**
   * Lấy đường dẫn gốc của VietKey Data Hub trên PC
   * Mặc định: C:\Users\<Username>\VietKey_Data
   */
  public getDataHubPath(): string {
    const savedPath = getSetting(this.customHubPathKey)
    if (savedPath && existsSync(savedPath)) {
      return savedPath
    }
    const defaultPath = join(app.getPath('home'), 'VietKey_Data')
    if (!existsSync(defaultPath)) {
      mkdirSync(defaultPath, { recursive: true })
    }
    return defaultPath
  }

  /**
   * Thư mục con Database
   */
  public getDatabaseDir(): string {
    const dir = join(this.getDataHubPath(), 'Database')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  /**
   * Đường dẫn file database chính
   */
  public getDatabaseFilePath(): string {
    return join(this.getDatabaseDir(), 'vietkey_database.json')
  }

  /**
   * Thư mục con Documents (Tài liệu Word, PDF xuất ra)
   */
  public getDocumentsDir(): string {
    const dir = join(this.getDataHubPath(), 'Documents')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  /**
   * Thư mục con Templates (Mẫu công văn, hợp đồng tùy chỉnh)
   */
  public getTemplatesDir(): string {
    const dir = join(this.getDataHubPath(), 'Templates')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  /**
   * Thư mục con Backups (Bản sao lưu dự phòng)
   */
  public getBackupsDir(): string {
    const dir = join(this.getDataHubPath(), 'Backups')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  /**
   * Khởi tạo và tự động chuyển dữ liệu cũ (nếu có từ AppData) sang Hub PC
   */
  public initStorageHub(): void {
    const hub = this.getDataHubPath()
    this.getDatabaseDir()
    this.getDocumentsDir()
    this.getTemplatesDir()
    this.getBackupsDir()

    const dbFile = this.getDatabaseFilePath()
    if (!existsSync(dbFile)) {
      // Kiểm tra xem có dữ liệu cũ trong userData không
      const legacyPath = join(app.getPath('userData'), 'vietkey-docgen-config.json')
      if (existsSync(legacyPath)) {
        try {
          copyFileSync(legacyPath, dbFile)
          console.log('[StorageManager] Đã di chuyển dữ liệu cũ từ AppData sang Local PC Data Hub:', dbFile)
        } catch (err) {
          console.error('[StorageManager] Lỗi di chuyển dữ liệu cũ:', err)
        }
      }
    }
  }

  /**
   * Lấy thông tin thống kê Kho Lưu Trữ Cục Bộ
   */
  public async getDataHubInfo(): Promise<StorageHubInfo> {
    const hubPath = this.getDataHubPath()
    const dbPath = this.getDatabaseFilePath()
    const docPath = this.getDocumentsDir()
    const tplPath = this.getTemplatesDir()
    const backupPath = this.getBackupsDir()

    let docCount = 0
    let backupCount = 0
    let totalBytes = 0

    // Đếm file tài liệu
    try {
      if (existsSync(docPath)) {
        const docFiles = readdirSync(docPath)
        docCount = docFiles.length
      }
    } catch {
      // ignore
    }

    // Đếm file backup
    try {
      if (existsSync(backupPath)) {
        const backupFiles = readdirSync(backupPath)
        backupCount = backupFiles.length
      }
    } catch {
      // ignore
    }

    // Tính tổng dung lượng thư mục VietKey_Data
    const calculateSize = (dir: string): number => {
      let size = 0
      try {
        if (!existsSync(dir)) return 0
        const entries = readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          if (entry.isDirectory()) {
            size += calculateSize(fullPath)
          } else if (entry.isFile()) {
            const stats = statSync(fullPath)
            size += stats.size
          }
        }
      } catch {
        // ignore
      }
      return size
    }

    totalBytes = calculateSize(hubPath)

    return {
      dataHubPath: hubPath,
      databasePath: dbPath,
      documentsPath: docPath,
      templatesPath: tplPath,
      backupsPath: backupPath,
      totalSizeFormatted: this.formatBytes(totalBytes),
      documentCount: docCount,
      backupCount: backupCount
    }
  }

  /**
   * Thay đổi thư mục lưu trữ VietKey Hub sang vị trí mới theo ý người dùng
   */
  public async setDataHubPath(newPath: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      if (!newPath) {
        return { success: false, error: 'Đường dẫn không hợp lệ.' }
      }

      if (!existsSync(newPath)) {
        mkdirSync(newPath, { recursive: true })
      }

      const oldHub = this.getDataHubPath()
      if (oldHub.toLowerCase() === newPath.toLowerCase()) {
        return { success: true, path: newPath }
      }

      // Tạo các thư mục con ở vị trí mới
      const newDbDir = join(newPath, 'Database')
      const newDocDir = join(newPath, 'Documents')
      const newTplDir = join(newPath, 'Templates')
      const newBackupDir = join(newPath, 'Backups')
      mkdirSync(newDbDir, { recursive: true })
      mkdirSync(newDocDir, { recursive: true })
      mkdirSync(newTplDir, { recursive: true })
      mkdirSync(newBackupDir, { recursive: true })

      // Copy database hiện tại sang vị trí mới
      const oldDbFile = this.getDatabaseFilePath()
      const newDbFile = join(newDbDir, 'vietkey_database.json')
      if (existsSync(oldDbFile) && !existsSync(newDbFile)) {
        copyFileSync(oldDbFile, newDbFile)
      }

      // Lưu setting đường dẫn mới
      setSetting(this.customHubPathKey, newPath)
      setDatabaseStorePath(newDbFile)
      return { success: true, path: newPath }
    } catch (err: any) {
      console.error('[StorageManager] Lỗi khi đổi thư mục dữ liệu:', err)
      return { success: false, error: err.message || 'Không thể đổi vị trí thư mục.' }
    }
  }

  /**
   * Mở thư mục trong Windows Explorer
   */
  public async openDataHubInExplorer(subfolder?: string): Promise<boolean> {
    try {
      let targetPath = this.getDataHubPath()
      if (subfolder === 'database') targetPath = this.getDatabaseDir()
      else if (subfolder === 'documents') targetPath = this.getDocumentsDir()
      else if (subfolder === 'templates') targetPath = this.getTemplatesDir()
      else if (subfolder === 'backups') targetPath = this.getBackupsDir()

      if (!existsSync(targetPath)) {
        mkdirSync(targetPath, { recursive: true })
      }

      await shell.openPath(targetPath)
      return true
    } catch (err) {
      console.error('[StorageManager] Lỗi mở Explorer:', err)
      return false
    }
  }

  /**
   * Tạo bản sao lưu dự phòng (1-Click Backup)
   */
  public async createBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
    try {
      const dbFile = this.getDatabaseFilePath()
      if (!existsSync(dbFile)) {
        return { success: false, error: 'Chưa có dữ liệu để sao lưu.' }
      }

      const backupDir = this.getBackupsDir()
      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      const targetBackup = join(backupDir, `VietKey_Backup_${dateStr}.json`)

      copyFileSync(dbFile, targetBackup)
      return { success: true, backupPath: targetBackup }
    } catch (err: any) {
      console.error('[StorageManager] Lỗi tạo bản sao lưu:', err)
      return { success: false, error: err.message || 'Lỗi khi sao lưu dữ liệu.' }
    }
  }

  /**
   * Dọn dẹp file tạm, cache preview để tối ưu hóa bộ nhớ và tốc độ
   */
  public async cleanupTemp(): Promise<{ success: boolean; freedBytesFormatted?: string }> {
    let freedBytes = 0
    try {
      // Quét thư mục temp của hệ thống với tiền tố vietkey
      const tempDir = app.getPath('temp')
      if (existsSync(tempDir)) {
        const files = readdirSync(tempDir)
        for (const file of files) {
          if (file.toLowerCase().includes('vietkey') || file.toLowerCase().includes('pdf_temp_')) {
            const full = join(tempDir, file)
            try {
              const st = statSync(full)
              freedBytes += st.size
              if (st.isDirectory()) {
                rmSync(full, { recursive: true, force: true })
              } else {
                unlinkSync(full)
              }
            } catch {
              // Bỏ qua nếu file đang bị lock
            }
          }
        }
      }

      return {
        success: true,
        freedBytesFormatted: this.formatBytes(freedBytes)
      }
    } catch (err) {
      console.error('[StorageManager] Lỗi dọn dẹp cache:', err)
      return { success: false, freedBytesFormatted: '0 B' }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}

export const storageManager = new StorageManager()
