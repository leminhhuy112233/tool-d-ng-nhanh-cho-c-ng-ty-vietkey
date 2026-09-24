/**
 * VietKey DocGen — TemplateVersionHistoryModal
 * Hộp thoại xem lịch sử các phiên bản mẫu Word và khôi phục (Rollback) an toàn
 */

import { useState, useEffect } from 'react'
import {
  X,
  History,
  FileText,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import type { CustomTemplateDef, TemplateVersion } from '../../../../shared/types'

interface TemplateVersionHistoryModalProps {
  isOpen: boolean
  template: CustomTemplateDef | null
  onClose: () => void
  onRollbackSuccess: (updatedTemplate: CustomTemplateDef) => void
}

export function TemplateVersionHistoryModal({
  isOpen,
  template,
  onClose,
  onRollbackSuccess
}: TemplateVersionHistoryModalProps) {
  const [versions, setVersions] = useState<TemplateVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedVer, setSelectedVer] = useState<TemplateVersion | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !template) return

    const loadVersions = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        if (window.api?.getTemplateVersions) {
          const list = await window.api.getTemplateVersions(template.id)
          setVersions(list)
          if (list.length > 0) {
            setSelectedVer(list[0])
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Không thể tải lịch sử phiên bản.')
      } finally {
        setIsLoading(false)
      }
    }

    loadVersions()
  }, [isOpen, template])

  if (!isOpen || !template) return null

  const currentVersionNum = template.currentVersion || 1

  const handleRollback = async (targetVersion: number) => {
    if (targetVersion === currentVersionNum) {
      alert('Mẫu này đang ở phiên bản này rồi!')
      return
    }

    const confirmMsg = `Bạn có chắc chắn muốn khôi phục mẫu "${template.name}" về Phiên bản v${targetVersion}.0?\nFile Word và danh sách trường điền sẽ được phục hồi lại đúng như phiên bản đó.`
    if (!window.confirm(confirmMsg)) return

    setIsRollingBack(true)
    setErrorMessage(null)
    try {
      if (!window.api?.rollbackCustomTemplateVersion) {
        throw new Error('API khôi phục phiên bản chưa sẵn sàng.')
      }

      const res = await window.api.rollbackCustomTemplateVersion(template.id, targetVersion)
      if (res.success && res.template) {
        onRollbackSuccess(res.template)
        onClose()
      } else {
        setErrorMessage(res.error || 'Có lỗi xảy ra khi khôi phục phiên bản.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khôi phục phiên bản.')
    } finally {
      setIsRollingBack(false)
    }
  }

  const handleOpenFile = (path: string) => {
    if (window.api?.openPath) {
      window.api.openPath(path)
    }
  }

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return isoStr
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '88vh',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <History size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                Lịch Sử Phiên Bản: {template.name}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Đang dùng: <strong>v{currentVersionNum}.0</strong> • Tổng cộng {versions.length} phiên bản đã lưu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: 'var(--muted-foreground)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body: Two columns (List left, Details right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Cột trái: Timeline Danh sách phiên bản */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              borderRight: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {errorMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '8px',
                  color: 'var(--destructive)',
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {versions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted-foreground)' }}>
                Chưa có lịch sử phiên bản nào được ghi nhận.
              </div>
            ) : (
              versions.map((ver) => {
                const isCurrent = ver.version === currentVersionNum
                const isSelected = selectedVer?.version === ver.version
                return (
                  <div
                    key={ver.version}
                    onClick={() => setSelectedVer(ver)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: isSelected
                        ? '2px solid var(--primary)'
                        : isCurrent
                        ? '1px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid var(--border)',
                      background: isSelected
                        ? 'rgba(59, 130, 246, 0.05)'
                        : isCurrent
                        ? 'rgba(16, 185, 129, 0.03)'
                        : 'var(--card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: isCurrent ? 'rgba(16, 185, 129, 0.15)' : 'var(--muted)',
                            color: isCurrent ? '#10b981' : 'var(--foreground)'
                          }}
                        >
                          v{ver.version}.0
                        </span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            <CheckCircle2 size={12} /> Đang dùng
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '11.5px', color: 'var(--muted-foreground)' }}>
                        {formatDate(ver.createdAt)}
                      </span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--foreground)', fontWeight: 500, marginBottom: '6px' }}>
                      {ver.changeNote || 'Không có ghi chú thay đổi'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                      <span>📝 {ver.fields?.length || 0} trường điền</span>
                      <span>•</span>
                      <span>📁 {ver.fileName || 'template.docx'}</span>
                      {ver.fileSize && <span>({ver.fileSize})</span>}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Cột phải: Chi tiết phiên bản & Thao tác */}
          <div
            style={{
              padding: '20px',
              overflowY: 'auto',
              background: 'var(--background)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {selectedVer ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: selectedVer.version === currentVersionNum ? '#10b981' : 'var(--primary)',
                        color: '#ffffff'
                      }}
                    >
                      v{selectedVer.version}.0
                    </span>
                    <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--foreground)' }}>
                      {selectedVer.versionName || `Phiên bản ${selectedVer.version}`}
                    </h4>
                  </div>

                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--muted-foreground)' }}>
                    Tạo lúc: {formatDate(selectedVer.createdAt)}
                  </p>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '4px' }}>
                    Ghi chú thay đổi (Change Note):
                  </label>
                  <div style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.5 }}>
                    {selectedVer.changeNote || 'Tạo lần đầu, không có ghi chú.'}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                    Các trường dữ liệu trong phiên bản này ({selectedVer.fields?.length || 0}):
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {selectedVer.fields && selectedVer.fields.length > 0 ? (
                      selectedVer.fields.map((f) => (
                        <span
                          key={f.id}
                          style={{
                            fontSize: '11.5px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'var(--muted)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)'
                          }}
                        >
                          {f.label} ({f.key})
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Không có trường nào</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenFile(selectedVer.docxFilePath)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ExternalLink size={14} />
                  Mở file Word (DOCX) của bản này
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--muted-foreground)', marginTop: '40px' }}>
                Chọn một phiên bản ở danh sách bên trái để xem chi tiết
              </div>
            )}

            {/* Bottom Actions */}
            {selectedVer && selectedVer.version !== currentVersionNum && (
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', marginTop: '16px' }}>
                <button
                  type="button"
                  disabled={isRollingBack}
                  onClick={() => handleRollback(selectedVer.version)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isRollingBack ? 'not-allowed' : 'pointer',
                    opacity: isRollingBack ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <RotateCcw size={15} />
                  {isRollingBack ? 'Đang khôi phục...' : `Khôi phục về phiên bản v${selectedVer.version}.0`}
                </button>
                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
                  Hệ thống sẽ thay thế file mẫu đang hoạt động bằng bản v{selectedVer.version}.0
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-foreground)' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Mỗi lần cập nhật đều được bảo toàn nguyên vẹn trong thư mục lưu trữ phiên bản an toàn.</span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--foreground)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
