import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import type { PartnerProfile, ExportHistoryRecord, CustomTemplateDef } from '../../shared/types'

interface StoreData {
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
    storePath = join(app.getPath('userData'), 'vietkey-docgen-config.json')
  }
  return storePath
}

function loadFromDisk(): StoreData {
  const filePath = getStorePath()
  try {
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8')
      return { ...DEFAULT_DATA, ...JSON.parse(raw) }
    }
  } catch (err) {
    console.error('Lỗi đọc config file:', err)
  }
  return { ...DEFAULT_DATA }
}

function saveToDisk(): void {
  try {
    writeFileSync(getStorePath(), JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('Lỗi ghi config file:', err)
  }
}

// ===== Public API =====

export function initStore(): void {
  data = loadFromDisk()
  data.settings = { ...DEFAULT_DATA.settings, ...data.settings }
  data.partners = data.partners || []
  data.history = data.history || []
  data.customTemplates = data.customTemplates || []
  saveToDisk()
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

  // Keep top 100 partners
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
  // Keep top 50 recent exports
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
function getCustomTemplatesDir(): string {
  const dir = join(app.getPath('userData'), 'custom_templates')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
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
  const templatesDir = getCustomTemplatesDir()
  const id = `tpl_${Date.now()}`
  const targetDocxName = `${id}.docx`
  const targetDocxPath = join(templatesDir, targetDocxName)

  // Nếu có buffer base64 đã qua xử lý (thay chữ đỏ thành thẻ), lưu buffer đó
  if (processedDocxBase64) {
    const buf = Buffer.from(processedDocxBase64, 'base64')
    writeFileSync(targetDocxPath, buf)
  } else if (existsSync(templateData.docxFilePath)) {
    // Nếu không, sao chép file gốc vào thư mục custom_templates của app
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

