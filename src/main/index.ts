/**
 * VietKey DocGen — Main Electron Process Entry Point
 * Khởi tạo ứng dụng, quản lý cửa sổ chính (BrowserWindow) và vòng đời hệ thống
 * Tích hợp lá chắn an toàn (Crash Shield) & Ghi nhật ký thực thi (Execution Logger)
 */

import { app, shell, BrowserWindow, dialog } from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync, appendFileSync, mkdirSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initStore } from './services/database'
import { storageManager } from './services/storage-manager'
import { registerAllIpc } from './ipc'

// ===== Hệ thống Ghi nhật ký (File Logger & Crash Shield) =====
function logApp(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any): void {
  const timestamp = new Date().toISOString()
  const logLine = `[${timestamp}] [${level}] ${message} ${data ? JSON.stringify(data) : ''}\n`
  console.log(logLine.trim())

  try {
    const tempDir = join(homedir(), 'VietKey_Data', 'Temp')
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true })
    const logPath = join(tempDir, 'main-process.log')
    appendFileSync(logPath, logLine, 'utf-8')
  } catch (err) {
    console.error('Failed to write main-process.log:', err)
  }
}

// Bắt toàn bộ lỗi ngoại lệ chưa xử lý để ứng dụng không bị crash âm thầm
process.on('uncaughtException', (error) => {
  logApp('ERROR', 'Uncaught Exception in Main Process:', {
    message: error?.message,
    stack: error?.stack
  })

  // Nếu cửa sổ chưa mở, hiển thị thông báo lỗi trực quan cho người dùng
  if (!mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox(
      'VietKey DocGen — Sự cố khởi chạy',
      `Ứng dụng phát hiện lỗi trong quá trình khởi động:\n\n${error?.message || error}\n\nNhật ký chi tiết đã được lưu tại:\nC:\\Users\\<Username>\\VietKey_Data\\Temp\\main-process.log`
    )
  }
})

process.on('unhandledRejection', (reason: any) => {
  logApp('WARN', 'Unhandled Promise Rejection:', {
    reason: reason?.message || String(reason),
    stack: reason?.stack
  })
})

