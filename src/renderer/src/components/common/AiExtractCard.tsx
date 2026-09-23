/**
 * VietKey DocGen — AiExtractCard Component
 * Khối trợ lý AI bóc tách thông tin tự động từ văn bản thô (Zalo, Email, ghi chú)
 */

import { useState } from 'react'
import { Sparkles, Wand2, ClipboardPaste } from 'lucide-react'

interface AiExtractCardProps {
  title?: string
  description?: string
  placeholder?: string
  tipText?: string
  buttonLabel?: string
  isParsing?: boolean
  onExtract: (rawText: string) => Promise<void> | void
}

export function AiExtractCard({
  title = 'Trợ lý AI bóc tách dữ liệu thông minh',
  description = 'Dán đoạn văn bản trao đổi từ Zalo, Email, tin nhắn... AI sẽ tự động điền các trường biểu mẫu',
  placeholder = 'Dán đoạn văn bản chứa thông tin cần bóc tách vào đây...',
  tipText = 'Mẹo: Bạn có thể sao chép trực tiếp tin nhắn Zalo của khách hàng rồi bấm bóc tách.',
  buttonLabel = 'Bóc tách thông tin',
  isParsing = false,
  onExtract
}: AiExtractCardProps) {
  const [text, setText] = useState('')

  const handlePasteClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText()
      if (clip) setText(clip)
    } catch {
      // ignore
    }
  }

  const handleRunExtract = () => {
    if (!text.trim() || isParsing) return
    onExtract(text)
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08))',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <Wand2 size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePasteClipboard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#8b5cf6',
            background: 'var(--card)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: 'pointer'
          }}
          title="Dán từ khay nhớ tạm clipboard"
        >
          <ClipboardPaste size={12} />
          Dán nhanh
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '110px',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          background: 'var(--card)',
          color: 'var(--foreground)',
          fontSize: '13px',
          resize: 'vertical',
          boxSizing: 'border-box',
          outline: 'none',
          fontFamily: 'inherit'
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
          {tipText}
        </span>
        <button
          type="button"
          onClick={handleRunExtract}
          disabled={isParsing || !text.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isParsing || !text.trim() ? 'not-allowed' : 'pointer',
            opacity: isParsing || !text.trim() ? 0.6 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          <Sparkles size={16} />
          {isParsing ? 'Đang bóc tách...' : buttonLabel}
        </button>
      </div>
    </div>
  )
}
