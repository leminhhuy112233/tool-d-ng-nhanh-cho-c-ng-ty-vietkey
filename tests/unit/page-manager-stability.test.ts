import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorObjectsStore } from '../../src/renderer/src/stores/pdfEditorObjects.store'
import { TextEditorObject } from '../../src/renderer/src/core/editor/EditorObjects'

describe('Page Manager Stability Test Suite (Nhóm C & U - Quản lý trang & Bảo toàn Đối tượng theo pageId)', () => {
  beforeEach(() => {
    useEditorObjectsStore.setState({
      objects: [],
      selectedObjectId: null,
      hoveredObjectId: null,
      clipboardObject: null,
      canUndo: false,
      canRedo: false
    })
  })

  it('Xóa một trang ở giữa: Object thuộc trang bị xóa biến mất, Object thuộc trang sau bám đúng pageId và cập nhật pageIndex', () => {
    // Giả lập tài liệu có 3 trang ban đầu:
    // Trang 0: id 'page_A'
    // Trang 1: id 'page_B'
    // Trang 2: id 'page_C'
    const objA: TextEditorObject = {
      id: 'obj_on_A',
      pageIndex: 0,
      pageId: 'page_A',
      type: 'text',
      x: 10,
      y: 10,
      width: 50,
      height: 20,
      text: 'Đối tượng trang A',
      fontSize: 12,
      fontFamily: 'Inter',
      color: '#000',
      createdAt: 1
    }

    const objB: TextEditorObject = {
      id: 'obj_on_B',
      pageIndex: 1,
      pageId: 'page_B',
      type: 'text',
      x: 20,
      y: 20,
      width: 50,
      height: 20,
      text: 'Đối tượng trang B',
      fontSize: 12,
      fontFamily: 'Inter',
      color: '#000',
      createdAt: 2
    }

    const objC: TextEditorObject = {
      id: 'obj_on_C',
      pageIndex: 2,
      pageId: 'page_C',
      type: 'text',
      x: 30,
      y: 30,
      width: 50,
      height: 20,
      text: 'Đối tượng trang C',
      fontSize: 12,
      fontFamily: 'Inter',
      color: '#000',
      createdAt: 3
    }

    const store = useEditorObjectsStore.getState()
    store.addObject(objA, false)
    store.addObject(objB, false)
    store.addObject(objC, false)

    expect(useEditorObjectsStore.getState().objects.length).toBe(3)

    // User thực hiện xóa Trang 1 ('page_B')
    // Danh sách trang mới chỉ còn Trang A (index 0) và Trang C (bây giờ là index 1)
    const newPages = [
      { id: 'page_A', index: 0 },
      { id: 'page_C', index: 1 }
    ]

    store.remapPageIndices(newPages)

    const remainingObjects = useEditorObjectsStore.getState().objects
    // Object B trên trang bị xóa phải được dọn dẹp sạch sẽ
    expect(remainingObjects.length).toBe(2)
    expect(remainingObjects.find((o) => o.id === 'obj_on_B')).toBeUndefined()

    // Object A giữ nguyên index 0
    const checkA = remainingObjects.find((o) => o.id === 'obj_on_A')
    expect(checkA).toBeDefined()
    expect(checkA?.pageIndex).toBe(0)

    // Object C tự động nhảy từ index 2 sang index 1 (không bị mất hoặc sai vị trí)
    const checkC = remainingObjects.find((o) => o.id === 'obj_on_C')
    expect(checkC).toBeDefined()
    expect(checkC?.pageIndex).toBe(1)
  })

  it('Đảo thứ tự các trang (Reorder Pages): Đối tượng chuyển dịch theo đúng trang đích', () => {
    const objA: TextEditorObject = {
      id: 'obj_A',
      pageIndex: 0,
      pageId: 'page_1',
      type: 'text',
      x: 10,
      y: 10,
      width: 40,
      height: 20,
      text: 'Page 1 text',
      fontSize: 12,
      fontFamily: 'Roboto',
      color: '#000',
      createdAt: 1
    }

    const objB: TextEditorObject = {
      id: 'obj_B',
      pageIndex: 1,
      pageId: 'page_2',
      type: 'text',
      x: 10,
      y: 10,
      width: 40,
      height: 20,
      text: 'Page 2 text',
      fontSize: 12,
      fontFamily: 'Roboto',
      color: '#000',
      createdAt: 2
    }

    const store = useEditorObjectsStore.getState()
    store.addObject(objA, false)
    store.addObject(objB, false)

    // Hoán đổi: Trang 2 lên đầu (index 0), Trang 1 xuống sau (index 1)
    const reorderedPages = [
      { id: 'page_2', index: 0 },
      { id: 'page_1', index: 1 }
    ]

    store.remapPageIndices(reorderedPages)

    const updatedA = store.getObjectById('obj_A')
    const updatedB = store.getObjectById('obj_B')

    expect(updatedA?.pageIndex).toBe(1)
    expect(updatedB?.pageIndex).toBe(0)
  })

  it('removeObjectsByPageId xóa triệt để toàn bộ đối tượng của trang mục tiêu và clear selection nếu đang chọn', () => {
    const obj1: TextEditorObject = {
      id: 'target_1',
      pageIndex: 0,
      pageId: 'page_to_delete',
      type: 'text',
      x: 10,
      y: 10,
      width: 40,
      height: 20,
      text: 'Target 1',
      fontSize: 12,
      fontFamily: 'Roboto',
      color: '#000',
      createdAt: 1
    }

    const obj2: TextEditorObject = {
      id: 'target_2',
      pageIndex: 0,
      pageId: 'page_to_delete',
      type: 'text',
      x: 50,
      y: 50,
      width: 40,
      height: 20,
      text: 'Target 2',
      fontSize: 12,
      fontFamily: 'Roboto',
      color: '#000',
      createdAt: 2
    }

    const objSafe: TextEditorObject = {
      id: 'safe_obj',
      pageIndex: 1,
      pageId: 'page_stay',
      type: 'text',
      x: 10,
      y: 10,
      width: 40,
      height: 20,
      text: 'Safe',
      fontSize: 12,
      fontFamily: 'Roboto',
      color: '#000',
      createdAt: 3
    }

    const store = useEditorObjectsStore.getState()
    store.addObject(obj1, false)
    store.addObject(obj2, false)
    store.addObject(objSafe, false)

    store.setSelectedObjectId('target_1')
    expect(useEditorObjectsStore.getState().selectedObjectId).toBe('target_1')

    store.removeObjectsByPageId('page_to_delete')

    const state = useEditorObjectsStore.getState()
    expect(state.objects.length).toBe(1)
    expect(state.objects[0].id).toBe('safe_obj')
    expect(state.selectedObjectId).toBeNull() // Tự động bỏ chọn vì đối tượng bị xóa
  })
})
