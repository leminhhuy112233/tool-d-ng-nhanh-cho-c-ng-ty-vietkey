import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorObjectsStore, editorCommandManager } from '../../src/renderer/src/stores/pdfEditorObjects.store'
import { EditorObject, TextEditorObject } from '../../src/renderer/src/core/editor/EditorObjects'

describe('EditorObjects Store Test Suite (Nhóm D, G, L, N - CRUD, Min-size, Z-Index, Clone)', () => {
  beforeEach(() => {
    // Reset store và command manager trước mỗi test
    editorCommandManager.clear()
    useEditorObjectsStore.setState({
      objects: [],
      selectedObjectId: null,
      hoveredObjectId: null,
      clipboardObject: null,
      canUndo: false,
      canRedo: false
    })
  })

  it('Thêm đối tượng (addObject) và tự động chọn đối tượng đó', () => {
    const textObj: TextEditorObject = {
      id: 'test_obj_1',
      pageIndex: 0,
      pageId: 'page_uuid_1',
      type: 'text',
      x: 50,
      y: 100,
      width: 120,
      height: 40,
      text: 'Xin chào Việt Nam',
      fontSize: 14,
      fontFamily: 'Roboto',
      color: '#000000',
      createdAt: Date.now()
    }

    useEditorObjectsStore.getState().addObject(textObj)

    const state = useEditorObjectsStore.getState()
    expect(state.objects.length).toBe(1)
    expect(state.objects[0].id).toBe('test_obj_1')
    expect(state.selectedObjectId).toBe('test_obj_1')
  })

  it('Cập nhật thuộc tính và bảo vệ Min-size (width >= 10, height >= 10)', () => {
    const textObj: TextEditorObject = {
      id: 'test_min_size',
      pageIndex: 0,
      type: 'text',
      x: 50,
      y: 100,
      width: 100,
      height: 80,
      text: 'Test',
      fontSize: 14,
      fontFamily: 'Roboto',
      color: '#000000',
      createdAt: Date.now()
    }

    useEditorObjectsStore.getState().addObject(textObj, false)

    // Thử resize về kích thước âm hoặc siêu bé (< 10)
    useEditorObjectsStore.getState().updateObject('test_min_size', { width: -50, height: 2 }, false)

    const updated = useEditorObjectsStore.getState().getObjectById('test_min_size')
    expect(updated).toBeDefined()
    expect(updated?.width).toBe(10) // Tự động kẹp tối thiểu 10
    expect(updated?.height).toBe(10) // Tự động kẹp tối thiểu 10
  })

  it('Z-Index Layering: bringForward, sendBackward, bringToFront, sendToBack hoạt động chuẩn xác', () => {
    const obj1 = { id: 'obj1', pageIndex: 0, type: 'text', x: 0, y: 0, width: 20, height: 20, createdAt: 1 } as EditorObject
    const obj2 = { id: 'obj2', pageIndex: 0, type: 'text', x: 0, y: 0, width: 20, height: 20, createdAt: 2 } as EditorObject
    const obj3 = { id: 'obj3', pageIndex: 0, type: 'text', x: 0, y: 0, width: 20, height: 20, createdAt: 3 } as EditorObject

    const store = useEditorObjectsStore.getState()
    store.addObject(obj1, false)
    store.addObject(obj2, false)
    store.addObject(obj3, false)

    expect(useEditorObjectsStore.getState().objects.map((o) => o.id)).toEqual(['obj1', 'obj2', 'obj3'])

    // bringToFront obj1 -> [obj2, obj3, obj1]
    store.bringToFront('obj1')
    expect(useEditorObjectsStore.getState().objects.map((o) => o.id)).toEqual(['obj2', 'obj3', 'obj1'])

    // sendToBack obj1 -> [obj1, obj2, obj3]
    store.sendToBack('obj1')
    expect(useEditorObjectsStore.getState().objects.map((o) => o.id)).toEqual(['obj1', 'obj2', 'obj3'])

    // bringForward obj1 -> [obj2, obj1, obj3]
    store.bringForward('obj1')
    expect(useEditorObjectsStore.getState().objects.map((o) => o.id)).toEqual(['obj2', 'obj1', 'obj3'])

    // sendBackward obj1 -> [obj1, obj2, obj3]
    store.sendBackward('obj1')
    expect(useEditorObjectsStore.getState().objects.map((o) => o.id)).toEqual(['obj1', 'obj2', 'obj3'])
  })

  it('Deep Clone: Duplicate và Copy/Paste tạo bản sao độc lập hoàn toàn, không dính tham chiếu (shared mutable state)', () => {
    const original: TextEditorObject = {
      id: 'orig_1',
      pageIndex: 0,
      type: 'text',
      x: 100,
      y: 100,
      width: 150,
      height: 50,
      text: 'Văn bản gốc',
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#333333',
      createdAt: 1000
    }

    const store = useEditorObjectsStore.getState()
    store.addObject(original, false)

    // Duplicate
    store.duplicateObject('orig_1')
    const objects = useEditorObjectsStore.getState().objects
    expect(objects.length).toBe(2)

    const duplicate = objects[1]
    expect(duplicate.id).not.toBe('orig_1')
    expect(duplicate.x).toBe(115) // Offset +15
    expect(duplicate.y).toBe(115)

    // Sửa duplicate, bảo đảm original không đổi
    store.updateObject(duplicate.id, { text: 'Văn bản đã sửa' }, false)

    const origCheck = useEditorObjectsStore.getState().getObjectById('orig_1') as TextEditorObject
    const dupCheck = useEditorObjectsStore.getState().getObjectById(duplicate.id) as TextEditorObject

    expect(origCheck.text).toBe('Văn bản gốc')
    expect(dupCheck.text).toBe('Văn bản đã sửa')
  })

  it('Copy / Paste giữa các trang giữ nguyên dữ liệu và gán đúng targetPageIndex', () => {
    const orig: TextEditorObject = {
      id: 'clip_orig',
      pageIndex: 0,
      type: 'text',
      x: 50,
      y: 50,
      width: 100,
      height: 30,
      text: 'Copy me',
      fontSize: 12,
      fontFamily: 'Inter',
      color: '#000000',
      createdAt: 1
    }

    const store = useEditorObjectsStore.getState()
    store.addObject(orig, false)
    store.copyObject('clip_orig')

    // Paste sang trang index 3
    store.pasteObject(3)

    const page3Objects = useEditorObjectsStore.getState().getObjectsByPage(3)
    expect(page3Objects.length).toBe(1)
    expect(page3Objects[0].pageIndex).toBe(3)
    expect(page3Objects[0].x).toBe(65)
  })
})
