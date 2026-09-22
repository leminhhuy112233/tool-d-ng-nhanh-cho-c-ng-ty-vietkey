import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type { ElectronAPI, ContractData, QuotationData, AdvanceRequestData } from '../shared/types'

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

  // App info
  getAppVersion: () => '1.0.0'
}

contextBridge.exposeInMainWorld('api', api)
