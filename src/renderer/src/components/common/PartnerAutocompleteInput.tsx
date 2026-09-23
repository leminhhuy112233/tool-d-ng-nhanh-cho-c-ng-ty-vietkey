/**
 * VietKey DocGen — PartnerAutocompleteInput Component
 * Ô nhập tên đối tác / khách hàng kèm menu gợi ý tự động từ cơ sở dữ liệu đối tác cũ
 */

import { useState, useMemo } from 'react'
import { Building2 } from 'lucide-react'
import type { PartnerProfile } from '../../../../shared/types'
import { usePartnerSuggestions } from '../../hooks/usePartnerSuggestions'

interface PartnerAutocompleteInputProps {
  value: string
  onChange: (val: string) => void
  onSelectPartner?: (p: PartnerProfile) => void
  label?: string
  placeholder?: string
  required?: boolean
  isError?: boolean
  uppercase?: boolean
  className?: string
}

export function PartnerAutocompleteInput({
  value,
  onChange,
  onSelectPartner,
  label = 'Tên công ty đối tác',
  placeholder = 'Nhập tên công ty / khách hàng...',
  required = false,
  isError = false,
  uppercase = false,
  className = ''
}: PartnerAutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const { filterPartners } = usePartnerSuggestions()

  const filtered = useMemo(() => {
    return filterPartners(value)
  }, [value, filterPartners])

  const handleSelect = (partner: PartnerProfile) => {
    onChange(partner.ten_cong_ty)
    if (onSelectPartner) {
      onSelectPartner(partner)
    }
    setShowDropdown(false)
  }

  return (
    <div className={`partner-autocomplete-container ${className}`} style={{ position: 'relative' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, marginBottom: '4px' }}>
          {label} {required && <span style={{ color: 'var(--destructive)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className={isError ? 'setting-input input-error' : 'setting-input'}
          style={{
            width: '100%',
            fontWeight: 600,
            textTransform: uppercase ? 'uppercase' : 'none'
          }}
          value={value}
          onChange={(e) => {
            const v = uppercase ? e.target.value.toUpperCase() : e.target.value
            onChange(v)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
        />
      </div>

      {/* Dropdown Gợi ý đối tác */}
      {showDropdown && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            marginTop: '4px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              background: 'var(--muted)',
              borderBottom: '1px solid var(--border)'
            }}
          >
            💡 Đối tác từng lưu trong hệ thống (Nhấp để điền nhanh):
          </div>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              style={{
                padding: '9px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--muted)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Building2 size={14} color="var(--primary)" />
              <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ fontWeight: 600 }}>{p.ten_cong_ty}</span>
                {p.mst && (
                  <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginLeft: '8px' }}>
                    MST: {p.mst}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
