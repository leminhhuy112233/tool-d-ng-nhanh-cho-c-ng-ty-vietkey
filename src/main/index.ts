/**
 * VietKey DocGen — Main Electron Process Entry Point
 * Khởi tạo ứng dụng, quản lý cửa sổ chính (BrowserWindow) và vòng đời hệ thống
 */

import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initStore } from './services/database'
import { storageManager } from './services/storage-manager'
import { registerAllIpc } from './ipc'

// Tối ưu hóa GPU & tăng tốc đồ họa phần cứng (Hardware Acceleration)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('enable-zero-copy')
app.commandLine.appendSwitch('ignore-gpu-blocklist')
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers')

// Khóa đơn tiến trình (Single Instance Lock) — Ngăn ngừa mở nhiều bản sao gây xung đột
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

let mainWindow: BrowserWindow | null = null

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

// ===== App Lifecycle =====
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.vietkey.docgen')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Khởi tạo Database và Thư mục lưu trữ cục bộ (Local Storage Hub)
  initStore()
  storageManager.initStorageHub()

  // Đăng ký toàn bộ các kênh giao tiếp IPC tập trung
  registerAllIpc(() => mainWindow)

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
