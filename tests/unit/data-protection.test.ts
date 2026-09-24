import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs'
import { executeDatabaseMigration, CURRENT_SCHEMA_VERSION } from '../../src/main/services/migration'

describe('Data Protection Layer & Database Migration', () => {
  const testRoot = join(__dirname, '..', '..', 'scratch', 'test_data_hub')
  const testBackups = join(testRoot, 'Backups')
  const testRecovery = join(testRoot, 'Recovery')
  const testMetadata = join(testRoot, 'Metadata')

  beforeEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
    mkdirSync(testBackups, { recursive: true })
    mkdirSync(testRecovery, { recursive: true })
    mkdirSync(testMetadata, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('giữ nguyên dữ liệu khi database đã ở đúng schema version hiện tại', async () => {
    const mockData = {
      _schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: { theme: 'dark' },
      partners: [{ id: '1', ten_cong_ty: 'VIETKEY TEST' }],
      history: []
    }

    const { data, result } = await executeDatabaseMigration(
      mockData,
      testBackups,
      testRecovery,
      testMetadata
    )

    expect(result.success).toBe(true)
    expect(result.migrated).toBe(false)
    expect(data._schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(data.partners).toHaveLength(1)
  })

  it('tự động tạo pre-migration backup khi phát hiện schema cũ', async () => {
    const mockOldData = {
      _schemaVersion: 0,
      settings: { theme: 'light' },
      partners: [{ id: 'old_1', ten_cong_ty: 'OLD PARTNER' }],
      history: []
    }

    const { data, result } = await executeDatabaseMigration(
      mockOldData,
      testBackups,
      testRecovery,
      testMetadata
    )

    expect(result.success).toBe(true)
    expect(result.migrated).toBe(true)
    expect(data._schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.backupPath).toBeDefined()
    expect(existsSync(result.backupPath!)).toBe(true)

    // Xác nhận nội dung trong pre-migration backup giữ nguyên phiên bản cũ
    const backupContent = JSON.parse(readFileSync(result.backupPath!, 'utf-8'))
    expect(backupContent._schemaVersion).toBe(0)
    expect(backupContent.partners[0].ten_cong_ty).toBe('OLD PARTNER')
  })

  it('ghi nhận file schema metadata trong thư mục Metadata/', async () => {
    const mockData = {
      _schemaVersion: CURRENT_SCHEMA_VERSION,
      settings: {},
      partners: [],
      history: []
    }

    await executeDatabaseMigration(mockData, testBackups, testRecovery, testMetadata)

    const metaFile = join(testMetadata, 'schema.json')
    expect(existsSync(metaFile)).toBe(true)

    const meta = JSON.parse(readFileSync(metaFile, 'utf-8'))
    expect(meta.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(meta.lastVerified).toBeDefined()
  })
})
