import { useState, useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { useThemeStore } from '../stores/theme.store'
import { Moon, Sun, FolderOpen, Key, Info, Zap, HardDrive, ShieldCheck, RefreshCw, Trash2, ExternalLink, Database, CheckCircle2 } from 'lucide-react'
import type { StorageHubInfo } from '../../../shared/types'

export function Settings() {
  const { theme, setTheme } = useThemeStore()
  const [apiKey, setApiKey] = useState('')
  const [exportDir, setExportDir] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const [toastMessage, setToastMessage] = useState('✓ Đã lưu cài đặt')

  // VietKey Local Data Hub state
  const [storageInfo, setStorageInfo] = useState<StorageHubInfo | null>(null)
  const [backingUp, setBackingUp] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  // Load settings & storage hub info khi mount
  const loadStorageInfo = async () => {
    try {
      if (window.api?.storageGetInfo) {
        const info = await window.api.storageGetInfo()
        setStorageInfo(info)
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin kho lưu trữ:', err)
    }
  }

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
    loadStorageInfo()
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

  const showToast = (msg?: string) => {
    if (msg) setToastMessage(msg)
    else setToastMessage('✓ Đã lưu cài đặt')
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2500)
  }

  // Mở thư mục Data Hub trong Explorer
  const handleOpenDataHub = async (subfolder?: string) => {
    if (window.api?.storageOpenExplorer) {
      await window.api.storageOpenExplorer(subfolder)
    }
  }

  // Đổi thư mục lưu trữ Data Hub trên PC
  const handleChangeDataHubPath = async () => {
    try {
      const dir = await window.api.openDirectoryDialog()
      if (dir && window.api?.storageSetPath) {
        const res = await window.api.storageSetPath(dir)
        if (res.success) {
          showToast(`✓ Đã đổi vị trí lưu trữ sang: ${dir}`)
          await loadStorageInfo()
        } else {
          showToast(`⚠️ Không thể đổi: ${res.error}`)
        }
      }
    } catch (err: any) {
      showToast(`⚠️ Lỗi: ${err.message}`)
    }
  }

  // 1-Click Sao lưu dự phòng
  const handleCreateBackup = async () => {
    if (!window.api?.storageCreateBackup) return
    setBackingUp(true)
    try {
      const res = await window.api.storageCreateBackup()
      if (res.success) {
        showToast('✓ Đã tạo bản sao lưu dữ liệu thành công!')
        await loadStorageInfo()
      } else {
        showToast(`⚠️ Sao lưu thất bại: ${res.error}`)
      }
    } catch (err: any) {
      showToast(`⚠️ Lỗi: ${err.message}`)
    } finally {
      setBackingUp(false)
    }
  }

  // Dọn dẹp cache & giải phóng bộ nhớ
  const handleCleanupTemp = async () => {
    if (!window.api?.storageCleanupTemp) return
    setCleaning(true)
    try {
      const res = await window.api.storageCleanupTemp()
      if (res.success) {
        showToast(`✓ Đã dọn dẹp bộ nhớ đệm! Giải phóng: ${res.freedBytesFormatted || '0 B'}`)
        await loadStorageInfo()
      }
    } catch (err: any) {
      showToast(`⚠️ Lỗi: ${err.message}`)
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div>
      <PageHeader title="Cài đặt" description="Cấu hình ứng dụng, kho lưu trữ cục bộ và tùy chỉnh giao diện" />

      {/* Kho Lưu Trữ Dữ Liệu Cục Bộ (VietKey Local Data Hub) */}
      <div className="settings-section" style={{ border: '1px solid rgba(14, 165, 233, 0.25)', background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.04) 0%, transparent 100%)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--foreground)', fontSize: '16px' }}>
              <HardDrive size={18} color="#0ea5e9" />
              Kho Lưu Trữ Dữ Liệu PC (VietKey Local Data Hub)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Toàn bộ dữ liệu được lưu minh bạch trên ổ đĩa PC của bạn — Không lưu ẩn trong Cache hệ thống
            </p>
          </div>
          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} />
            Đã đồng bộ Cục bộ
          </span>
        </div>

        {/* Đường dẫn chính */}
        <div style={{ background: 'var(--muted)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Database size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--foreground)', wordBreak: 'break-all' }}>
              {storageInfo?.dataHubPath || 'Đang tải thông tin...'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => handleOpenDataHub()}
              style={{
                padding: '6px 12px',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.15s'
              }}
              title="Mở thư mục trong Windows Explorer"
            >
              <ExternalLink size={13} />
              Mở trên PC
            </button>
            <button
              onClick={handleChangeDataHubPath}
              style={{
                padding: '6px 12px',
                background: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              title="Chọn thư mục khác trên ổ đĩa"
            >
              Đổi vị trí...
            </button>
          </div>
        </div>

        {/* Cây thư mục con */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <div
            onClick={() => handleOpenDataHub('database')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Database/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>vietkey_database.json</span>
          </div>

          <div
            onClick={() => handleOpenDataHub('documents')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Documents/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{storageInfo?.documentCount ?? 0} tài liệu đã xuất</span>
          </div>

          <div
            onClick={() => handleOpenDataHub('templates')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Templates/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Mẫu tài liệu Word</span>
          </div>

          <div
            onClick={() => handleOpenDataHub('backups')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Backups/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{storageInfo?.backupCount ?? 0} bản sao lưu</span>
          </div>
        </div>

        {/* Thanh công cụ bảo trì & Tối ưu hóa */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            <span>Tổng dung lượng: <strong style={{ color: 'var(--foreground)' }}>{storageInfo?.totalSizeFormatted || '0 B'}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateBackup}
              disabled={backingUp}
              style={{
                padding: '7px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: backingUp ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <ShieldCheck size={14} />
              {backingUp ? 'Đang sao lưu...' : 'Sao Lưu Dự Phòng (1-Click)'}
            </button>

            <button
              onClick={handleCleanupTemp}
              disabled={cleaning}
              style={{
                padding: '7px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: cleaning ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Trash2 size={14} />
              {cleaning ? 'Đang dọn...' : 'Dọn Dẹp Cache & File Tạm'}
            </button>
          </div>
        </div>
      </div>

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
        <div className="toast">{toastMessage}</div>
      )}
    </div>
  )
}
