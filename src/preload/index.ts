import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { ElectronAPI, ContractData, QuotationData, AdvanceRequestData, CustomTemplateDef, ExportFileType, PdfAnnotationData, PdfSplitRange, PdfWatermarkOptions } from '../shared/types'

const api: ElectronAPI = {
  // Settings
  getSetting: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
  setSetting: (key: string, value: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
  getAllSettings: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),

  // Theme
  getTheme: () => ipcRenderer.invoke(IPC_CHANNELS.THEME_GET),
  setTheme: (theme: string) => ipcRenderer.invoke(IPC_CHANNELS.THEME_SET, theme),

  // Window controls
  minimizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE),
  toggleMiniMode: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_TOGGLE_MINI),
  isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),

  // File & Folder opening
  openPath: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN_PATH, path),
  showItemInFolder: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, path),

  // File dialogs
  openFileDialog: (filters) => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE, filters),
  openDirectoryDialog: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),
  saveFileDialog: (defaultName, filters) =>
    ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, defaultName, filters),

  // Partner Memory Store
  getPartners: () => ipcRenderer.invoke(IPC_CHANNELS.PARTNER_GET_ALL),
  savePartner: (profile) => ipcRenderer.invoke(IPC_CHANNELS.PARTNER_SAVE, profile),

  // Export History
  getHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET_ALL),
  addHistoryRecord: (record) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_ADD, record),
  deleteHistoryRecord: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_DELETE, id),
  clearHistory: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),

  // Document Exports
  exportContract: (data: ContractData, targetPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_EXPORT_CONTRACT, data, targetPath),

  exportQuotation: (data: QuotationData, targetPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_EXPORT_QUOTATION, data, targetPath),

  exportAdvanceRequest: (data: AdvanceRequestData, targetPath: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_EXPORT_ADVANCE_REQUEST, data, targetPath),

  // AI Assistant Parsing
  parseTextWithAI: (rawText: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_PARSE_AI, rawText),

  parseQuotationTextWithAI: (rawText: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_PARSE_QUOTATION_AI, rawText),

  parseAdvanceRequestWithAI: (rawText: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_PARSE_ADVANCE_REQUEST_AI, rawText),

  // Template management
  openTemplatesFolder: () => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_LIST),
  openTemplateFile: (fileName: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_GET, fileName),

  // Custom Dynamic Template Management
  analyzeTemplate: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_ANALYZE, filePath),
  getCustomTemplates: () => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_CUSTOM_LIST),
  saveCustomTemplate: (
    template: Omit<CustomTemplateDef, 'id' | 'createdAt' | 'updatedAt'>,
    processedDocxBase64?: string
  ) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_CUSTOM_SAVE, template, processedDocxBase64),
  deleteCustomTemplate: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_CUSTOM_DELETE, id),
  getCustomTemplateById: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_CUSTOM_GET, id),
  updateCustomTemplate: (
    id: string,
    templateData: Partial<CustomTemplateDef>,
    processedDocxBase64?: string,
    changeNote?: string
  ) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_CUSTOM_UPDATE, id, templateData, processedDocxBase64, changeNote),
  getTemplateVersions: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_CUSTOM_VERSIONS, id),
  rollbackCustomTemplateVersion: (id: string, targetVersion: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.TEMPLATE_CUSTOM_ROLLBACK, id, targetVersion),
  exportCustomDocument: (
    templateId: string,
    data: Record<string, any>,
    targetPath: string,
    exportType?: ExportFileType
  ) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_EXPORT_CUSTOM, templateId, data, targetPath, exportType),
  renderPreviewDocx: (
    type: 'quotation' | 'contract' | 'advance' | 'custom',
    data: any,
    customTemplateId?: string
  ) => ipcRenderer.invoke(IPC_CHANNELS.DOCUMENT_RENDER_PREVIEW_DOCX, type, data, customTemplateId),

  // App info
  getAppVersion: () => {
    try {
      return ipcRenderer.sendSync('get-app-version-sync') || '1.0.0'
    } catch {
      return '1.0.0'
    }
  },

  // PDF Tools
  pdfOpenFile: () => ipcRenderer.invoke(IPC_CHANNELS.PDF_OPEN_FILE),
  pdfReadFile: (filePath: string) => ipcRenderer.invoke(IPC_CHANNELS.PDF_READ_FILE, filePath),
  pdfSaveFile: (pdfBase64: string, suggestedName?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_SAVE_FILE, pdfBase64, suggestedName),
  pdfDeletePages: (pdfBase64: string, pageIndices: number[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_DELETE_PAGES, pdfBase64, pageIndices),
  pdfRotatePages: (pdfBase64: string, pageIndices: number[], angleDegrees: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_ROTATE_PAGES, pdfBase64, pageIndices, angleDegrees),
  pdfReorderPages: (pdfBase64: string, newOrder: number[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_REORDER_PAGES, pdfBase64, newOrder),
  pdfDuplicatePages: (pdfBase64: string, pageIndices: number[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_DUPLICATE_PAGES, pdfBase64, pageIndices),
  pdfExtractPages: (pdfBase64: string, pageIndices: number[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_EXTRACT_PAGES, pdfBase64, pageIndices),
  pdfSplit: (pdfBase64: string, ranges: PdfSplitRange[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_SPLIT, pdfBase64, ranges),
  pdfMerge: () => ipcRenderer.invoke(IPC_CHANNELS.PDF_MERGE),
  pdfFlattenAnnotations: (pdfBase64: string, annotations: PdfAnnotationData[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_FLATTEN_ANNOTATIONS, pdfBase64, annotations),
  pdfAddWatermark: (pdfBase64: string, options: PdfWatermarkOptions) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_ADD_WATERMARK, pdfBase64, options),
  pdfImagesToPdf: (images: { base64: string; type?: 'png' | 'jpg' }[]) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_IMAGES_TO_PDF, images),
  pdfAddBlankPage: (pdfBase64: string, position: 'before' | 'after' | 'end', targetIndex: number) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_ADD_BLANK_PAGE, pdfBase64, position, targetIndex),
  pdfImportPages: (
    targetBase64: string,
    sourceBytesArr: number[],
    position: 'before' | 'after' | 'end',
    targetIndex: number,
    pageIndices?: number[]
  ) =>
    ipcRenderer.invoke(
      IPC_CHANNELS.PDF_IMPORT_PAGES,
      targetBase64,
      sourceBytesArr,
      position,
      targetIndex,
      pageIndices
    ),
  pdfCompress: (pdfBase64: string, level: 'low' | 'medium' | 'high') =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_COMPRESS, pdfBase64, level),
  pdfUpdateMetadata: (pdfBase64: string, metadata: any) =>
    ipcRenderer.invoke(IPC_CHANNELS.PDF_UPDATE_METADATA, pdfBase64, metadata),

  // Local Storage Hub & Data Protection Layer
  storageGetInfo: () => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_GET_INFO),
  storageSetPath: (newPath: string) => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_SET_PATH, newPath),
  storageOpenExplorer: (subfolder?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_OPEN_EXPLORER, subfolder),
  storageCreateBackup: () => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_CREATE_BACKUP),
  storageCleanupTemp: () => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_CLEANUP_TEMP),
  storageGetHealth: () => ipcRenderer.invoke(IPC_CHANNELS.STORAGE_GET_HEALTH),
  storageRestoreBackup: (backupPath?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_RESTORE_BACKUP, backupPath),
  storageExportBackup: (targetDir?: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.STORAGE_EXPORT_BACKUP, targetDir)
}

contextBridge.exposeInMainWorld('api', api)

