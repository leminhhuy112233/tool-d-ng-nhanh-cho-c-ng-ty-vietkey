/**
 * pdfEditorObjects.store — Quản lý trạng thái đa đối tượng (Multi-Object) và Lịch sử Undo/Redo
 * Tích hợp chuẩn Command Pattern với CommandManager, đảm bảo:
 * - Mọi thao tác Thêm, Sửa, Xóa, Di chuyển, Co giãn, Đổi màu, Nhân bản đều có thể Undo/Redo hoàn hảo.
 * - Drag/Resize liên tục được gom thành 1 Transaction duy nhất khi pointerup.
 * - Tọa độ (x, y, width, height) luôn là chuẩn PDF Points.
 */

import { create } from 'zustand'
import { EditorObject } from '../core/editor/EditorObjects'
import { CommandManager, Command } from '../core/editor/CommandManager'

export const editorCommandManager = new CommandManager(50)

export interface EditorObjectsState {
  objects: EditorObject[]
  selectedObjectId: string | null
  hoveredObjectId: string | null
  clipboardObject: EditorObject | null
  canUndo: boolean
  canRedo: boolean

  // Object CRUD Actions
  addObject: (object: EditorObject, recordHistory?: boolean) => void
  updateObject: (id: string, updates: Partial<EditorObject>, recordHistory?: boolean) => void
  removeObject: (id: string, recordHistory?: boolean) => void
  removeSelectedObject: () => void
  setSelectedObjectId: (id: string | null) => void
  setHoveredObjectId: (id: string | null) => void
  clearObjects: (pageIndex?: number) => void

  // Clone & Clipboard
  duplicateObject: (id: string) => void
  copyObject: (id: string) => void
  pasteObject: (targetPageIndex?: number) => void

  // Z-Index Layering
  bringForward: (id: string) => void
  sendBackward: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void

  // History Actions
  undo: () => boolean
  redo: () => boolean
  startDragTransaction: (description?: string) => void
  commitDragTransaction: () => void
  cancelDragTransaction: () => void

  // Helpers
  getObjectById: (id: string) => EditorObject | undefined
  getObjectsByPage: (pageIndex: number) => EditorObject[]
  remapPageIndices: (pages: Array<{ id?: string; index: number }>) => void
  removeObjectsByPageId: (pageId: string) => void
}

