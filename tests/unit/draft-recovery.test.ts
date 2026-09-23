import { describe, it, expect, beforeEach } from 'vitest'
import { DraftRecoveryManager, EditorDraft } from '../../src/renderer/src/core/editor/DraftRecoveryManager'
import { TextEditorObject } from '../../src/renderer/src/core/editor/EditorObjects'

describe('DraftRecoveryManager Test Suite (Nhóm W - Crash Recovery & Local Autosave)', () => {
  // Giả lập localStorage cho môi trường node
  const mockStorage: Record<string, string> = {}

  beforeEach(() => {
    for (const key in mockStorage) {
      delete mockStorage[key]
    }
    // Gán mock localStorage vào global
    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value
      },
      removeItem: (key: string) => {
        delete mockStorage[key]
      },
      clear: () => {
        for (const key in mockStorage) delete mockStorage[key]
      },
      key: (i: number) => Object.keys(mockStorage)[i] || null,
      get length() {
        return Object.keys(mockStorage).length
      }
    } as Storage
  })

  it('Tạo fileKey định danh duy nhất', () => {
    const key = DraftRecoveryManager.generateFileKey('Hop_Dong_2026.pdf', 1048576)
    expect(key).toBe('Hop_Dong_2026_pdf_1048576')
  })

  it('Lưu bản nháp thành công và khôi phục lại nguyên vẹn', () => {
    const fileKey = 'test_doc_1'
    const objects: TextEditorObject[] = [
      {
        id: 'obj_draft_1',
        pageIndex: 0,
        pageId: 'p0',
        type: 'text',
        x: 50,
        y: 100,
        width: 120,
        height: 30,
        text: 'Nội dung hợp đồng quan trọng chưa kịp lưu',
        fontSize: 14,
        fontFamily: 'Inter',
        color: '#ff0000',
        createdAt: 100
      }
    ]

    expect(DraftRecoveryManager.hasDraft(fileKey)).toBe(false)

    DraftRecoveryManager.saveDraft(fileKey, 'HopDong.pdf', objects)

    expect(DraftRecoveryManager.hasDraft(fileKey)).toBe(true)

    const loaded = DraftRecoveryManager.loadDraft(fileKey)
    expect(loaded).toBeDefined()
    expect(loaded?.fileName).toBe('HopDong.pdf')
    expect(loaded?.objects.length).toBe(1)
    expect(loaded?.objects[0].id).toBe('obj_draft_1')
    expect((loaded?.objects[0] as TextEditorObject).text).toBe('Nội dung hợp đồng quan trọng chưa kịp lưu')
  })

  it('Xóa bản nháp sau khi người dùng lưu/xuất file thành công', () => {
    const fileKey = 'test_doc_2'
    DraftRecoveryManager.saveDraft(fileKey, 'FileA.pdf', [
      { id: '1', pageIndex: 0, type: 'text', x: 0, y: 0, width: 20, height: 20, createdAt: 1 } as any
    ])
    expect(DraftRecoveryManager.hasDraft(fileKey)).toBe(true)

    DraftRecoveryManager.clearDraft(fileKey)
    expect(DraftRecoveryManager.hasDraft(fileKey)).toBe(false)
    expect(DraftRecoveryManager.loadDraft(fileKey)).toBeNull()
  })
})
