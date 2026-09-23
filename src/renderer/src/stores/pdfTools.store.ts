/**
 * VietKey PDF Tools — Zustand Store (Enterprise Edition)
 * Quản lý state toàn bộ module PDF: Ribbon tabs, file, trang, zoom, chế độ xem, HUD, annotations
 */

import { create } from 'zustand'
import type { PdfPageInfo } from '../../../shared/types'
import { destroySharedPdfDoc } from '../utils/pdfConfig'
import { useEditorObjectsStore } from './pdfEditorObjects.store'

export type PdfViewMode = 'page' | 'thumbnail'
export type PdfTool =
  | 'select'
  | 'pan'
  | 'text'
  | 'signature'
  | 'image'
  | 'draw'
  | 'highlight'
  | 'stamp'
  | 'whiteout'
  | 'shape'
  | 'underline'
  | 'strikeout'
  | 'comment'
export type PdfRibbonTab = 'home' | 'organize' | 'sign' | 'markup' | 'protect'
export type PdfSidebarTab = 'thumbnails' | 'signatures' | 'info'

export interface PdfState {
  // File state
  fileName: string | null
  filePath: string | null
  pdfBase64: string | null
  fileSize: string | null
  pageCount: number
  pages: PdfPageInfo[]
  isLoading: boolean
  error: string | null
  hasChanges: boolean

  // UI state
  activeRibbonTab: PdfRibbonTab
  sidebarOpen: boolean
  sidebarTab: PdfSidebarTab
  isHudVisible: boolean
  viewMode: PdfViewMode
  currentPage: number
  zoomLevel: number // percentage, 100 = 100%
  selectedPages: number[] // multi-select cho thumbnail / organize mode
  panMode: boolean

  // Tool state
  activeTool: PdfTool

  // Undo / Redo history
  undoStack: string[] // base64 snapshots
  redoStack: string[]
  canUndo: boolean
  canRedo: boolean

  // Actions
  loadPdf: (fileName: string, filePath: string | null, base64: string, pages: PdfPageInfo[], fileSize?: string) => void
  closePdf: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setActiveRibbonTab: (tab: PdfRibbonTab) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarTab: (tab: PdfSidebarTab) => void
  toggleHud: () => void
  setViewMode: (mode: PdfViewMode) => void
  setCurrentPage: (page: number) => void
  setZoomLevel: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  fitWidth: () => void
  fitPage: () => void
  togglePageSelect: (pageIndex: number) => void
  selectPageRange: (startIndex: number, endIndex: number) => void
  clearSelection: () => void
  selectAllPages: () => void
  setPanMode: (enabled: boolean) => void
  setActiveTool: (tool: PdfTool) => void
  setHasChanges: (hasChanges: boolean) => void
  updatePdfData: (base64: string, pages: PdfPageInfo[]) => void
  pushUndo: () => void
  undo: () => void
  redo: () => void
}

