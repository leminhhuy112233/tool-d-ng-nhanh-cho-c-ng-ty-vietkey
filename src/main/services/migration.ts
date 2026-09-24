/**
 * VietKey DocGen — Database Migration & Schema Versioning Engine
 * Quản lý phiên bản cấu trúc dữ liệu, tự động sao lưu an toàn trước khi di chuyển (pre-migration backup),
 * và tự động rollback nếu xảy ra sự cố trong quá trình nâng cấp ứng dụng.
 */

import { join } from 'path'
import { writeFileSync, existsSync, mkdirSync } from 'fs'

export const CURRENT_SCHEMA_VERSION = 1

export interface MigrationStep {
  fromVersion: number
  toVersion: number
  description: string
  migrate: (data: any) => any | Promise<any>
}

// Danh sách các bước nâng cấp cấu trúc Database theo trình tự phiên bản
export const MIGRATIONS: MigrationStep[] = [
  // Version 1 là cấu trúc chuẩn cơ sở:
  // { settings, partners, history, customTemplates, templates, _schemaVersion: 1 }
]

export interface MigrationResult {
  success: boolean
  previousVersion: number
  currentVersion: number
  migrated: boolean
  backupPath?: string
  error?: string
}

/**
 * Thực hiện kiểm tra phiên bản và chạy migration an toàn có bảo vệ
 */
export async function executeDatabaseMigration(
  inputData: any,
  backupDir: string,
  recoveryDir: string,
  metadataDir: string
): Promise<{ data: any; result: MigrationResult }> {
  const existingVersion = inputData._schemaVersion ?? 1
  inputData._schemaVersion = existingVersion

  // Nếu cùng phiên bản, không cần chạy migration
  if (existingVersion >= CURRENT_SCHEMA_VERSION) {
    saveSchemaMetadata(metadataDir, CURRENT_SCHEMA_VERSION, false)
    return {
      data: inputData,
      result: {
        success: true,
        previousVersion: existingVersion,
        currentVersion: CURRENT_SCHEMA_VERSION,
        migrated: false
      }
    }
  }

  console.log(`[Migration] Phát hiện Database schema cũ (v${existingVersion}). Chuẩn bị nâng cấp lên v${CURRENT_SCHEMA_VERSION}...`)

  // 1. Tạo bản sao lưu dự phòng BẮT BUỘC trước khi migration (Pre-migration Backup)
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFileName = `pre_migration_v${existingVersion}_to_v${CURRENT_SCHEMA_VERSION}_${timestamp}.json`
  const preMigrationBackupPath = join(backupDir, backupFileName)

  try {
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })
    writeFileSync(preMigrationBackupPath, JSON.stringify(inputData, null, 2), 'utf-8')
    console.log(`[Migration] ✓ Đã tạo bản sao lưu an toàn trước migration: ${preMigrationBackupPath}`)
  } catch (err: any) {
    console.error('[Migration] Không thể tạo pre-migration backup:', err)
    return {
      data: inputData,
      result: {
        success: false,
        previousVersion: existingVersion,
        currentVersion: existingVersion,
        migrated: false,
        error: `Không thể tạo backup bảo vệ trước khi nâng cấp: ${err.message}`
      }
    }
  }

  // 2. Chạy từng bước migration theo chuỗi phiên bản
  let currentData = JSON.parse(JSON.stringify(inputData))
  let stepVersion = existingVersion

  try {
    while (stepVersion < CURRENT_SCHEMA_VERSION) {
      const step = MIGRATIONS.find((m) => m.fromVersion === stepVersion)
      if (!step) {
        // Nếu không có step riêng biệt, tự động bump version và chuẩn hóa các trường mặc định
        currentData._schemaVersion = CURRENT_SCHEMA_VERSION
        currentData.settings = currentData.settings || {}
        currentData.partners = currentData.partners || []
        currentData.history = currentData.history || []
        currentData.customTemplates = currentData.customTemplates || []
        stepVersion = CURRENT_SCHEMA_VERSION
        break
      }

      console.log(`[Migration] Đang áp dụng: ${step.description} (v${step.fromVersion} -> v${step.toVersion})`)
      currentData = await step.migrate(currentData)
      currentData._schemaVersion = step.toVersion
      stepVersion = step.toVersion
    }

    currentData._schemaVersion = CURRENT_SCHEMA_VERSION

    // 3. Ghi lại lịch sử migration vào Metadata/
    saveSchemaMetadata(metadataDir, CURRENT_SCHEMA_VERSION, true, preMigrationBackupPath)

    console.log(`[Migration] ✓ Nâng cấp Database thành công lên schema v${CURRENT_SCHEMA_VERSION}!`)
    return {
      data: currentData,
      result: {
        success: true,
        previousVersion: existingVersion,
        currentVersion: CURRENT_SCHEMA_VERSION,
        migrated: true,
        backupPath: preMigrationBackupPath
      }
    }
  } catch (migErr: any) {
    console.error('[Migration] ❌ Lỗi trong quá trình migration, đang phục hồi lại bản sao lưu gốc:', migErr)

    // Ghi lỗi vào thư mục Recovery/
    try {
      if (!existsSync(recoveryDir)) mkdirSync(recoveryDir, { recursive: true })
      const errorLogPath = join(recoveryDir, `migration_failure_${timestamp}.log`)
      const errorDetails = {
        timestamp: new Date().toISOString(),
        fromVersion: existingVersion,
        targetVersion: CURRENT_SCHEMA_VERSION,
        error: migErr?.message || String(migErr),
        stack: migErr?.stack,
        preMigrationBackup: preMigrationBackupPath
      }
      writeFileSync(errorLogPath, JSON.stringify(errorDetails, null, 2), 'utf-8')
    } catch {
      // ignore
    }

    // Rollback về dữ liệu nguyên bản an toàn
    return {
      data: inputData,
      result: {
        success: false,
        previousVersion: existingVersion,
        currentVersion: existingVersion,
        migrated: false,
        backupPath: preMigrationBackupPath,
        error: `Quá trình nâng cấp gặp lỗi. Đã tự động phục hồi an toàn về v${existingVersion}: ${migErr.message}`
      }
    }
  }
}

/**
 * Ghi nhận Metadata phiên bản schema của hệ thống
 */
function saveSchemaMetadata(
  metadataDir: string,
  version: number,
  migrated: boolean,
  lastBackupPath?: string
): void {
  try {
    if (!existsSync(metadataDir)) mkdirSync(metadataDir, { recursive: true })
    const metaPath = join(metadataDir, 'schema.json')
    const meta = {
      schemaVersion: version,
      appVersion: '1.0.0',
      lastVerified: new Date().toISOString(),
      lastMigration: migrated ? new Date().toISOString() : undefined,
      lastPreMigrationBackup: lastBackupPath
    }
    writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
  } catch {
    // ignore
  }
}
