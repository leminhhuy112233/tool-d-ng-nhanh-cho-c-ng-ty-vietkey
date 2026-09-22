import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initStore, getPartners, savePartner, getHistory, addHistoryRecord, deleteHistoryRecord, clearHistory, getCustomTemplates, getCustomTemplateById, saveCustomTemplate, deleteCustomTemplate } from './services/database'
import { analyzeDocxTemplate } from './services/template-analyzer'
import { registerSettingsHandlers } from './ipc/settings.ipc'
import { registerDocumentHandlers } from './ipc/document.ipc'
import { IPC_CHANNELS } from '../shared/ipc-channels'

let mainWindow: BrowserWindow | null = null
let isMiniMode = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 420,
    minHeight: 600,
    show: true,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    icon: join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ===== Window & Shell Actions IPC =====
function registerWindowHandlers(): void {
  ipcMain.on(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize()
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.close()
  })

  // Mini Window Mode Toggle (Thu gọn góc màn hình)
  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_MINI, () => {
    if (!mainWindow) return false
    isMiniMode = !isMiniMode
    if (isMiniMode) {
      mainWindow.setSize(440, 680)
      mainWindow.setAlwaysOnTop(true, 'floating')
    } else {
      mainWindow.setAlwaysOnTop(false)
      mainWindow.setSize(1280, 800)
    }
    return isMiniMode
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow?.isMaximized() ?? false
  })

  // Shell File & Folder Opening
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN_PATH, async (_event, pathStr: string) => {
    if (pathStr) await shell.openPath(pathStr)
  })

  ipcMain.handle(IPC_CHANNELS.SHELL_SHOW_ITEM_IN_FOLDER, async (_event, pathStr: string) => {
    if (pathStr) shell.showItemInFolder(pathStr)
  })

  // Partner Store Handlers
  ipcMain.handle(IPC_CHANNELS.PARTNER_GET_ALL, () => getPartners())
  ipcMain.handle(IPC_CHANNELS.PARTNER_SAVE, (_event, profile) => savePartner(profile))

  // History Handlers
  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, () => getHistory())
  ipcMain.handle(IPC_CHANNELS.HISTORY_ADD, (_event, record) => addHistoryRecord(record))
  ipcMain.handle(IPC_CHANNELS.HISTORY_DELETE, (_event, id: string) => deleteHistoryRecord(id))
  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => clearHistory())

  // File dialogs
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async (_event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: filters || [{ name: 'All Files', extensions: ['*'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // Template Handlers
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_LIST, async () => {
    let templateDir = join(app.getAppPath(), 'templates')
    if (!existsSync(templateDir)) {
      templateDir = join(process.cwd(), 'templates')
    }
    if (existsSync(templateDir)) {
      await shell.openPath(templateDir)
    }
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_GET, async (_event, fileName: string) => {
    let templateDir = join(app.getAppPath(), 'templates')
    if (!existsSync(templateDir)) {
      templateDir = join(process.cwd(), 'templates')
    }
    const filePath = join(templateDir, fileName)
    if (existsSync(filePath)) {
      await shell.openPath(filePath)
    }
  })

  // Custom Template Handlers
  ipcMain.handle(IPC_CHANNELS.TEMPLATE_ANALYZE, async (_event, filePath: string) => {
    return await analyzeDocxTemplate(filePath)
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_LIST, async () => {
    return getCustomTemplates()
  })

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_GET, async (_event, id: string) => {
    return getCustomTemplateById(id)
  })

  ipcMain.handle(
    IPC_CHANNELS.TEMPLATE_CUSTOM_SAVE,
    async (_event, templateData: any, processedDocxBase64?: string) => {
      try {
        const saved = saveCustomTemplate(templateData, processedDocxBase64)
        return { success: true, template: saved }
      } catch (err: any) {
        console.error('Lỗi lưu custom template:', err)
        return { success: false, error: err.message || 'Lỗi không xác định khi lưu mẫu tùy biến.' }
      }
    }
  )

  ipcMain.handle(IPC_CHANNELS.TEMPLATE_CUSTOM_DELETE, async (_event, id: string) => {
    try {
      const ok = deleteCustomTemplate(id)
      return { success: ok }
    } catch (err: any) {
      console.error('Lỗi xóa custom template:', err)
      return { success: false, error: err.message || 'Lỗi không xác định khi xóa mẫu.' }
    }
  })
}

// ===== App Lifecycle =====
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.vietkey.docgen')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initStore()

  registerWindowHandlers()
  registerSettingsHandlers()
  registerDocumentHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
