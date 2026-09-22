import { Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react'

interface LoadingOverlayProps {
  isVisible: boolean
  title?: string
  subtitle?: string
  type?: 'ai' | 'export'
}

export function LoadingOverlay({
  isVisible,
  title = 'Đang xử lý dữ liệu...',
  subtitle = 'Vui lòng chờ trong giây lát...',
  type = 'export'
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '32px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          maxWidth: '400px',
          textAlign: 'center'
        }}
      >
        {/* Animated Glowing Icon Ring */}
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background:
                type === 'ai'
                  ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                  : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              opacity: 0.3,
              filter: 'blur(10px)',
              animation: 'pulse 1.5s infinite alternate'
            }}
          />
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              background:
                type === 'ai'
                  ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                  : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {type === 'ai' ? (
              <Sparkles size={28} style={{ animation: 'spin 4s linear infinite' }} />
            ) : (
              <FileText size={28} />
            )}
          </div>
        </div>

        {/* Spinner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <Loader2
            size={18}
            color={type === 'ai' ? '#ec4899' : '#3b82f6'}
            style={{ animation: 'spin 1s linear infinite' }}
          />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--foreground)'
            }}
          >
            {title}
          </span>
        </div>

        <p
          style={{
            fontSize: '12.5px',
            color: 'var(--muted-foreground)',
            margin: 0,
            lineHeight: 1.5
          }}
        >
          {subtitle}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          from { opacity: 0.2; transform: scale(0.9); }
          to { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
