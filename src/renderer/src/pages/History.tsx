import { useState, useEffect } from 'react'
import { PageHeader } from '../components/layout/PageHeader'
import {
  Clock,
  FileText,
  Receipt,
  CreditCard,
  ExternalLink,
  Folder,
  Trash2,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  FileCheck,
  Edit3
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ExportHistoryRecord } from '../../../shared/types'
import { playSuccessChime } from '../lib/sound'
import { useFormDraftsStore } from '../stores/formDrafts.store'

export function History() {
  const navigate = useNavigate()
  const [historyList, setHistoryList] = useState<ExportHistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'contract' | 'quotation' | 'advance_request' | 'custom'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const setContractDraft = useFormDraftsStore((s) => s.setContractDraft)
  const setQuotationDraft = useFormDraftsStore((s) => s.setQuotationDraft)
  const setAdvanceRequestDraft = useFormDraftsStore((s) => s.setAdvanceRequestDraft)

  const handleEditRecord = (record: ExportHistoryRecord) => {
    if (record.docType === 'contract') {
      if (record.dataSnapshot) {
        setContractDraft(record.dataSnapshot as any)
      } else {
        setContractDraft((prev) => ({
          ...prev,
          bena_ten_cong_ty: record.customerName || prev.bena_ten_cong_ty,
          file_name: record.fileName || prev.file_name
        }))
      }
      navigate('/contract')
      showToast('success', `Đã mở lại dữ liệu hợp đồng "${record.fileName}" để chỉnh sửa tiếp!`)
    } else if (record.docType === 'quotation') {
      if (record.dataSnapshot) {
        setQuotationDraft(record.dataSnapshot as any)
      } else {
        setQuotationDraft((prev) => ({
          ...prev,
          ten_khach_hang: record.customerName || prev.ten_khach_hang,
          file_name: record.fileName || prev.file_name
        }))
      }
      navigate('/quotation')
      showToast('success', `Đã mở lại dữ liệu bảng báo giá "${record.fileName}" để chỉnh sửa tiếp!`)
    } else if (record.docType === 'advance_request') {
      if (record.dataSnapshot) {
        setAdvanceRequestDraft(record.dataSnapshot as any)
      } else {
        setAdvanceRequestDraft((prev) => ({
          ...prev,
          ten_cong_ty_khach: record.customerName || prev.ten_cong_ty_khach,
          file_name: record.fileName || prev.file_name
        }))
      }
      navigate('/advance-request')
      showToast('success', `Đã mở lại dữ liệu đề nghị tạm ứng "${record.fileName}" để chỉnh sửa tiếp!`)
    } else if (record.docType === 'custom' && record.templateId) {
      if (record.dataSnapshot) {
        try {
          localStorage.setItem(`vk_custom_draft_${record.templateId}`, JSON.stringify(record.dataSnapshot))
        } catch (e) {
          console.error(e)
        }
      }
      navigate(`/custom-form/${record.templateId}`)
      showToast('success', `Đã mở lại dữ liệu mẫu "${record.templateName || record.fileName}" để chỉnh sửa tiếp!`)
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text })
    if (type === 'success') playSuccessChime()
    setTimeout(() => setToastMessage(null), 5000)
  }

  const loadHistory = async () => {
    setIsLoading(true)
    if (window.api?.getHistory) {
      try {
        const records = await window.api.getHistory()
        setHistoryList(records || [])
      } catch (err) {
        console.error('Lỗi tải lịch sử:', err)
        showToast('error', 'Không thể đọc lịch sử từ hệ thống.')
      }
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleOpenFile = async (filePath: string) => {
    if (!filePath) return
    try {
      if (window.api?.openPath) {
        await window.api.openPath(filePath)
        showToast('success', 'Đang mở tài liệu bằng ứng dụng mặc định...')
      } else {
        showToast('error', 'Cần chạy trong môi trường Desktop Electron.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Không thể mở file.')
    }
  }

  const handleOpenFolder = async (filePath: string) => {
    if (!filePath) return
    try {
      if (window.api?.showItemInFolder) {
        await window.api.showItemInFolder(filePath)
        showToast('success', 'Đang mở thư mục chứa tài liệu trong File Explorer!')
      } else {
        showToast('error', 'Cần chạy trong môi trường Desktop Electron.')
      }
    } catch (err: any) {
      showToast('error', err.message || 'Không thể mở thư mục.')
    }
  }

  const handleDeleteRecord = async (id: string, fileName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bản ghi "${fileName}" khỏi danh sách lịch sử? (File gốc trên máy tính không bị xóa)`)) {
      if (window.api?.deleteHistoryRecord) {
        await window.api.deleteHistoryRecord(id)
        setHistoryList((prev) => prev.filter((item) => item.id !== id))
        showToast('success', 'Đã xóa bản ghi khỏi lịch sử.')
      }
    }
  }

  const handleClearAllHistory = async () => {
    if (historyList.length === 0) return
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử xuất tài liệu? (Các file đã xuất trên ổ cứng vẫn được giữ nguyên)')) {
      if (window.api?.clearHistory) {
        await window.api.clearHistory()
        setHistoryList([])
        showToast('success', 'Đã xóa sạch toàn bộ lịch sử xuất file.')
      }
    }
  }

  // Counts by category
  const contractCount = historyList.filter((h) => h.docType === 'contract').length
  const quotationCount = historyList.filter((h) => h.docType === 'quotation').length
  const advanceCount = historyList.filter((h) => h.docType === 'advance_request').length
  const customCount = historyList.filter((h) => h.docType === 'custom').length

  // Filtered list
  const filteredList = historyList.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.docType === selectedCategory
    const query = searchKeyword.toLowerCase().trim()
    const matchesSearch =
      !query ||
      item.fileName.toLowerCase().includes(query) ||
      (item.customerName && item.customerName.toLowerCase().includes(query))
    return matchesCategory && matchesSearch
  })

  const getDocTypeBadge = (docType: string) => {
    switch (docType) {
      case 'contract':
        return {
          label: 'Hợp Đồng',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.12)',
          icon: <FileText size={13} color="#3b82f6" />
        }
      case 'quotation':
        return {
          label: 'Báo Giá',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          icon: <Receipt size={13} color="#10b981" />
        }
      case 'advance_request':
        return {
          label: 'Đề Nghị Tạm Ứng',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          icon: <CreditCard size={13} color="#f59e0b" />
        }
      case 'custom':
        return {
          label: 'Mẫu Tùy Biến',
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.12)',
          icon: <Sparkles size={13} color="#8b5cf6" />
        }
      default:
        return {
          label: 'Tài Liệu',
          color: 'var(--muted-foreground)',
          bg: 'var(--muted)',
          icon: <FileText size={13} />
        }
    }
  }

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes} - ${day}/${month}/${year}`
    } catch {
      return dateStr
    }
  }

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Page Header */}
      <PageHeader
        title="Lịch Sử Xuất Tài Liệu"
        description="Xem lại toàn bộ tài liệu đã tạo, mở nhanh file Word/PDF hoặc thư mục lưu trữ bất cứ lúc nào"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={loadHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Tải lại danh sách lịch sử mới nhất"
          >
            <RotateCcw size={15} />
            Làm mới
          </button>

          {historyList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--destructive)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Xóa toàn bộ lịch sử xuất tài liệu"
            >
              <Trash2 size={15} />
              Xóa toàn bộ lịch sử
            </button>
          )}
        </div>
      </PageHeader>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={20} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
              Tổng Tài Liệu Đã Xuất
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)' }}>
              {historyList.length}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileText size={20} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
              Hợp Đồng Đã Ký
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6' }}>
              {contractCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Receipt size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
              Bảng Báo Giá Đã Tạo
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
              {quotationCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CreditCard size={20} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
              Đề Nghị Tạm Ứng
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>
              {advanceCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={20} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 600 }}>
              Mẫu Tùy Biến (AI)
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#8b5cf6' }}>
              {customCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `Tất cả (${historyList.length})` },
            { id: 'contract', label: `Hợp đồng (${contractCount})` },
            { id: 'quotation', label: `Báo giá (${quotationCount})` },
            { id: 'advance_request', label: `Tạm ứng (${advanceCount})` },
            { id: 'custom', label: `Mẫu tùy biến (${customCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: selectedCategory === tab.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: selectedCategory === tab.id ? 'var(--primary)' : 'var(--background)',
                color: selectedCategory === tab.id ? 'var(--primary-foreground)' : 'var(--foreground)',
                fontWeight: selectedCategory === tab.id ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search
            size={15}
            color="var(--muted-foreground)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="setting-input"
            style={{ width: '100%', paddingLeft: '34px', fontSize: '12.5px' }}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo tên file, khách hàng..."
          />
        </div>
      </div>

      {/* Main Records Table or Empty State */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
        }}
      >
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            Đang tải dữ liệu lịch sử...
          </div>
        ) : filteredList.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}
            >
              <Clock size={32} color="var(--muted-foreground)" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0 }}>
              {historyList.length === 0 ? 'Chưa có tài liệu nào trong lịch sử' : 'Không tìm thấy tài liệu phù hợp'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', maxWidth: '420px', margin: 0 }}>
              {historyList.length === 0
                ? 'Khi bạn tạo và xuất Hợp đồng, Bảng báo giá hoặc Đề nghị tạm ứng, các tài liệu sẽ tự động được ghi nhận tại đây.'
                : 'Hãy thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục khác.'}
            </p>

            {historyList.length === 0 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  onClick={() => navigate('/quotation')}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Tạo Báo Giá Ngay
                </button>
                <button
                  onClick={() => navigate('/contract')}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--muted)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Tạo Hợp Đồng
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px'
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'var(--muted)',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left', width: '150px' }}>
                    Thời Gian Xuất
                  </th>
                  <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left', width: '150px' }}>
                    Loại Tài Liệu
                  </th>
                  <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left' }}>
                    Khách Hàng / Đối Tác
                  </th>
                  <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'left', width: '220px' }}>
                    Tên File
                  </th>
                  <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'center', width: '100px' }}>
                    Định Dạng
                  </th>
                  <th style={{ padding: '12px 16px', textTransform: 'uppercase', fontSize: '11px', textAlign: 'center', width: '240px' }}>
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((record) => {
                  const badge = getDocTypeBadge(record.docType)

                  return (
                    <tr
                      key={record.id}
                      className="data-table-row"
                    >
                      {/* Thời gian */}
                      <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)', fontSize: '12px' }}>
                        {formatTimestamp(record.createdAt)}
                      </td>

                      {/* Loại tài liệu badge */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.color}40`
                          }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--foreground)' }}>
                        {record.customerName || 'Không có tên'}
                      </td>

                      {/* Tên file */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileCheck size={14} color="var(--primary)" />
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '190px'
                            }}
                            title={record.filePath}
                          >
                            {record.fileName}
                          </span>
                        </div>
                      </td>

                      {/* Định dạng */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: 'var(--muted)',
                            color: 'var(--foreground)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          {record.exportType}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleEditRecord(record)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            title="Tải lại toàn bộ dữ liệu vào form để tiếp tục chỉnh sửa và xuất tiếp"
                          >
                            <Edit3 size={13} />
                            Sửa tiếp
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenFile(record.filePath)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              background: 'var(--primary)',
                              color: 'var(--primary-foreground)',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title="Mở tài liệu này"
                          >
                            <ExternalLink size={13} />
                            Mở
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenFolder(record.filePath)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              background: 'var(--muted)',
                              color: 'var(--foreground)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Mở thư mục chứa file trong File Explorer"
                          >
                            <Folder size={13} />
                            Thư mục
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(record.id, record.fileName)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '5px 7px',
                              background: 'transparent',
                              color: 'var(--muted-foreground)',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                            title="Xóa khỏi lịch sử"
                            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--destructive)')}
                            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="toast"
          style={{
            borderColor: toastMessage.type === 'error' ? 'var(--destructive)' : '#10b981',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 size={18} color="#10b981" />
          ) : (
            <AlertCircle size={18} color="var(--destructive)" />
          )}
          <span style={{ fontWeight: 600 }}>{toastMessage.text}</span>
        </div>
      )}
    </div>
  )
}
