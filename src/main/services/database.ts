import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { PartnerProfile, ExportHistoryRecord } from '../../shared/types'

interface StoreData {
  settings: {
    theme: string
    openaiApiKey: string
    defaultExportDir: string
    language: string
  }
  partners: PartnerProfile[]
  history: ExportHistoryRecord[]
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
