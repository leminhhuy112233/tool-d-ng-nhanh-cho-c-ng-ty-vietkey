import { useState, useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { useThemeStore } from '../stores/theme.store'
import { Moon, Sun, FolderOpen, Key, Info, Zap } from 'lucide-react'

export function Settings() {
  const { theme, setTheme } = useThemeStore()
  const [apiKey, setApiKey] = useState('')
  const [exportDir, setExportDir] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  // Load settings từ SQLite khi mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.api.getAllSettings()
        if (settings.openaiApiKey) setApiKey(settings.openaiApiKey)
        if (settings.defaultExportDir) setExportDir(settings.defaultExportDir)
      } catch (err) {
        console.error('Lỗi khi tải cài đặt:', err)
      }
    }
    loadSettings()
  }, [])

  // Lưu API Key
  const handleSaveApiKey = async () => {
    await window.api.setSetting('openaiApiKey', apiKey)
    showToast()
  }

  // Chọn thư mục xuất file
  const handleSelectDir = async () => {
    const dir = await window.api.openDirectoryDialog()
    if (dir) {
      setExportDir(dir)
      await window.api.setSetting('defaultExportDir', dir)
      showToast()
    }
  }

  const showToast = () => {
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Cài đặt" description="Cấu hình ứng dụng và tùy chỉnh giao diện" />

      {/* Theme */}
      <div className="settings-section">
        <h3>Giao diện</h3>
        <p>Chọn chế độ hiển thị phù hợp với bạn</p>

        <div className="setting-row">
          <div className="setting-label">
            <span>Chế độ màu</span>
            <span>Chuyển đổi giữa giao diện sáng và tối</span>
          </div>
          <div className="theme-toggle">
            <button
              className={`theme-toggle-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sun size={14} />
                Sáng
              </span>
            </button>
            <button
              className={`theme-toggle-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Moon size={14} />
                Tối
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* OpenAI API Key */}
      <div className="settings-section">
        <h3>AI Assistant</h3>
        <p>Cấu hình OpenAI API để sử dụng tính năng AI phân tích văn bản</p>

        <div className="setting-row">
          <div className="setting-label">
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} />
                API Key
              </span>
            </span>
            <span>Nhập OpenAI API Key của bạn (lưu cục bộ, không gửi đi đâu)</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              className="setting-input"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: '260px' }}
            />
            <button
              onClick={handleSaveApiKey}
              style={{
                padding: '8px 16px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'opacity 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Lưu
            </button>
          </div>
        </div>
      </div>

      {/* Thư mục xuất file */}
      <div className="settings-section">
        <h3>Xuất file</h3>
        <p>Cấu hình thư mục mặc định để lưu tài liệu Word sau khi xuất</p>

        <div className="setting-row">
          <div className="setting-label">
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderOpen size={14} />
                Thư mục mặc định
              </span>
            </span>
            <span>Tài liệu sẽ được lưu vào thư mục này sau khi xuất</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              className="setting-input"
              placeholder="Chọn thư mục..."
              value={exportDir}
              readOnly
              style={{ width: '260px', cursor: 'pointer' }}
              onClick={handleSelectDir}
            />
            <button
              onClick={handleSelectDir}
              style={{
                padding: '8px 16px',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.15s ease'
              }}
            >
              Chọn
            </button>
          </div>
        </div>
      </div>

      {/* Thông tin */}
      <div className="settings-section">
        <h3>Thông tin</h3>
        <p>Thông tin về phiên bản ứng dụng</p>

        <div className="setting-row">
          <div className="setting-label">
            <span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} />
                Phiên bản
              </span>
            </span>
            <span>VietKey AI Document Generator</span>
          </div>
          <div className="version-badge">
            <Zap size={12} />
            v1.0.0
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {showSaved && (
        <div className="toast">✓ Đã lưu cài đặt</div>
      )}
    </div>
  )
}