export const useEditorObjectsStore = create<EditorObjectsState>((set, get) => {
  // Đồng bộ trạng thái canUndo / canRedo từ CommandManager
  const syncHistoryState = () => {
    set({
      canUndo: editorCommandManager.hasUndo(),
      canRedo: editorCommandManager.hasRedo()
    })
  }

  return {
    objects: [],
    selectedObjectId: null,
    hoveredObjectId: null,
    clipboardObject: null,
    canUndo: false,
    canRedo: false,

    addObject: (object: EditorObject, recordHistory = true) => {
      const prevObjects = get().objects
      const newObjects = [...prevObjects, object]

      if (recordHistory) {
        const cmd: Command = {
          description: `Thêm đối tượng ${object.label || object.type}`,
          execute: () => {
            set((state) => ({
              objects: [...state.objects.filter((o) => o.id !== object.id), object],
              selectedObjectId: object.id
            }))
            syncHistoryState()
          },
          undo: () => {
            set((state) => ({
              objects: state.objects.filter((o) => o.id !== object.id),
              selectedObjectId: state.selectedObjectId === object.id ? null : state.selectedObjectId
            }))
            syncHistoryState()
          }
        }
        editorCommandManager.execute(cmd)
      } else {
        set({ objects: newObjects, selectedObjectId: object.id })
      }
      syncHistoryState()
    },

    updateObject: (id: string, updates: Partial<EditorObject>, recordHistory = true) => {
      const current = get().objects.find((o) => o.id === id)
      if (!current) return

      const safeUpdates = { ...updates }
      if (typeof safeUpdates.width === 'number') {
        safeUpdates.width = Math.max(10, safeUpdates.width)
      }
      if (typeof safeUpdates.height === 'number') {
        safeUpdates.height = Math.max(10, safeUpdates.height)
      }

      const previousState = { ...current }
      const updatedObject = { ...current, ...safeUpdates, updatedAt: Date.now() } as EditorObject

      if (recordHistory) {
        const cmd: Command = {
          description: `Cập nhật đối tượng ${current.label || current.type}`,
          execute: () => {
            set((state) => ({
              objects: state.objects.map((o) => (o.id === id ? updatedObject : o))
            }))
            syncHistoryState()
          },
          undo: () => {
            set((state) => ({
              objects: state.objects.map((o) => (o.id === id ? previousState : o))
            }))
            syncHistoryState()
          }
        }
        editorCommandManager.execute(cmd)
      } else {
        set((state) => ({
          objects: state.objects.map((o) => (o.id === id ? updatedObject : o))
        }))
      }
      syncHistoryState()
    },

    removeObject: (id: string, recordHistory = true) => {
      const target = get().objects.find((o) => o.id === id)
      if (!target) return

      if (recordHistory) {
        const cmd: Command = {
          description: `Xóa đối tượng ${target.label || target.type}`,
          execute: () => {
            set((state) => ({
              objects: state.objects.filter((o) => o.id !== id),
              selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
            }))
            syncHistoryState()
          },
          undo: () => {
            set((state) => ({
              objects: [...state.objects, target],
              selectedObjectId: id
            }))
            syncHistoryState()
          }
        }
        editorCommandManager.execute(cmd)
      } else {
        set((state) => ({
          objects: state.objects.filter((o) => o.id !== id),
          selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
        }))
      }
      syncHistoryState()
    },

    removeSelectedObject: () => {
      const selectedId = get().selectedObjectId
      if (selectedId) {
        get().removeObject(selectedId)
      }
    },

    setSelectedObjectId: (id: string | null) => {
      set({ selectedObjectId: id })
    },

    setHoveredObjectId: (id: string | null) => {
      set({ hoveredObjectId: id })
    },

    clearObjects: (pageIndex?: number) => {
      if (typeof pageIndex === 'number') {
        set((state) => ({
          objects: state.objects.filter((o) => o.pageIndex !== pageIndex),
          selectedObjectId: null
        }))
      } else {
        set({ objects: [], selectedObjectId: null })
      }
      syncHistoryState()
    },

    duplicateObject: (id: string) => {
      const source = get().objects.find((o) => o.id === id)
      if (!source) return

      const newId = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const cloned: EditorObject = {
        ...JSON.parse(JSON.stringify(source)),
        id: newId,
        x: source.x + 15,
        y: source.y + 15,
        label: `${source.label || source.type} (Bản sao)`,
        createdAt: Date.now()
      }

      get().addObject(cloned, true)
    },

    copyObject: (id: string) => {
      const source = get().objects.find((o) => o.id === id)
      if (source) {
        set({ clipboardObject: JSON.parse(JSON.stringify(source)) })
      }
    },

    pasteObject: (targetPageIndex?: number) => {
      const clip = get().clipboardObject
      if (!clip) return

      const newId = `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const pasted: EditorObject = {
        ...JSON.parse(JSON.stringify(clip)),
        id: newId,
        pageIndex: typeof targetPageIndex === 'number' ? targetPageIndex : clip.pageIndex,
        x: clip.x + 15,
        y: clip.y + 15,
        createdAt: Date.now()
      }

      get().addObject(pasted, true)
    },

    bringForward: (id: string) => {
      const objs = [...get().objects]
      const idx = objs.findIndex((o) => o.id === id)
      if (idx >= 0 && idx < objs.length - 1) {
        const temp = objs[idx]
        objs[idx] = objs[idx + 1]
        objs[idx + 1] = temp
        set({ objects: objs })
      }
    },

    sendBackward: (id: string) => {
      const objs = [...get().objects]
      const idx = objs.findIndex((o) => o.id === id)
      if (idx > 0) {
        const temp = objs[idx]
        objs[idx] = objs[idx - 1]
        objs[idx - 1] = temp
        set({ objects: objs })
      }
    },

    bringToFront: (id: string) => {
      const objs = [...get().objects]
      const idx = objs.findIndex((o) => o.id === id)
      if (idx >= 0 && idx < objs.length - 1) {
        const [target] = objs.splice(idx, 1)
        objs.push(target)
        set({ objects: objs })
      }
    },

    sendToBack: (id: string) => {
      const objs = [...get().objects]
      const idx = objs.findIndex((o) => o.id === id)
      if (idx > 0) {
        const [target] = objs.splice(idx, 1)
        objs.unshift(target)
        set({ objects: objs })
      }
    },

    undo: () => {
      const res = editorCommandManager.undo()
      syncHistoryState()
      return res
    },

    redo: () => {
      const res = editorCommandManager.redo()
      syncHistoryState()
      return res
    },

    startDragTransaction: (description = 'Thao tác kéo thả / co giãn') => {
      editorCommandManager.startTransaction(description)
    },

    commitDragTransaction: () => {
      editorCommandManager.commitTransaction()
      syncHistoryState()
    },

    cancelDragTransaction: () => {
      editorCommandManager.cancelTransaction()
      syncHistoryState()
    },

    getObjectById: (id: string) => {
      return get().objects.find((o) => o.id === id)
    },

    getObjectsByPage: (pageIndex: number) => {
      return get().objects.filter((o) => o.pageIndex === pageIndex)
    },

    remapPageIndices: (pages: Array<{ id?: string; index: number }>) => {
      const pageIdMap = new Map<string, number>()
      pages.forEach((p) => {
        if (p.id) pageIdMap.set(p.id, p.index)
      })

      set((state) => {
        const updated = state.objects
          .filter((obj) => {
            if (obj.pageId) {
              return pageIdMap.has(obj.pageId)
            }
            return obj.pageIndex < pages.length
          })
          .map((obj) => {
            if (obj.pageId && pageIdMap.has(obj.pageId)) {
              return { ...obj, pageIndex: pageIdMap.get(obj.pageId)! }
            }
            return obj
          })
        return { objects: updated }
      })
      syncHistoryState()
    },

    removeObjectsByPageId: (pageId: string) => {
      set((state) => ({
        objects: state.objects.filter((obj) => obj.pageId !== pageId),
        selectedObjectId:
          state.selectedObjectId &&
          state.objects.find((o) => o.id === state.selectedObjectId)?.pageId === pageId
            ? null
            : state.selectedObjectId
      }))
      syncHistoryState()
    }
  }
})
