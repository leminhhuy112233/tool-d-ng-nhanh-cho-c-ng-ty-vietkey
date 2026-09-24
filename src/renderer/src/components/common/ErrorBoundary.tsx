/**
 * VietKey DocGen — ErrorBoundary
 * Lá chắn bắt lỗi giao diện React, ngăn ngừa tuyệt đối hiện tượng Trắng Màn Hình (White Screen of Death)
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Bắt lỗi giao diện:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.hash = '#/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#F8FAFC',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '24px'
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              textAlign: 'center'
            }}
          >
            {/* Icon cảnh báo */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)'
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 10px', color: '#F1F5F9' }}>
              Đã Xảy Ra Sự Cố Giao Diện
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: '0 0 24px', lineHeight: '1.6' }}>
              Ứng dụng đã tự động ngăn ngừa lỗi làm gián đoạn hệ thống. Bạn có thể nhấn tải lại hoặc quay về Trang Chủ.
            </p>

            {/* Error Message */}
            {this.state.error && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  fontSize: '12px',
                  color: '#FCA5A5',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
              >
                <strong>Lỗi:</strong> {this.state.error.message || String(this.state.error)}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <RefreshCw size={15} />
                <span>Tải Lại Ứng Dụng</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  background: '#334155',
                  color: '#F8FAFC',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Home size={15} />
                <span>Về Trang Chủ</span>
              </button>
            </div>

            {/* Collapsible Tech Details */}
            {this.state.errorInfo && (
              <div style={{ textAlign: 'left', borderTop: '1px solid #334155', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: '11.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{this.state.showDetails ? 'Ẩn chi tiết kỹ thuật' : 'Xem chi tiết kỹ thuật (Stack Trace)'}</span>
                </button>

                {this.state.showDetails && (
                  <pre
                    style={{
                      marginTop: '10px',
                      padding: '12px',
                      background: '#0F172A',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#94A3B8',
                      overflowX: 'auto',
                      maxHeight: '160px',
                      overflowY: 'auto'
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
