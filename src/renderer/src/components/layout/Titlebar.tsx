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
