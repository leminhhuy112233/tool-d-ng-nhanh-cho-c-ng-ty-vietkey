import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from 'fs'
import type { PartnerProfile, ExportHistoryRecord, CustomTemplateDef } from '../../shared/types'
import { storageManager } from './storage-manager'
import { executeDatabaseMigration, CURRENT_SCHEMA_VERSION } from './migration'

interface StoreData {
  _schemaVersion?: number
  settings: {
    theme: string
    openaiApiKey: string
    defaultExportDir: string
    language: string
  }
  partners: PartnerProfile[]
  history: ExportHistoryRecord[]
  customTemplates: CustomTemplateDef[]
  templates: Array<{
    id: string
    name: string
    type: string
    filePath: string
    createdAt: string
    updatedAt: string
  }>
}

const DEFAULT_DATA: StoreData = {
  _schemaVersion: CURRENT_SCHEMA_VERSION,
  settings: {
    theme: 'dark',
    openaiApiKey: '',
    defaultExportDir: '',
    language: 'vi'
  },
  partners: [],
  history: [],
  customTemplates: [],
  templates: []
}

let storePath: string = ''
let data: StoreData = { ...DEFAULT_DATA }

function getStorePath(): string {
  if (!storePath) {
    const pcDir = storageManager.getDatabaseDir()
    const pcDbPath = join(pcDir, 'vietkey_database.json')
    const legacyPath = join(app.getPath('userData'), 'vietkey-docgen-config.json')

    // Tự động di chuyển dữ liệu cũ nếu file mới chưa có
    if (!existsSync(pcDbPath) && existsSync(legacyPath)) {
      try {
        const raw = readFileSync(legacyPath, 'utf-8')
        writeFileSync(pcDbPath, raw, 'utf-8')
        console.log('[Database] Đã chuyển đổi dữ liệu thành công sang PC Hub:', pcDbPath)
      } catch (err) {
        console.error('[Database] Lỗi di chuyển dữ liệu cũ:', err)
      }
    }
    storePath = pcDbPath
  }
  return storePath
}

export function setDatabaseStorePath(newPath: string): void {
  storePath = newPath
  data = loadFromDisk()
}

/**
 * Đọc dữ liệu từ đĩa có bảo vệ chống hỏng hóc (Corruption Shield)
 */
