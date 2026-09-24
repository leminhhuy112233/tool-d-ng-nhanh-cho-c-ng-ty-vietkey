import { ipcMain, app } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getSetting, setSetting, getAllSettings } from '../services/database'

export function registerSettingsHandlers(): void {
  // Lấy phiên bản app thực tế
  ipcMain.on('get-app-version-sync', (event) => {
    event.returnValue = app.getVersion()
  })

  // Đọc một setting
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: string) => {
    return getSetting(key)
  })

  // Lưu một setting
  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, key: string, value: string) => {
    setSetting(key, value)
  })

  // Đọc tất cả settings
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    return getAllSettings()
  })

  // Theme shortcuts
  ipcMain.handle(IPC_CHANNELS.THEME_GET, () => {
    return getSetting('theme') ?? 'dark'
  })

  ipcMain.handle(IPC_CHANNELS.THEME_SET, (_event, theme: string) => {
    setSetting('theme', theme)
  })
}
