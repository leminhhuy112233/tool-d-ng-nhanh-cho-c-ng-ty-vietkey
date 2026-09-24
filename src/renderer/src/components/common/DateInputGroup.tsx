/**
 * VietKey DocGen — DateInputGroup Component
 * Nhóm 3 ô nhập liệu Ngày / Tháng / Năm chuẩn mực, đơn giản, viền đồng bộ với các trường khác
 */

import React, { useRef } from 'react'
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
  const monthRef = useRef<HTMLInputElement>(null)
  const yearRef = useRef<HTMLInputElement>(null)

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

  const handleDayChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    const finalVal = cleaned.length > 2 ? cleaned.slice(-2) : cleaned
    onChangeDay(finalVal)
    if (finalVal.length === 2 && monthRef.current) {
      monthRef.current.focus()
    }
  }

  const handleMonthChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '')
    const finalVal = cleaned.length > 2 ? cleaned.slice(-2) : cleaned
    onChangeMonth(finalVal)
    if (finalVal.length === 2 && yearRef.current) {
      yearRef.current.focus()
    }
  }

  const handleYearChange = (val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '').slice(0, 4)
    onChangeYear(cleaned)
  }

  return (
    <div className={`date-input-group ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 500, margin: 0, color: 'var(--foreground)' }}>
          <Calendar size={14} color="var(--primary)" />
          <span>{label}</span>
        </label>

        <button
          type="button"
          onClick={handleDefaultFillToday}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--foreground)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '3px 9px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Tự động điền ngày hôm nay"
        >
          <Sparkles size={11} color="var(--accent)" />
          <span>Hôm nay</span>
        </button>
      </div>

      <div className="date-inputs-grid">
        <input
          type="text"
          className="date-input-field"
          placeholder="Ngày (dd)"
          value={day}
          maxLength={2}
          onChange={(e) => handleDayChange(e.target.value)}
        />
        <input
          ref={monthRef}
          type="text"
          className="date-input-field"
          placeholder="Tháng (mm)"
          value={month}
          maxLength={2}
          onChange={(e) => handleMonthChange(e.target.value)}
        />
        <input
          ref={yearRef}
          type="text"
          className="date-input-field"
          placeholder="Năm (yyyy)"
          value={year}
          maxLength={4}
          onChange={(e) => handleYearChange(e.target.value)}
        />
      </div>
    </div>
  )
}
