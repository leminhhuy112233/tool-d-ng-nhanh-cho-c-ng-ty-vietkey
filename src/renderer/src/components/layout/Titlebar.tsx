import { useState } from 'react'
import { Minus, Square, X, Minimize2, Maximize2, Zap } from 'lucide-react'

export function Titlebar() {
  const [isMini, setIsMini] = useState(false)

  const handleMinimize = () => {
    window.api?.minimizeWindow()
  }

  const handleMaximize = () => {
    window.api?.maximizeWindow()
  }

  const handleClose = () => {
    window.api?.closeWindow()
  }

  const handleToggleMini = async () => {
    if (window.api?.toggleMiniMode) {
      const state = await window.api.toggleMiniMode()
      setIsMini(state)
    }
  }

  return (
    <div className="titlebar">
      {/* Left Branding Logo & Tag */}
      <div className="titlebar-branding">
        <div className="titlebar-logo-icon">
          <Zap size={14} color="#06b6d4" />
        </div>
        <span className="titlebar-appName">VietKey DocGen</span>
        <span className="titlebar-versionBadge">{isMini ? 'MINI MODE' : 'PRO'}</span>
      </div>

      {/* Center Quick Command Palette Trigger */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 14px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--muted-foreground)',
          fontSize: '11.5px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          // @ts-ignore — Electron-specific CSS property for drag region
          WebkitAppRegion: 'no-drag'
        } as React.CSSProperties}
        title="Mở thanh tìm kiếm & lệnh nhanh (Ctrl + K)"
      >
        <span>Tìm lệnh, tài liệu, đối tác...</span>
        <kbd
          style={{
            fontSize: '10px',
            background: 'var(--muted)',
            padding: '1px 5px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            fontWeight: 600
          }}
        >
          Ctrl + K
        </kbd>
      </button>

      {/* Right Control Action Buttons */}
      <div className="titlebar-controls">
        {/* Toggle Mini Mode Button */}
        <button
          className={`titlebar-btn ${isMini ? 'active-mini' : ''}`}
          onClick={handleToggleMini}
          title={isMini ? 'Mở rộng cửa sổ chính' : 'Thu gọn Mini Mode góc màn hình (Alt+M)'}
        >
          {isMini ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
        </button>

        {/* Minimize Button */}
        <button className="titlebar-btn" onClick={handleMinimize} title="Thu nhỏ cửa sổ">
          <Minus size={16} />
        </button>

        {/* Maximize / Restore Button */}
        <button className="titlebar-btn" onClick={handleMaximize} title="Phóng to / Khôi phục">
          <Square size={13} />
        </button>

        {/* Close Button */}
        <button className="titlebar-btn close" onClick={handleClose} title="Đóng ứng dụng">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
