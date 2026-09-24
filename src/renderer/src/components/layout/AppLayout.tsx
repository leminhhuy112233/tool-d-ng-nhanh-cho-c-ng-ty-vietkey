import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Titlebar } from './Titlebar'
import { Sidebar } from './Sidebar'
import { CommandPalette } from '../common/CommandPalette'

export function AppLayout() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  // Global Shortcut: Ctrl+K / Cmd+K and custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }
    const handleOpenPalette = () => setIsCommandPaletteOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('open-command-palette', handleOpenPalette)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('open-command-palette', handleOpenPalette)
    }
  }, [])

  return (
    <>
      <Titlebar />
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  )
}
