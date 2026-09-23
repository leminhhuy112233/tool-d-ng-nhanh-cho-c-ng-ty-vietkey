/**
 * VietKey DocGen — FormModeTabs Component
 * Thanh điều hướng chế độ nhập liệu (Thủ công / AI Bóc tách) kèm phím tắt và nút chọn ngày hôm nay
 */

import { FileText, Sparkles, Calendar } from 'lucide-react'

interface FormModeTabsProps {
  activeTab: 'manual' | 'ai'
  onTabChange: (tab: 'manual' | 'ai') => void
  manualLabel?: string
  aiLabel?: string
  onFillToday?: () => void
  showTodayButton?: boolean
}

export function FormModeTabs({
  activeTab,
  onTabChange,
  manualLabel = 'Nhập thủ công',
  aiLabel = 'Dán văn bản (AI tự bóc tách)',
  onFillToday,
  showTodayButton = true
}: FormModeTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '8px 12px',
        marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onTabChange('manual')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'manual' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'manual' ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText size={16} />
          {manualLabel}
        </button>

        <button
          type="button"
          onClick={() => onTabChange('ai')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'ai' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
            color: activeTab === 'ai' ? '#ffffff' : 'var(--muted-foreground)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles size={16} />
          {aiLabel}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginRight: '4px' }}>
          Phím tắt: <kbd style={{ background: 'var(--muted)', padding: '2px 5px', borderRadius: '4px' }}>Ctrl+Enter</kbd> để xuất
        </span>
        {showTodayButton && onFillToday && (
          <button
            type="button"
            onClick={onFillToday}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.15s ease'
            }}
            title="Điền ngày hôm nay vào các ô ngày tháng"
          >
            <Calendar size={14} />
            Hôm nay
          </button>
        )}
      </div>
    </div>
  )
}