function loadFromDisk(): StoreData {
  const filePath = getStorePath()
  try {
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_DATA, ...parsed }
    }
  } catch (err: any) {
    console.error('[Database] ⚠️ Cảnh báo: File database bị lỗi định dạng JSON:', err)

    // Cơ chế Tự động cứu nạn dữ liệu (Automated Crash Recovery):
    // 1. Sao chép file hỏng sang Recovery/ để người dùng không bị mất dữ liệu thô
    try {
      const recoveryDir = storageManager.getRecoveryDir()
      const corruptedBackupPath = join(recoveryDir, `corrupted_database_${Date.now()}.json.bak`)
      if (existsSync(filePath)) {
        copyFileSync(filePath, corruptedBackupPath)
        console.log(`[Database] Đã lưu bản sao database hỏng vào: ${corruptedBackupPath}`)
      }
    } catch {
      // ignore
    }

    // 2. Tìm bản sao lưu gần nhất trong Backups/ để tự phục hồi
    try {
      const backupDir = storageManager.getBackupsDir()
      if (existsSync(backupDir)) {
        const backups = readdirSync(backupDir)
          .filter((f) => f.endsWith('.json') || f.endsWith('.vkbak'))
          .map((f) => ({ path: join(backupDir, f), time: statSync(join(backupDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time)

        if (backups.length > 0) {
          const latestBackup = backups[0].path
          console.log(`[Database] 🔄 Đang tự động cứu nạn từ bản sao lưu gần nhất: ${latestBackup}`)
          const backupContent = readFileSync(latestBackup, 'utf-8')
          const recovered = JSON.parse(backupContent)
          return { ...DEFAULT_DATA, ...recovered }
        }
      }
    } catch (recErr) {
      console.error('[Database] Không thể tự cứu nạn từ bản backup:', recErr)
    }
  }
  return { ...DEFAULT_DATA }
}

function saveToDisk(): void {
  try {
    writeFileSync(getStorePath(), JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Lỗi ghi database file:', err)
  }
}

// ===== Public API =====

export async function initStore(): Promise<void> {
  data = loadFromDisk()

  // Chạy Database Migration có bảo vệ trước
  const backupDir = storageManager.getBackupsDir()
  const recoveryDir = storageManager.getRecoveryDir()
  const metadataDir = storageManager.getMetadataDir()

  const migrationOutcome = await executeDatabaseMigration(data, backupDir, recoveryDir, metadataDir)
  data = migrationOutcome.data

  data.settings = { ...DEFAULT_DATA.settings, ...data.settings }
  data.partners = data.partners || []
  data.history = data.history || []
  data.customTemplates = data.customTemplates || []
  data._schemaVersion = CURRENT_SCHEMA_VERSION

  saveToDisk()
}

export function reloadStoreFromDisk(): void {
  data = loadFromDisk()
}

export function getStoreDataSnapshot(): StoreData {
  return JSON.parse(JSON.stringify(data))
}

// ===== Settings Helpers =====
export function getSetting(key: string): string | null {
  const settings = data.settings as Record<string, string>
  return settings[key] ?? null
}

export function setSetting(key: string, value: string): void {
  const settings = data.settings as Record<string, string>
  settings[key] = value
  saveToDisk()
}

export function getAllSettings(): Record<string, string> {
  return { ...data.settings } as Record<string, string>
}

// ===== Partner Memory Store Helpers =====
export function getPartners(): PartnerProfile[] {
  return data.partners || []
}

export function savePartner(profile: Omit<PartnerProfile, 'id' | 'updatedAt'>): void {
  const normName = profile.ten_cong_ty.trim().toUpperCase()
  if (!normName) return

  const existingIdx = data.partners.findIndex(
    (p) => p.ten_cong_ty.trim().toUpperCase() === normName
  )

  const updatedRecord: PartnerProfile = {
    ...profile,
    id: existingIdx >= 0 ? data.partners[existingIdx].id : String(Date.now()),
    ten_cong_ty: normName,
    updatedAt: new Date().toISOString()
  }

  if (existingIdx >= 0) {
    data.partners[existingIdx] = updatedRecord
  } else {
    data.partners.unshift(updatedRecord)
  }

  // Giữ lại top 100 đối tác gần nhất
  data.partners = data.partners.slice(0, 100)
  saveToDisk()
}

// ===== Export History Helpers =====
export function getHistory(): ExportHistoryRecord[] {
  return data.history || []
}

export function addHistoryRecord(record: Omit<ExportHistoryRecord, 'id' | 'createdAt'>): void {
  const newRecord: ExportHistoryRecord = {
    ...record,
    id: String(Date.now()),
    createdAt: new Date().toISOString()
  }

  data.history.unshift(newRecord)
  // Giữ lại top 50 lịch sử xuất gần nhất
  data.history = data.history.slice(0, 50)
  saveToDisk()
}

export function deleteHistoryRecord(id: string): void {
  data.history = (data.history || []).filter((h) => h.id !== id)
  saveToDisk()
}

export function clearHistory(): void {
  data.history = []
  saveToDisk()
}

// ===== Custom Dynamic Template Store Helpers =====
// Mẫu người dùng (User Templates) được lưu trữ tại VietKey_Data/Templates/
function getUserTemplatesDir(): string {
  return storageManager.getTemplatesDir()
}

export function getCustomTemplates(): CustomTemplateDef[] {
  return data.customTemplates || []
}

export function getCustomTemplateById(id: string): CustomTemplateDef | null {
  return (data.customTemplates || []).find((t) => t.id === id) || null
}

export function saveCustomTemplate(
  templateData: Omit<CustomTemplateDef, 'id' | 'createdAt' | 'updatedAt'>,
  processedDocxBase64?: string
): CustomTemplateDef {
  const templatesDir = getUserTemplatesDir()
  const id = `tpl_${Date.now()}`
  const targetDocxName = `${id}.docx`
  const targetDocxPath = join(templatesDir, targetDocxName)

  // Nếu có buffer base64 đã qua xử lý (thay chữ đỏ thành thẻ), lưu buffer đó
  if (processedDocxBase64) {
    const buf = Buffer.from(processedDocxBase64, 'base64')
    writeFileSync(targetDocxPath, buf)
  } else if (existsSync(templateData.docxFilePath)) {
    // Nếu không, sao chép file gốc vào thư mục Templates của VietKey_Data
    const buf = readFileSync(templateData.docxFilePath)
    writeFileSync(targetDocxPath, buf)
  }

  const newTemplate: CustomTemplateDef = {
    ...templateData,
    id,
    docxFilePath: targetDocxPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  data.customTemplates = data.customTemplates || []
  data.customTemplates.unshift(newTemplate)
  saveToDisk()
  return newTemplate
}

export function deleteCustomTemplate(id: string): boolean {
  const beforeLen = (data.customTemplates || []).length
  data.customTemplates = (data.customTemplates || []).filter((t) => t.id !== id)
  saveToDisk()
  return data.customTemplates.length < beforeLen
}
