import { app, shell, dialog } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  statSync,
  readdirSync,
  unlinkSync,
  rmSync,
  readFileSync,
  writeFileSync
} from 'fs'
import type { StorageHubInfo, DataHealthReport } from '../../shared/types'
import { getSetting, setSetting, setDatabaseStorePath, reloadStoreFromDisk, getStoreDataSnapshot } from './database'
import { CURRENT_SCHEMA_VERSION } from './migration'

/**
 * VietKey Local Data Hub & Data Protection Layer Manager
 * Kiến trúc bảo vệ dữ liệu độc lập hoàn toàn với App code:
 * C:\Users\<Username>\VietKey_Data\
 * ├── Database/   - Dữ liệu khách hàng, lịch sử, cài đặt
 * ├── Documents/  - Tài liệu Word, PDF xuất ra
 * ├── Templates/  - Mẫu tài liệu của người dùng (User Templates)
 * ├── Backups/    - Các bản sao lưu tự động & thủ công
 * ├── Cache/      - Thumbnail, temporary preview render
 * ├── Temp/       - Log thực thi, scratch files (tự dọn dẹp)
 * ├── Recovery/   - Nhật ký khôi phục sự cố, crash logs, autosave
 * └── Metadata/   - Phiên bản schema, lịch sử migration
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
    const defaultPath = join(homedir(), 'VietKey_Data')
    if (!existsSync(defaultPath)) {
      mkdirSync(defaultPath, { recursive: true })
    }
    return defaultPath
  }

  // ===== 8 Thư Mục Thành Phần Của Data Protection Layer =====

  public getDatabaseDir(): string {
    const dir = join(this.getDataHubPath(), 'Database')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  public getDatabaseFilePath(): string {
    return join(this.getDatabaseDir(), 'vietkey_database.json')
  }

  public getDocumentsDir(): string {
    const dir = join(this.getDataHubPath(), 'Documents')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  public getTemplatesDir(): string {
    const dir = join(this.getDataHubPath(), 'Templates')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  public getBackupsDir(): string {
    const dir = join(this.getDataHubPath(), 'Backups')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  public getCacheDir(): string {
    const dir = join(this.getDataHubPath(), 'Cache')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  public getTempDir(): string {
    const dir = join(this.getDataHubPath(), 'Temp')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  public getRecoveryDir(): string {
    const dir = join(this.getDataHubPath(), 'Recovery')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  public getMetadataDir(): string {
    const dir = join(this.getDataHubPath(), 'Metadata')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    return dir
  }

  /**
   * Khởi tạo đầy đủ 8 thư mục con của Data Protection Layer
   * Tự động bảo vệ và di chuyển dữ liệu cũ từ AppData nếu có
   */
  public initStorageHub(): void {
    // 1. Tạo đầy đủ 8 thư mục
    this.getDatabaseDir()
    this.getDocumentsDir()
    this.getTemplatesDir()
    this.getBackupsDir()
    this.getCacheDir()
    this.getTempDir()
    this.getRecoveryDir()
    this.getMetadataDir()

    // 2. Chuyển database từ userData cũ nếu có
    const dbFile = this.getDatabaseFilePath()
    if (!existsSync(dbFile)) {
      const legacyPath = join(app.getPath('userData'), 'vietkey-docgen-config.json')
      if (existsSync(legacyPath)) {
        try {
          copyFileSync(legacyPath, dbFile)
          console.log('[StorageManager] ✓ Đã chuyển đổi dữ liệu từ AppData sang Local PC Hub:', dbFile)
        } catch (err) {
          console.error('[StorageManager] Lỗi di chuyển dữ liệu cũ:', err)
        }
      }
    }

    // 3. Chuyển các mẫu tùy biến cũ từ userData/custom_templates sang VietKey_Data/Templates/
    try {
      const legacyCustomTplDir = join(app.getPath('userData'), 'custom_templates')
      if (existsSync(legacyCustomTplDir)) {
        const files = readdirSync(legacyCustomTplDir)
        for (const file of files) {
          const srcPath = join(legacyCustomTplDir, file)
          const destPath = join(this.getTemplatesDir(), file)
          if (!existsSync(destPath)) {
            copyFileSync(srcPath, destPath)
          }
        }
      }
    } catch (err) {
      console.warn('[StorageManager] Không thể đồng bộ mẫu cũ:', err)
    }
  }

  /**
   * Kiểm tra tình trạng sức khỏe dữ liệu (Data Health Check)
   */
  public async checkDataHealth(): Promise<DataHealthReport> {
    const hubPath = this.getDataHubPath()
    const dbFile = this.getDatabaseFilePath()
    const backupDir = this.getBackupsDir()

    const requiredDirs = [
      this.getDatabaseDir(),
      this.getDocumentsDir(),
      this.getTemplatesDir(),
      this.getBackupsDir(),
      this.getCacheDir(),
      this.getTempDir(),
      this.getRecoveryDir(),
      this.getMetadataDir()
    ]

    const missingDirs: string[] = []
    for (const d of requiredDirs) {
      if (!existsSync(d)) missingDirs.push(d)
    }

    let dbOk = false
    let dbMsg = 'Database bình thường'
    let partnerCount = 0
    let historyCount = 0
    let customTemplateCount = 0
    let dbSizeFormatted = '0 B'
    let schemaVer = CURRENT_SCHEMA_VERSION

    if (existsSync(dbFile)) {
      try {
        const stats = statSync(dbFile)
        dbSizeFormatted = this.formatBytes(stats.size)
        const raw = readFileSync(dbFile, 'utf-8')
        const parsed = JSON.parse(raw)
        dbOk = true
        partnerCount = Array.isArray(parsed.partners) ? parsed.partners.length : 0
        historyCount = Array.isArray(parsed.history) ? parsed.history.length : 0
        customTemplateCount = Array.isArray(parsed.customTemplates) ? parsed.customTemplates.length : 0
        schemaVer = parsed._schemaVersion ?? CURRENT_SCHEMA_VERSION
      } catch (err: any) {
        dbOk = false
        dbMsg = `Database bị lỗi định dạng JSON: ${err.message}`
      }
    } else {
      dbOk = false
      dbMsg = 'Chưa tìm thấy tệp Database chính'
    }

    // Đếm backup & kiểm tra backup gần nhất
    let backupCount = 0
    let latestBackupDate: string | undefined
    let latestBackupPath: string | undefined

    try {
      if (existsSync(backupDir)) {
        const backupFiles = readdirSync(backupDir)
          .filter((f) => f.endsWith('.json') || f.endsWith('.vkbak'))
          .map((f) => {
            const p = join(backupDir, f)
            return { path: p, time: statSync(p).mtime.getTime() }
          })
          .sort((a, b) => b.time - a.time)

        backupCount = backupFiles.length
        if (backupFiles.length > 0) {
          latestBackupPath = backupFiles[0].path
          latestBackupDate = new Date(backupFiles[0].time).toLocaleString('vi-VN')
        }
      }
    } catch {
      // ignore
    }

    let status: 'healthy' | 'warning' | 'error' = 'healthy'
    if (!dbOk) {
      status = 'error'
    } else if (missingDirs.length > 0 || backupCount === 0) {
      status = 'warning'
    }

    return {
      status,
      schemaVersion: schemaVer,
      database: {
        ok: dbOk,
        message: dbMsg,
        path: dbFile,
        sizeFormatted: dbSizeFormatted,
        partnerCount,
        historyCount,
        customTemplateCount
      },
      directories: {
        ok: missingDirs.length === 0,
        hubPath,
        missingDirs
      },
      backup: {
        ok: backupCount > 0,
        backupCount,
        latestBackupDate,
        latestBackupPath
      },
      checkedAt: new Date().toISOString()
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
    const cachePath = this.getCacheDir()
    const tempPath = this.getTempDir()
    const recoveryPath = this.getRecoveryDir()
    const metadataPath = this.getMetadataDir()

    let docCount = 0
    let backupCount = 0
    let totalBytes = 0

    try {
      if (existsSync(docPath)) {
        docCount = readdirSync(docPath).length
      }
    } catch {
      // ignore
    }

    try {
      if (existsSync(backupPath)) {
        backupCount = readdirSync(backupPath).filter(
          (f) => f.endsWith('.json') || f.endsWith('.vkbak')
        ).length
      }
    } catch {
      // ignore
    }

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
    const health = await this.checkDataHealth()

    return {
      dataHubPath: hubPath,
      databasePath: dbPath,
      documentsPath: docPath,
      templatesPath: tplPath,
      backupsPath: backupPath,
      cachePath,
      tempPath,
      recoveryPath,
      metadataPath,
      totalSizeFormatted: this.formatBytes(totalBytes),
      documentCount: docCount,
      backupCount: backupCount,
      schemaVersion: health.schemaVersion,
      healthStatus: health.status
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
      const subDirs = ['Database', 'Documents', 'Templates', 'Backups', 'Cache', 'Temp', 'Recovery', 'Metadata']
      for (const sub of subDirs) {
        mkdirSync(join(newPath, sub), { recursive: true })
      }

      // Sao chép database hiện tại sang vị trí mới nếu chưa có
      const oldDbFile = this.getDatabaseFilePath()
      const newDbFile = join(newPath, 'Database', 'vietkey_database.json')
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
      else if (subfolder === 'cache') targetPath = this.getCacheDir()
      else if (subfolder === 'temp') targetPath = this.getTempDir()
      else if (subfolder === 'recovery') targetPath = this.getRecoveryDir()
      else if (subfolder === 'metadata') targetPath = this.getMetadataDir()

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
   * Tạo cả file .vkbak và .json chuẩn có dấu thời gian
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
      const targetBackup = join(backupDir, `VietKey_Backup_${dateStr}.vkbak`)

      copyFileSync(dbFile, targetBackup)
      // Tạo thêm 1 bản copy đuôi .json để người dùng dễ xem trực tiếp
      const jsonBackup = join(backupDir, `VietKey_Backup_${dateStr}.json`)
      copyFileSync(dbFile, jsonBackup)

      return { success: true, backupPath: targetBackup }
    } catch (err: any) {
      console.error('[StorageManager] Lỗi tạo bản sao lưu:', err)
      return { success: false, error: err.message || 'Lỗi khi sao lưu dữ liệu.' }
    }
  }

  /**
   * Khôi phục dữ liệu từ bản sao lưu (Restore Backup)
   * BẢO VỆ TUYỆT ĐỐI: Tự động chụp 1 bản snapshot hiện tại trước khi khôi phục!
   */
  public async restoreBackup(
    backupFilePath?: string
  ): Promise<{ success: boolean; restoredRecords?: number; error?: string }> {
    try {
      let restoreSrc = backupFilePath

      // Nếu không truyền file, tự động chọn bản backup mới nhất trong Backups/
      if (!restoreSrc) {
        const backupDir = this.getBackupsDir()
        const files = readdirSync(backupDir)
          .filter((f) => f.endsWith('.json') || f.endsWith('.vkbak'))
          .map((f) => ({
            name: f,
            path: join(backupDir, f),
            mtime: statSync(join(backupDir, f)).mtime.getTime()
          }))
          .sort((a, b) => b.mtime - a.mtime)

        if (files.length === 0) {
          return { success: false, error: 'Không tìm thấy bản sao lưu nào để khôi phục.' }
        }
        restoreSrc = files[0].path
      }

      if (!existsSync(restoreSrc)) {
        return { success: false, error: `Tệp sao lưu không tồn tại: ${restoreSrc}` }
      }

      // Đọc và kiểm tra tính toàn vẹn của tệp backup trước khi khôi phục
      const content = readFileSync(restoreSrc, 'utf-8')
      const parsed = JSON.parse(content)

      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Tệp sao lưu bị lỗi định dạng hoặc không hợp lệ.' }
      }

      // Tạo bản SNAPSHOT BẢO VỆ dữ liệu hiện tại trước khi ghi đè
      const currentDbFile = this.getDatabaseFilePath()
      if (existsSync(currentDbFile)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const preRestoreSnapshot = join(this.getBackupsDir(), `pre_restore_safety_${timestamp}.json`)
        try {
          copyFileSync(currentDbFile, preRestoreSnapshot)
          console.log('[StorageManager] ✓ Đã chụp snapshot bảo vệ trước khi restore:', preRestoreSnapshot)
        } catch {
          // ignore
        }
      }

      // Ghi đè vào Database chính
      writeFileSync(currentDbFile, JSON.stringify(parsed, null, 2), 'utf-8')
      reloadStoreFromDisk()

      const restoredRecords =
        (parsed.partners?.length || 0) + (parsed.history?.length || 0) + (parsed.customTemplates?.length || 0)

      return { success: true, restoredRecords }
    } catch (err: any) {
      console.error('[StorageManager] Lỗi khôi phục sao lưu:', err)
      return { success: false, error: err.message || 'Lỗi khi khôi phục dữ liệu.' }
    }
  }

  /**
   * Xuất bản sao lưu ra thư mục bên ngoài (USB, Desktop,...)
   */
  public async exportBackup(
    targetDir?: string
  ): Promise<{ success: boolean; exportPath?: string; error?: string }> {
    try {
      const dbFile = this.getDatabaseFilePath()
      if (!existsSync(dbFile)) {
        return { success: false, error: 'Chưa có cơ sở dữ liệu để xuất.' }
      }

      let destDir = targetDir
      if (!destDir) {
        destDir = app.getPath('desktop')
      }

      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true })
      }

      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const exportFile = join(destDir, `VietKey_DocGen_Backup_${dateStr}.vkbak`)

      copyFileSync(dbFile, exportFile)
      return { success: true, exportPath: exportFile }
    } catch (err: any) {
      console.error('[StorageManager] Lỗi xuất bản sao lưu:', err)
      return { success: false, error: err.message || 'Lỗi xuất backup.' }
    }
  }

  /**
   * Dọn dẹp Cache, file tạm và preview để tối ưu hóa bộ nhớ
   */
  public async cleanupTemp(): Promise<{ success: boolean; freedBytesFormatted?: string }> {
    let freedBytes = 0
    try {
      // 1. Dọn dẹp thư mục Cache nội bộ của VietKey_Data
      const cacheDir = this.getCacheDir()
      if (existsSync(cacheDir)) {
        const cacheFiles = readdirSync(cacheDir)
        for (const f of cacheFiles) {
          try {
            const p = join(cacheDir, f)
            const st = statSync(p)
            freedBytes += st.size
            if (st.isDirectory()) rmSync(p, { recursive: true, force: true })
            else unlinkSync(p)
          } catch {
            // ignore locked files
          }
        }
      }

      // 2. Dọn dẹp thư mục Temp nội bộ của VietKey_Data (ngoại trừ log đang mở)
      const appTempDir = this.getTempDir()
      if (existsSync(appTempDir)) {
        const tempFiles = readdirSync(appTempDir)
        for (const f of tempFiles) {
          if (f.endsWith('.log')) continue // Giữ lại log để kiểm tra lỗi
          try {
            const p = join(appTempDir, f)
            const st = statSync(p)
            freedBytes += st.size
            if (st.isDirectory()) rmSync(p, { recursive: true, force: true })
            else unlinkSync(p)
          } catch {
            // ignore
          }
        }
      }

      // 3. Dọn dẹp các tệp tạm của OS do VietKey tạo
      const osTempDir = app.getPath('temp')
      if (existsSync(osTempDir)) {
        const files = readdirSync(osTempDir)
        for (const file of files) {
          if (file.toLowerCase().includes('vietkey') || file.toLowerCase().includes('pdf_temp_')) {
            const full = join(osTempDir, file)
            try {
              const st = statSync(full)
              freedBytes += st.size
              if (st.isDirectory()) rmSync(full, { recursive: true, force: true })
              else unlinkSync(full)
            } catch {
              // ignore
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

  public formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}

export const storageManager = new StorageManager()