// Khóa đơn tiến trình (Single Instance Lock) — Ngăn ngừa mở nhiều bản sao gây xung đột
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  logApp('WARN', 'Second instance detected. Quitting duplicate process.')
  app.quit()
} else {
  app.on('second-instance', () => {
    logApp('INFO', 'Second instance triggered. Focusing main window.')
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

let mainWindow: BrowserWindow | null = null

function resolveAppIcon(): string | undefined {
  const candidates = [
    join(process.resourcesPath, 'build', 'icon.png'),
    join(process.resourcesPath, 'icon.png'),
    join(app.getAppPath(), 'build', 'icon.png'),
    join(__dirname, '../../build/icon.png')
  ]
  return candidates.find((p) => existsSync(p))
}

function createWindow(): void {
  logApp('INFO', 'Creating main BrowserWindow...')

  const iconPath = resolveAppIcon()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 420,
    minHeight: 600,
    show: false, // Giữ ẩn cho đến khi giao diện render xong để chống giật trắng
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0f',
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Hiển thị cửa sổ mượt mà khi đã sẵn sàng
  mainWindow.on('ready-to-show', () => {
    logApp('INFO', 'Main window ready-to-show. Displaying window.')
    mainWindow?.show()
    mainWindow?.focus()
  })

  // Fallback an toàn: nếu sau 3.5s sự kiện ready-to-show chưa kích hoạt, buộc hiển thị cửa sổ
  const fallbackShowTimer = setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      logApp('WARN', 'ready-to-show timeout fallback -> Force showing window.')
      mainWindow.show()
      mainWindow.focus()
    }
  }, 3500)

  mainWindow.on('closed', () => {
    clearTimeout(fallbackShowTimer)
    mainWindow = null
  })

  // ===== Lá Chắn Chống Treo Ứng Dụng (Anti-Freeze & Unresponsive Watchdog) =====
  mainWindow.on('unresponsive', () => {
    logApp('WARN', 'Window unresponsive detected. Showing force-quit dialog.')
    if (mainWindow && !mainWindow.isDestroyed()) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['Chờ ứng dụng phản hồi', 'Buộc tắt ứng dụng ngay'],
        defaultId: 1,
        cancelId: 0,
        title: 'VietKey DocGen — Ứng dụng không phản hồi',
        message: 'Giao diện ứng dụng đang bị treo hoặc đang xử lý tác vụ nặng.\n\nBạn có muốn buộc tắt ứng dụng ngay không?'
      })
      if (choice === 1) {
        logApp('INFO', 'User chose to force quit unresponsive window.')
        mainWindow.destroy()
        app.exit(0)
      }
    }
  })

  mainWindow.on('responsive', () => {
    logApp('INFO', 'Window has become responsive again.')
  })

  // ===== Phím Tắt Khẩn Cấp Ở Tầng Hệ Điều Hành (Emergency OS Kill Switches) =====
  // Vì giao diện frameless ẩn thanh tiêu đề Windows, cơ chế này đảm bảo người dùng
  // LUÔN LUÔN có thể bấm Alt+F4 hoặc Ctrl+Q để đóng ngay lập tức kể cả khi trang web bị đơ.
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // 1. Alt + F4 hoặc Ctrl + Q: Đóng khẩn cấp không cần qua UI
    if ((input.alt && input.key === 'F4') || (input.control && input.key.toLowerCase() === 'q')) {
      event.preventDefault()
      logApp('INFO', `Emergency key shortcut triggered (${input.key}) -> Forcing application exit.`)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.destroy()
      }
      app.exit(0)
    }

    // 2. F5 hoặc Ctrl + Shift + R: Tải lại giao diện khẩn cấp nếu gặp sự cố hiển thị
    if (input.key === 'F5' || (input.control && input.shift && input.key.toLowerCase() === 'r')) {
      logApp('INFO', 'Emergency reload triggered.')
      mainWindow?.reload()
    }
  })

  // Giám sát sự cố sụp đổ giao diện (Renderer Crash Watcher)
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logApp('ERROR', 'Renderer process gone (Crash detected):', details)
    if (details.reason !== 'clean-exit') {
      const choice = dialog.showMessageBoxSync({
        type: 'error',
        buttons: ['Khởi động lại giao diện', 'Thoát ứng dụng'],
        defaultId: 0,
        title: 'VietKey DocGen — Sự cố tiến trình giao diện',
        message: `Tiến trình đồ họa bị gián đoạn (${details.reason}).\n\nBạn có muốn khởi động lại giao diện không?`
      })
      if (choice === 0) {
        mainWindow?.reload()
      } else {
        mainWindow?.destroy()
        app.exit(0)
      }
    }
  })

  // Xử lý khi tải trang thất bại (Did-Fail-Load Watcher)
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    logApp('ERROR', 'Renderer failed to load:', { errorCode, errorDescription, validatedURL })
    if (errorCode !== -3) { // Bỏ qua ERR_ABORTED
      const choice = dialog.showMessageBoxSync({
        type: 'error',
        buttons: ['Thử tải lại', 'Đóng ứng dụng'],
        defaultId: 0,
        title: 'VietKey DocGen — Lỗi nạp giao diện',
        message: `Không thể nạp trang giao diện (Lỗi ${errorCode}: ${errorDescription}).\n\nBạn muốn thử lại không?`
      })
      if (choice === 0) {
        mainWindow?.reload()
      } else {
        mainWindow?.destroy()
        app.exit(0)
      }
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    logApp('INFO', `Connecting to Dev Server: ${process.env['ELECTRON_RENDERER_URL']}`)
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const indexPath = join(__dirname, '../renderer/index.html')
    logApp('INFO', `Loading production bundle: ${indexPath}`)
    mainWindow.loadFile(indexPath)
  }
}

// ===== Vòng đời ứng dụng (App Lifecycle) =====
app.whenReady().then(async () => {
  logApp('INFO', 'Electron App Ready. Initializing main process...')
  electronApp.setAppUserModelId('com.vietkey.docgen')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  try {
    // 1. Khởi tạo Thư mục lưu trữ cục bộ (Data Protection Layer: 8 folders)
    storageManager.initStorageHub()

    // 2. Khởi tạo Database và Migration
    await initStore()

    // 3. Đăng ký toàn bộ các kênh giao tiếp IPC tập trung
    registerAllIpc(() => mainWindow)

    // 4. Tạo cửa sổ chính
    createWindow()
  } catch (initErr: any) {
    logApp('ERROR', 'Critical initialization error in app.whenReady:', initErr)
    dialog.showErrorBox(
      'VietKey DocGen — Lỗi khởi tạo',
      `Không thể hoàn tất các bước khởi tạo ứng dụng:\n\n${initErr?.message || initErr}`
    )
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  logApp('INFO', 'All windows closed. Exiting application.')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  logApp('INFO', 'Application preparing to quit. Cleaning up child processes.')
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy()
  }
})

