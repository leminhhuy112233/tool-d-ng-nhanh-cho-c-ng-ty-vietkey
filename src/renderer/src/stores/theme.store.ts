import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeStore {
  theme: Theme
  isLoaded: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  loadTheme: () => Promise<void>
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'dark',
  isLoaded: false,

  setTheme: (theme: Theme) => {
    set({ theme })
    // Cập nhật class trên document
    document.documentElement.classList.toggle('dark', theme === 'dark')
    // Lưu vào SQLite qua IPC
    window.api.setTheme(theme)
  },

  toggleTheme: () => {
    const current = get().theme
    const next = current === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },

  loadTheme: async () => {
    try {
      const saved = await window.api.getTheme()
      const theme = (saved === 'light' ? 'light' : 'dark') as Theme
      set({ theme, isLoaded: true })
      document.documentElement.classList.toggle('dark', theme === 'dark')
    } catch {
      // Mặc định dark nếu lỗi
      set({ theme: 'dark', isLoaded: true })
      document.documentElement.classList.add('dark')
    }
  }
}))
