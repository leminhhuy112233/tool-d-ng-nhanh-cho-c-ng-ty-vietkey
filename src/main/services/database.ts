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
        console.log('[Database] Data migrated to PC Hub:', pcDbPath)
      } catch (err) {
        console.error('[Database] Failed to migrate legacy data:', err)
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
    console.error('[Database] Warning: Database JSON parsing error:', err)

    // Cơ chế Tự động cứu nạn dữ liệu (Automated Crash Recovery):
    // 1. Sao chép file hỏng sang Recovery/ để người dùng không bị mất dữ liệu thô
    try {
      const recoveryDir = storageManager.getRecoveryDir()
      const corruptedBackupPath = join(recoveryDir, `corrupted_database_${Date.now()}.json.bak`)
      if (existsSync(filePath)) {
        copyFileSync(filePath, corruptedBackupPath)
        console.log(`[Database] Backed up corrupted database to: ${corruptedBackupPath}`)
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
          console.log(`[Database] Auto-recovering from latest backup: ${latestBackup}`)
          const backupContent = readFileSync(latestBackup, 'utf-8')
          const recovered = JSON.parse(backupContent)
          return { ...DEFAULT_DATA, ...recovered }
        }
      }
    } catch (recErr) {
      console.error('[Database] Failed auto-recovery from backup:', recErr)
    }
  }
  return { ...DEFAULT_DATA }
}

function saveToDisk(): void {
  try {
    writeFileSync(getStorePath(), JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to write database file:', err)
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

function getUserTemplatesVersionsDir(templateId: string): string {
  const dir = join(getUserTemplatesDir(), 'Versions', templateId)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

  // Tạo bản lưu trữ snapshot Version 1 vào thư mục Versions/
  const versionsDir = getUserTemplatesVersionsDir(id)
  const v1SnapshotPath = join(versionsDir, 'v1.docx')
  try {
    copyFileSync(targetDocxPath, v1SnapshotPath)
  } catch (err) {
    console.warn('Không thể sao chép v1 snapshot:', err)
  }

  let fileSize = '~'
  try {
    if (existsSync(targetDocxPath)) {
      fileSize = formatBytes(statSync(targetDocxPath).size)
    }
  } catch {
    // ignore
  }

  const v1Record = {
    version: 1,
    versionName: 'v1.0 - Khởi tạo',
    changeNote: 'Tạo mẫu lần đầu',
    docxFilePath: v1SnapshotPath,
    fileName: templateData.fileName,
    fields: templateData.fields || [],
    createdAt: new Date().toISOString(),
    fileSize
  }

  const newTemplate: CustomTemplateDef = {
    ...templateData,
    id,
    docxFilePath: targetDocxPath,
    currentVersion: 1,
    versions: [v1Record],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  data.customTemplates = data.customTemplates || []
  data.customTemplates.unshift(newTemplate)
  saveToDisk()
  return newTemplate
}

export function updateCustomTemplate(
  id: string,
  updateData: Partial<CustomTemplateDef>,
  newDocxBase64?: string,
  changeNote?: string
): CustomTemplateDef | null {
  const template = getCustomTemplateById(id)
  if (!template) return null

  const targetDocxPath = template.docxFilePath
  const currentVer = template.currentVersion || 1
  const nextVer = currentVer + 1
  const versionsDir = getUserTemplatesVersionsDir(id)
  const snapshotPath = join(versionsDir, `v${nextVer}.docx`)

  // Nếu người dùng tải lên file Word mới, ghi đè file active và lưu snapshot
  if (newDocxBase64) {
    const buf = Buffer.from(newDocxBase64, 'base64')
    writeFileSync(targetDocxPath, buf)
    writeFileSync(snapshotPath, buf)
  } else if (updateData.docxFilePath && existsSync(updateData.docxFilePath) && updateData.docxFilePath !== targetDocxPath) {
    copyFileSync(updateData.docxFilePath, targetDocxPath)
    copyFileSync(updateData.docxFilePath, snapshotPath)
  } else {
    // Nếu chỉ cập nhật trường fields, snapshot lại file hiện tại
    if (existsSync(targetDocxPath)) {
      copyFileSync(targetDocxPath, snapshotPath)
    }
  }

  let fileSize = '~'
  try {
    if (existsSync(targetDocxPath)) {
      fileSize = formatBytes(statSync(targetDocxPath).size)
    }
  } catch {
    // ignore
  }

  const versionRecord = {
    version: nextVer,
    versionName: `v${nextVer}.0`,
    changeNote: changeNote?.trim() || `Cập nhật phiên bản ${nextVer}`,
    docxFilePath: snapshotPath,
    fileName: updateData.fileName || template.fileName,
    fields: updateData.fields || template.fields,
    createdAt: new Date().toISOString(),
    fileSize
  }

  template.currentVersion = nextVer
  if (updateData.name) template.name = updateData.name.trim()
  if (updateData.description !== undefined) template.description = updateData.description.trim()
  if (updateData.fileName) template.fileName = updateData.fileName
  if (updateData.fields) template.fields = updateData.fields
  if (updateData.isFromRedHighlight !== undefined) template.isFromRedHighlight = updateData.isFromRedHighlight
  template.updatedAt = new Date().toISOString()

  template.versions = template.versions || []
  template.versions.unshift(versionRecord)

  // Giới hạn lưu trữ tối đa 20 phiên bản gần nhất để bảo vệ bộ nhớ
  if (template.versions.length > 20) {
    template.versions = template.versions.slice(0, 20)
  }

  saveToDisk()
  return template
}

export function rollbackCustomTemplateVersion(
  id: string,
  targetVersion: number
): CustomTemplateDef | null {
  const template = getCustomTemplateById(id)
  if (!template || !template.versions) return null

  const targetVerRecord = template.versions.find((v) => v.version === targetVersion)
  if (!targetVerRecord) return null

  // Khôi phục file Word active từ snapshot của targetVersion
  if (existsSync(targetVerRecord.docxFilePath)) {
    copyFileSync(targetVerRecord.docxFilePath, template.docxFilePath)
  }

  template.currentVersion = targetVersion
  template.fields = JSON.parse(JSON.stringify(targetVerRecord.fields))
  template.fileName = targetVerRecord.fileName || template.fileName
  template.updatedAt = new Date().toISOString()

  saveToDisk()
  return template
}

export function getTemplateVersions(id: string): any[] {
  const template = getCustomTemplateById(id)
  if (!template) return []
  return template.versions || []
}

export function deleteCustomTemplate(id: string): boolean {
  const beforeLen = (data.customTemplates || []).length
  data.customTemplates = (data.customTemplates || []).filter((t) => t.id !== id)
  saveToDisk()
  return data.customTemplates.length < beforeLen
}
