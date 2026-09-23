/**
 * VietKey DocGen — DateInputGroup Component
 * Nhóm 3 ô nhập liệu Ngày / Tháng / Năm kèm nút 1-click chọn "Hôm nay"
 */

import { Calendar, Sparkles } from 'lucide-react'

interface DateInputGroupProps {
  day: string
  month: string
  year: string
  onChangeDay: (val: string) => void
  onChangeMonth: (val: string) => void
  onChangeYear: (val: string) => void
  onFillToday?: () => void
  label?: string
  className?: string
}

export function DateInputGroup({
  day,
  month,
  year,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  onFillToday,
  label = 'Ngày tháng văn bản',
  className = ''
}: DateInputGroupProps) {
  const handleDefaultFillToday = () => {
    if (onFillToday) {
      onFillToday()
    } else {
      const today = new Date()
      onChangeDay(String(today.getDate()).padStart(2, '0'))
      onChangeMonth(String(today.getMonth() + 1).padStart(2, '0'))
      onChangeYear(String(today.getFullYear()))
    }
  }

  return (
    <div className={`date-input-group ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Calendar size={15} color="var(--primary)" />
          <span>{label}</span>
        </label>
        <button
          type="button"
          onClick={handleDefaultFillToday}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--primary)',
            background: 'var(--secondary)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '3px 8px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Tự động điền ngày, tháng, năm hiện tại"
        >
          <Sparkles size={11} />
          Hôm nay
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: '8px' }}>
        <div>
          <input
            type="text"
            className="form-input text-center"
            placeholder="Ngày (dd)"
            value={day}
            maxLength={2}
            onChange={(e) => onChangeDay(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <div>
          <input
            type="text"
            className="form-input text-center"
            placeholder="Tháng (mm)"
            value={month}
            maxLength={2}
            onChange={(e) => onChangeMonth(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
        <div>
          <input
            type="text"
            className="form-input text-center"
            placeholder="Năm (yyyy)"
            value={year}
            maxLength={4}
            onChange={(e) => onChangeYear(e.target.value.replace(/[^0-9]/g, ''))}
          />
        </div>
      </div>
    </div>
  )
}
