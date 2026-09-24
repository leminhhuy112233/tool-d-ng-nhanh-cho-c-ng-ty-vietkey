import { useState, useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import { useThemeStore } from '../stores/theme.store'
import {
  Moon,
  Sun,
  FolderOpen,
  Key,
  Info,
  Zap,
  HardDrive,
  ShieldCheck,
  RefreshCw,
  Trash2,
  ExternalLink,
  Database,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Shield,
  Activity,
  FileText
} from 'lucide-react'
import type { StorageHubInfo, DataHealthReport } from '../../../shared/types'

export function Settings() {
  const { theme, setTheme } = useThemeStore()
  const [apiKey, setApiKey] = useState('')
  const [exportDir, setExportDir] = useState('')
  const [showSaved, setShowSaved] = useState(false)
  const [toastMessage, setToastMessage] = useState('✓ Đã lưu cài đặt')

  // VietKey Local Data Hub & Data Protection state
  const [storageInfo, setStorageInfo] = useState<StorageHubInfo | null>(null)
  const [healthReport, setHealthReport] = useState<DataHealthReport | null>(null)
  const [backingUp, setBackingUp] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  // Load settings, storage hub info & health report khi mount
  const loadStorageInfo = async () => {
    try {
      if (window.api?.storageGetInfo) {
        const info = await window.api.storageGetInfo()
        setStorageInfo(info)
      }
      if (window.api?.storageGetHealth) {
        const health = await window.api.storageGetHealth()
        setHealthReport(health)
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin kho lưu trữ:', err)
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await window.api?.getAllSettings()
        if (settings?.openaiApiKey) setApiKey(settings.openaiApiKey)
        if (settings?.defaultExportDir) setExportDir(settings.defaultExportDir)
      } catch (err) {
        console.error('Lỗi khi tải cài đặt:', err)
      }
    }
    loadSettings()
    loadStorageInfo()
  }, [])

  // Lưu API Key
  const handleSaveApiKey = async () => {
    await window.api?.setSetting('openaiApiKey', apiKey)
    showToast()
  }

  // Chọn thư mục xuất file
  const handleSelectDir = async () => {
    const dir = await window.api?.openDirectoryDialog()
    if (dir) {
      setExportDir(dir)
      await window.api?.setSetting('defaultExportDir', dir)
      showToast()
    }
  }

  const showToast = (msg?: string) => {
    if (msg) setToastMessage(msg)
    else setToastMessage('✓ Đã lưu cài đặt')
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2800)
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
      const dir = await window.api?.openDirectoryDialog()
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
        showToast('✓ Đã tạo bản sao lưu dữ liệu (.vkbak) an toàn!')
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

  // Khôi phục dữ liệu từ bản sao lưu
  const handleRestoreBackup = async () => {
    if (!window.api?.storageRestoreBackup) return
    try {
      // Cho phép người dùng chọn file backup
      const files = await window.api?.openFileDialog([
        { name: 'Bản sao lưu VietKey (*.vkbak, *.json)', extensions: ['vkbak', 'json'] }
      ])
      if (!files || files.length === 0) return

      const chosenFile = files[0]
      const confirmed = window.confirm(
        `Bạn có chắc chắn muốn khôi phục dữ liệu từ tệp sau?\n\n${chosenFile}\n\nLưu ý: Hệ thống sẽ tự động chụp một bản snapshot bảo vệ dữ liệu hiện tại trước khi khôi phục.`
      )
      if (!confirmed) return

      setRestoring(true)
      const res = await window.api.storageRestoreBackup(chosenFile)
      if (res.success) {
        showToast(`✓ Khôi phục thành công! Đã nạp lại ${res.restoredRecords || 0} bản ghi dữ liệu.`)
        await loadStorageInfo()
      } else {
        showToast(`⚠️ Khôi phục thất bại: ${res.error}`)
      }
    } catch (err: any) {
      showToast(`⚠️ Lỗi: ${err.message}`)
    } finally {
      setRestoring(false)
    }
  }

  // Xuất file backup ra USB / Desktop
  const handleExportBackup = async () => {
    if (!window.api?.storageExportBackup) return
    setExporting(true)
    try {
      const targetDir = await window.api?.openDirectoryDialog()
      const res = await window.api.storageExportBackup(targetDir || undefined)
      if (res.success) {
        showToast(`✓ Đã xuất tệp sao lưu ra: ${res.exportPath}`)
      } else {
        showToast(`⚠️ Xuất bản sao lưu thất bại: ${res.error}`)
      }
    } catch (err: any) {
      showToast(`⚠️ Lỗi: ${err.message}`)
    } finally {
      setExporting(false)
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

  // Phiên bản ứng dụng & kiểm tra cập nhật
  const appVersion = window.api?.getAppVersion?.() || '1.0.0'
  const handleCheckUpdate = () => {
    showToast(`✓ Bạn đang sử dụng bản v${appVersion}. Kiến trúc cách ly dữ liệu độc lập (Data Isolation) bảo vệ toàn vẹn dữ liệu PC.`)
  }

  return (
    <div>
      <PageHeader title="Cài đặt" description="Cấu hình ứng dụng, hệ thống bảo vệ dữ liệu và tùy chỉnh giao diện" />

      {/* Kho Lưu Trữ Dữ Liệu Cục Bộ (VietKey Local Data Hub & Data Protection Layer) */}
      <div className="settings-section" style={{ border: '1px solid rgba(14, 165, 233, 0.3)', background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.05) 0%, transparent 100%)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--foreground)', fontSize: '16px' }}>
              <ShieldCheck size={20} color="#0ea5e9" />
              Hệ Thống Bảo Vệ Dữ Liệu (VietKey Data Protection Layer)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted-foreground)' }}>
              Kiến trúc cách ly dữ liệu độc lập — Mã nguồn ứng dụng và Dữ liệu khách hàng được tách biệt hoàn toàn
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={12} />
              Schema v{storageInfo?.schemaVersion || 1}
            </span>
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: healthReport?.status === 'healthy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: healthReport?.status === 'healthy' ? '#10b981' : '#f59e0b',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Activity size={12} />
              {healthReport?.status === 'healthy' ? 'Dữ liệu Lành mạnh' : 'Cần kiểm tra'}
            </span>
          </div>
        </div>

        {/* Đường dẫn chính */}
        <div style={{ background: 'var(--muted)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <Database size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--foreground)', wordBreak: 'break-all' }}>
              {storageInfo?.dataHubPath || 'Đang tải vị trí lưu trữ...'}
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
              title="Mở thư mục gốc trong Windows Explorer"
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

        {/* 8 Thư Mục Thành Phần Của Data Protection Layer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
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
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{healthReport?.database?.partnerCount ?? 0} đối tác đã lưu</span>
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
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Mẫu tài liệu người dùng</span>
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

          <div
            onClick={() => handleOpenDataHub('cache')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Cache/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Thumbnail & Render</span>
          </div>

          <div
            onClick={() => handleOpenDataHub('temp')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Temp/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Log thực thi hệ thống</span>
          </div>

          <div
            onClick={() => handleOpenDataHub('recovery')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Recovery/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Khôi phục & Autosave</span>
          </div>

          <div
            onClick={() => handleOpenDataHub('metadata')}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0ea5e9')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>📁 Metadata/</span>
              <ExternalLink size={12} color="var(--muted-foreground)" />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Lịch sử Migration</span>
          </div>
        </div>

        {/* Thanh công cụ bảo trì & Tối ưu hóa */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--muted-foreground)', flexWrap: 'wrap' }}>
            <span>Tổng dung lượng: <strong style={{ color: 'var(--foreground)' }}>{storageInfo?.totalSizeFormatted || '0 B'}</strong></span>
            {healthReport?.backup?.latestBackupDate && (
              <span>Bản sao lưu gần nhất: <strong style={{ color: 'var(--foreground)' }}>{healthReport.backup.latestBackupDate}</strong></span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCreateBackup}
              disabled={backingUp}
              style={{
                padding: '7px 12px',
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
              onClick={handleRestoreBackup}
              disabled={restoring}
              style={{
                padding: '7px 12px',
                background: 'rgba(56, 189, 248, 0.1)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: restoring ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              title="Khôi phục cơ sở dữ liệu từ tệp .vkbak hoặc .json"
            >
              <Upload size={14} />
              {restoring ? 'Đang nạp...' : 'Khôi Phục Dữ Liệu'}
            </button>

            <button
              onClick={handleExportBackup}
              disabled={exporting}
              style={{
                padding: '7px 12px',
                background: 'rgba(168, 85, 247, 0.1)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: exporting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              title="Xuất tệp sao lưu ra USB hoặc Desktop"
            >
              <Download size={14} />
              {exporting ? 'Đang xuất...' : 'Xuất Bản Sao Lưu'}
            </button>

            <button
              onClick={handleCleanupTemp}
              disabled={cleaning}
              style={{
                padding: '7px 12px',
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
              title="Dọn dẹp file tạm, cache thumbnail giải phóng dung lượng"
            >
              <Trash2 size={14} />
              {cleaning ? 'Đang dọn...' : 'Dọn Dẹp Cache'}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="version-badge">
              <Zap size={12} />
              v{appVersion}
            </div>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '5px 12px', cursor: 'pointer', borderRadius: '6px' }}
              onClick={handleCheckUpdate}
            >
              Kiểm tra cập nhật
            </button>
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
