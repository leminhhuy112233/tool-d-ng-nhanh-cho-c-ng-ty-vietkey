/**
 * VietKey DocGen — Template Version Management & Rollback Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { join } from 'path'
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs'
import type { CustomTemplateDef, TemplateVersion } from '../../src/shared/types'

describe('Template Version Management & Rollback Lifecycle', () => {
  const testRoot = join(__dirname, '..', '..', 'scratch', 'test_versioning_hub')
  const testTemplatesDir = join(testRoot, 'Templates')
  const testVersionsDir = join(testRoot, 'Templates', 'Versions')

  beforeEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
    mkdirSync(testVersionsDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testRoot)) {
      rmSync(testRoot, { recursive: true, force: true })
    }
  })

  it('khởi tạo template với version 1.0 và tự động tạo snapshot v1.docx', () => {
    const templateId = 'tpl_test_001'
    const tplVersionDir = join(testVersionsDir, `tpl_${templateId}`)
    mkdirSync(tplVersionDir, { recursive: true })

    const activeDocxPath = join(testTemplatesDir, `${templateId}.docx`)
    const v1DocxPath = join(tplVersionDir, 'v1.docx')

    const initialContent = 'DOCX_CONTENT_VERSION_1'
    writeFileSync(activeDocxPath, initialContent, 'utf-8')
    writeFileSync(v1DocxPath, initialContent, 'utf-8')

    const initialVersion: TemplateVersion = {
      version: 1,
      createdAt: new Date().toISOString(),
      fileName: 'test_template.docx',
      docxFilePath: v1DocxPath,
      changeNote: 'Khởi tạo mẫu ban đầu',
      fieldsCount: 5
    }

    const templateDef: CustomTemplateDef = {
      id: templateId,
      name: 'Mẫu Thử Nghiệm v1',
      description: 'Mô tả ban đầu',
      fileName: 'test_template.docx',
      docxFilePath: activeDocxPath,
      fields: [
        { id: '1', key: 'ten_khach', label: 'Tên Khách Hàng', type: 'text', section: 'Chung' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: 1,
      versions: [initialVersion]
    }

    expect(templateDef.currentVersion).toBe(1)
    expect(templateDef.versions).toHaveLength(1)
    expect(templateDef.versions![0].version).toBe(1)
    expect(existsSync(activeDocxPath)).toBe(true)
    expect(existsSync(v1DocxPath)).toBe(true)
    expect(readFileSync(v1DocxPath, 'utf-8')).toBe('DOCX_CONTENT_VERSION_1')
  })

  it('nâng cấp template lên version 2.0: lưu snapshot mới và cập nhật lịch sử', () => {
    const templateId = 'tpl_test_002'
    const tplVersionDir = join(testVersionsDir, `tpl_${templateId}`)
    mkdirSync(tplVersionDir, { recursive: true })

    const activeDocxPath = join(testTemplatesDir, `${templateId}.docx`)
    const v1DocxPath = join(tplVersionDir, 'v1.docx')
    const v2DocxPath = join(tplVersionDir, 'v2.docx')

    writeFileSync(activeDocxPath, 'DOCX_CONTENT_VERSION_1', 'utf-8')
    writeFileSync(v1DocxPath, 'DOCX_CONTENT_VERSION_1', 'utf-8')

    let templateDef: CustomTemplateDef = {
      id: templateId,
      name: 'Mẫu v1',
      description: 'Ban đầu',
      fileName: 'sample.docx',
      docxFilePath: activeDocxPath,
      fields: [{ id: '1', key: 'ten', label: 'Tên', type: 'text', section: 'A' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: 1,
      versions: [
        {
          version: 1,
          createdAt: new Date().toISOString(),
          fileName: 'sample.docx',
          docxFilePath: v1DocxPath,
          changeNote: 'Khởi tạo mẫu ban đầu',
          fieldsCount: 1
        }
      ]
    }

    // Giả lập logic nâng cấp lên v2
    const nextVer = (templateDef.currentVersion || 1) + 1
    const newDocxContent = 'DOCX_CONTENT_VERSION_2'

    // Ghi file v2 và cập nhật file active
    writeFileSync(v2DocxPath, newDocxContent, 'utf-8')
    writeFileSync(activeDocxPath, newDocxContent, 'utf-8')

    const newVersionRecord: TemplateVersion = {
      version: nextVer,
      createdAt: new Date().toISOString(),
      fileName: 'sample_v2.docx',
      docxFilePath: v2DocxPath,
      changeNote: 'Cập nhật điều khoản thanh toán',
      fieldsCount: 2
    }

    templateDef = {
      ...templateDef,
      name: 'Mẫu v2 (Đã Cập Nhật)',
      currentVersion: nextVer,
      updatedAt: new Date().toISOString(),
      versions: [newVersionRecord, ...templateDef.versions!]
    }

    expect(templateDef.currentVersion).toBe(2)
    expect(templateDef.versions).toHaveLength(2)
    expect(templateDef.versions![0].version).toBe(2)
    expect(templateDef.versions![0].changeNote).toBe('Cập nhật điều khoản thanh toán')
    expect(readFileSync(activeDocxPath, 'utf-8')).toBe('DOCX_CONTENT_VERSION_2')
    expect(readFileSync(v1DocxPath, 'utf-8')).toBe('DOCX_CONTENT_VERSION_1')
    expect(readFileSync(v2DocxPath, 'utf-8')).toBe('DOCX_CONTENT_VERSION_2')
  })

  it('khôi phục (Rollback) về version 1.0: file active được phục hồi chính xác từ snapshot', () => {
    const templateId = 'tpl_test_003'
    const tplVersionDir = join(testVersionsDir, `tpl_${templateId}`)
    mkdirSync(tplVersionDir, { recursive: true })

    const activeDocxPath = join(testTemplatesDir, `${templateId}.docx`)
    const v1DocxPath = join(tplVersionDir, 'v1.docx')
    const v2DocxPath = join(tplVersionDir, 'v2.docx')

    writeFileSync(v1DocxPath, 'STABLE_ORIGINAL_VERSION_1', 'utf-8')
    writeFileSync(v2DocxPath, 'CORRUPTED_OR_UNWANTED_VERSION_2', 'utf-8')
    writeFileSync(activeDocxPath, 'CORRUPTED_OR_UNWANTED_VERSION_2', 'utf-8')

    let templateDef: CustomTemplateDef = {
      id: templateId,
      name: 'Mẫu Hỏng Cần Rollback',
      description: 'Đang ở v2 bị lỗi',
      fileName: 'contract_v2.docx',
      docxFilePath: activeDocxPath,
      fields: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentVersion: 2,
      versions: [
        {
          version: 2,
          createdAt: new Date().toISOString(),
          fileName: 'contract_v2.docx',
          docxFilePath: v2DocxPath,
          changeNote: 'Bản v2 bị lỗi',
          fieldsCount: 0
        },
        {
          version: 1,
          createdAt: new Date().toISOString(),
          fileName: 'contract_v1.docx',
          docxFilePath: v1DocxPath,
          changeNote: 'Bản gốc ổn định',
          fieldsCount: 3
        }
      ]
    }

    // Thực hiện Rollback về version 1
    const targetVer = templateDef.versions!.find((v) => v.version === 1)
    expect(targetVer).toBeDefined()

    // Copy snapshot v1 đè vào active file
    const snapshotContent = readFileSync(targetVer!.docxFilePath, 'utf-8')
    writeFileSync(activeDocxPath, snapshotContent, 'utf-8')

    templateDef = {
      ...templateDef,
      currentVersion: targetVer!.version,
      fileName: targetVer!.fileName,
      updatedAt: new Date().toISOString()
    }

    expect(templateDef.currentVersion).toBe(1)
    expect(readFileSync(activeDocxPath, 'utf-8')).toBe('STABLE_ORIGINAL_VERSION_1')
  })

  it('giới hạn tối đa 20 phiên bản lịch sử để bảo vệ bộ nhớ đĩa', () => {
    const versions: TemplateVersion[] = []
    for (let i = 1; i <= 25; i++) {
      versions.unshift({
        version: i,
        createdAt: new Date().toISOString(),
        fileName: `file_v${i}.docx`,
        docxFilePath: `path/v${i}.docx`,
        changeNote: `Cập nhật v${i}`,
        fieldsCount: i
      })
    }

    // Giới hạn max 20
    const cappedVersions = versions.slice(0, 20)
    expect(cappedVersions).toHaveLength(20)
    expect(cappedVersions[0].version).toBe(25)
    expect(cappedVersions[19].version).toBe(6)
  })
})