export const usePdfStore = create<PdfState>((set, get) => ({
  // Initial state
  fileName: null,
  filePath: null,
  pdfBase64: null,
  fileSize: null,
  pageCount: 0,
  pages: [],
  isLoading: false,
  error: null,
  hasChanges: false,

  activeRibbonTab: 'home',
  sidebarOpen: true,
  sidebarTab: 'thumbnails',
  isHudVisible: true,
  viewMode: 'page',
  currentPage: 0,
  zoomLevel: 100,
  selectedPages: [],
  panMode: false,
  activeTool: 'select',
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  // Actions
  loadPdf: (fileName, filePath, base64, pages, fileSize) => {
    // Calculate readable file size if not provided
    let calculatedSize = fileSize || null
    if (!calculatedSize && base64) {
      const bytes = Math.round((base64.length * 3) / 4)
      if (bytes < 1024 * 1024) {
        calculatedSize = `${(bytes / 1024).toFixed(1)} KB`
      } else {
        calculatedSize = `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      }
    }

    const normalizedPages: PdfPageInfo[] = pages.map((p, idx) => ({
      ...p,
      index: idx,
      id: p.id || `page_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    }))

    set({
      fileName,
      filePath,
      pdfBase64: base64,
      fileSize: calculatedSize,
      pageCount: normalizedPages.length,
      pages: normalizedPages,
      isLoading: false,
      error: null,
      currentPage: 0,
      selectedPages: [],
      undoStack: [],
      canUndo: false,
      hasChanges: false,
      activeRibbonTab: 'home'
    })
  },

  closePdf: () => {
    try {
      destroySharedPdfDoc()
    } catch {}
    set({
      fileName: null,
      filePath: null,
      pdfBase64: null,
      fileSize: null,
      pageCount: 0,
      pages: [],
      error: null,
      currentPage: 0,
      selectedPages: [],
      undoStack: [],
      canUndo: false,
      hasChanges: false
    })
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  setActiveRibbonTab: (tab) => set({ activeRibbonTab: tab }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  toggleHud: () => set((state) => ({ isHudVisible: !state.isHudVisible })),
  setViewMode: (mode) => set({ viewMode: mode }),

  setCurrentPage: (page) => {
    const { pageCount } = get()
    if (page >= 0 && page < pageCount) {
      set({ currentPage: page })
    }
  },

  setZoomLevel: (zoom) => {
    const clamped = Math.max(25, Math.min(400, Math.round(zoom)))
    set({ zoomLevel: clamped })
  },

  zoomIn: () => {
    const { zoomLevel } = get()
    const steps = [25, 50, 75, 100, 125, 150, 200, 300, 400]
    const next = steps.find((s) => s > zoomLevel) || Math.min(400, zoomLevel + 25)
    set({ zoomLevel: next })
  },

  zoomOut: () => {
    const { zoomLevel } = get()
    const steps = [25, 50, 75, 100, 125, 150, 200, 300, 400]
    const prev = [...steps].reverse().find((s) => s < zoomLevel) || Math.max(25, zoomLevel - 25)
    set({ zoomLevel: prev })
  },

  fitWidth: () => set({ zoomLevel: 100 }),
  fitPage: () => set({ zoomLevel: 75 }),

  togglePageSelect: (pageIndex) => {
    const { selectedPages } = get()
    if (selectedPages.includes(pageIndex)) {
      set({ selectedPages: selectedPages.filter((p) => p !== pageIndex) })
    } else {
      set({ selectedPages: [...selectedPages, pageIndex] })
    }
  },

  selectPageRange: (startIndex, endIndex) => {
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    const range: number[] = []
    for (let i = start; i <= end; i++) range.push(i)
    set({ selectedPages: range })
  },

  clearSelection: () => set({ selectedPages: [] }),

  selectAllPages: () => {
    const { pageCount } = get()
    set({ selectedPages: Array.from({ length: pageCount }, (_, i) => i) })
  },

  setPanMode: (enabled) => set({ panMode: enabled, activeTool: enabled ? 'pan' : 'select' }),
  setActiveTool: (tool) => set({ activeTool: tool, panMode: tool === 'pan' }),
  setHasChanges: (hasChanges) => set({ hasChanges }),

  updatePdfData: (base64, pages) => {
    const prevPages = get().pages
    const normalizedPages: PdfPageInfo[] = pages.map((p, idx) => {
      const existing = prevPages[idx]
      return {
        ...p,
        index: idx,
        id: p.id || existing?.id || `page_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      }
    })

    set({
      pdfBase64: base64,
      pageCount: normalizedPages.length,
      pages: normalizedPages,
      currentPage: Math.min(get().currentPage, Math.max(0, normalizedPages.length - 1)),
      selectedPages: [],
      hasChanges: true
    })

    try {
      useEditorObjectsStore.getState().remapPageIndices(normalizedPages)
    } catch {}
  },

  pushUndo: () => {
    const { pdfBase64, undoStack } = get()
    if (pdfBase64) {
      const newStack = [...undoStack, pdfBase64].slice(-15)
      set({ undoStack: newStack, canUndo: true, redoStack: [], canRedo: false })
    }
  },

  undo: () => {
    const { undoStack, redoStack, pdfBase64 } = get()
    if (undoStack.length === 0) return

    const newUndoStack = [...undoStack]
    const previousBase64 = newUndoStack.pop()!
    const newRedoStack = pdfBase64 ? [...redoStack, pdfBase64] : redoStack
    set({
      pdfBase64: previousBase64,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: newUndoStack.length > 0,
      canRedo: newRedoStack.length > 0,
      hasChanges: true
    })
  },

  redo: () => {
    const { undoStack, redoStack, pdfBase64 } = get()
    if (redoStack.length === 0) return

    const newRedoStack = [...redoStack]
    const nextBase64 = newRedoStack.pop()!
    const newUndoStack = pdfBase64 ? [...undoStack, pdfBase64] : undoStack
    set({
      pdfBase64: nextBase64,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: newUndoStack.length > 0,
      canRedo: newRedoStack.length > 0,
      hasChanges: true
    })
  }
}))
