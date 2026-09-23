import { describe, it, expect, beforeEach } from 'vitest'
import { CommandManager, Command } from '../../src/renderer/src/core/editor/CommandManager'
import { useEditorObjectsStore } from '../../src/renderer/src/stores/pdfEditorObjects.store'
import { TextEditorObject } from '../../src/renderer/src/core/editor/EditorObjects'

describe('CommandHistory Test Suite (Nhóm M & F - Undo/Redo & Drag Transaction)', () => {
  let mgr: CommandManager

  beforeEach(() => {
    mgr = new CommandManager(10) // test với maxHistory nhỏ để kiểm tra rolling buffer
    useEditorObjectsStore.setState({
      objects: [],
      selectedObjectId: null,
      hoveredObjectId: null,
      clipboardObject: null,
      canUndo: false,
      canRedo: false
    })
  })

  it('Thực thi lệnh và Undo / Redo cơ bản', () => {
    let value = 0
    const add5: Command = {
      execute: () => {
        value += 5
      },
      undo: () => {
        value -= 5
      }
    }

    mgr.execute(add5)
    expect(value).toBe(5)
    expect(mgr.canUndo()).toBe(true)
    expect(mgr.canRedo()).toBe(false)

    mgr.undo()
    expect(value).toBe(0)
    expect(mgr.canUndo()).toBe(false)
    expect(mgr.canRedo()).toBe(true)

    mgr.redo()
    expect(value).toBe(5)
    expect(mgr.canUndo()).toBe(true)
    expect(mgr.canRedo()).toBe(false)
  })

  it('Khi thực thi lệnh mới thì Redo stack phải bị xóa sạch (Branching History)', () => {
    let val = 'A'
    const cmdB: Command = { execute: () => (val = 'B'), undo: () => (val = 'A') }
    const cmdC: Command = { execute: () => (val = 'C'), undo: () => (val = 'B') }

    mgr.execute(cmdB)
    mgr.undo()
    expect(val).toBe('A')
    expect(mgr.canRedo()).toBe(true)

    // Thực thi lệnh mới thay vì redo
    mgr.execute(cmdC)
    expect(val).toBe('C')
    expect(mgr.canRedo()).toBe(false) // Redo stack đã bị clear
  })

  it('Transaction Kéo thả: Gom hàng chục frame di chuyển thành 1 bước Undo duy nhất', () => {
    let position = { x: 10, y: 10 }

    mgr.startTransaction('Kéo đối tượng')

    // Mô phỏng 20 sự kiện mousemove liên tiếp
    for (let i = 1; i <= 20; i++) {
      const prevX = position.x
      const nextX = 10 + i * 2
      const stepCmd: Command = {
        execute: () => {
          position.x = nextX
        },
        undo: () => {
          position.x = prevX
        }
      }
      mgr.execute(stepCmd)
    }

    expect(position.x).toBe(50) // 10 + 20*2 = 50
    // Trong khi đang transaction, chưa có lệnh độc lập nào vào undoStack
    expect(mgr.canUndo()).toBe(false)

    // User nhả chuột pointerup -> commit
    mgr.commitTransaction()
    expect(mgr.canUndo()).toBe(true)

    // Chỉ cần 1 lần undo duy nhất, vị trí phải quay về đúng giá trị ban đầu là 10
    mgr.undo()
    expect(position.x).toBe(10)

    // Redo 1 lần, vị trí nhảy ngay tới 50
    mgr.redo()
    expect(position.x).toBe(50)
  })

  it('Hủy Transaction (cancelTransaction) phục hồi ngay lập tức về trạng thái trước khi kéo', () => {
    let position = 100
    mgr.startTransaction('Kéo thả dở dang')

    for (let i = 1; i <= 5; i++) {
      const prev = position
      const next = position + 10
      mgr.execute({
        execute: () => {
          position = next
        },
        undo: () => {
          position = prev
        }
      })
    }
    expect(position).toBe(150)

    // Bấm ESC hoặc chuột văng ra ngoài khung -> cancel
    mgr.cancelTransaction()
    expect(position).toBe(100)
    expect(mgr.canUndo()).toBe(false)
  })

  it('Giới hạn maxHistory ngăn tràn bộ nhớ (Memory Leak Prevention)', () => {
    const manager = new CommandManager(5)

    for (let i = 1; i <= 10; i++) {
      manager.execute({
        execute: () => {},
        undo: () => {}
      })
    }

    // Đã chạy 10 lệnh nhưng maxHistory là 5 nên chỉ có thể undo tối đa 5 lần
    let undoCount = 0
    while (manager.undo()) {
      undoCount++
    }
    expect(undoCount).toBe(5)
  })

  it('Tích hợp đầy đủ vào store: Thêm -> Cập nhật -> Undo -> Redo object', () => {
    const store = useEditorObjectsStore.getState()
    const obj: TextEditorObject = {
      id: 'history_test_obj',
      pageIndex: 0,
      type: 'text',
      x: 0,
      y: 0,
      width: 50,
      height: 20,
      text: 'Original',
      fontSize: 12,
      fontFamily: 'Roboto',
      color: '#000',
      createdAt: 1
    }

    // Thêm object
    store.addObject(obj, true)
    expect(useEditorObjectsStore.getState().objects.length).toBe(1)
    expect(useEditorObjectsStore.getState().canUndo).toBe(true)

    // Cập nhật text
    store.updateObject('history_test_obj', { text: 'Modified' }, true)
    expect((useEditorObjectsStore.getState().getObjectById('history_test_obj') as TextEditorObject).text).toBe(
      'Modified'
    )

    // Undo cập nhật -> text quay về Original
    store.undo()
    expect((useEditorObjectsStore.getState().getObjectById('history_test_obj') as TextEditorObject).text).toBe(
      'Original'
    )

    // Undo thêm -> danh sách objects rỗng
    store.undo()
    expect(useEditorObjectsStore.getState().objects.length).toBe(0)

    // Redo -> object xuất hiện lại
    store.redo()
    expect(useEditorObjectsStore.getState().objects.length).toBe(1)
  })
})
