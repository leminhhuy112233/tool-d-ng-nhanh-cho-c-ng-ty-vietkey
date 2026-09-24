/**
 * VietKey DocGen — DynamicDocPreview
 * Bản xem trước trang A4 linh hoạt cho mọi Mẫu Tùy Biến (Custom Templates)
 */

import React from 'react'

interface DynamicDocPreviewProps {
  templateName: string
  data: Record<string, any>
  fields?: Array<{ id: string; key: string; label: string; type: string }>
  onUpdateField?: (key: string, val: any) => void
}

export function DynamicDocPreview({
  templateName,
  data,
  fields = [],
  onUpdateField
}: DynamicDocPreviewProps) {
  const handleBlur = (key: string, e: React.FocusEvent<HTMLElement>) => {
    if (onUpdateField) {
      onUpdateField(key, e.currentTarget.innerText.trim())
    }
  }

  // Lọc các trường text và các trường mảng (bảng)
  const scalarFields = fields.filter((f) => f.type !== 'table')
  const tableFields = fields.filter((f) => f.type === 'table')

  return (
    <div className="a4-document-content" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: 1.6 }}>
      {/* Header tài liệu */}
      <div style={{ textAlign: 'center', borderBottom: '1.5px solid #000', paddingBottom: '14px', marginBottom: '20px' }}>
        <div contentEditable suppressContentEditableWarning style={{ fontSize: '11pt', fontWeight: 'bold', textTransform: 'uppercase', outline: 'none' }}>
          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
        </div>
        <div contentEditable suppressContentEditableWarning style={{ fontSize: '12pt', fontWeight: 'bold', outline: 'none' }}>
          Độc lập - Tự do - Hạnh phúc
        </div>
        <div style={{ width: '140px', height: '1.5px', background: '#000', margin: '4px auto 0' }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1
          contentEditable
          suppressContentEditableWarning
          style={{ fontSize: '17pt', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', margin: 0, outline: 'none' }}
        >
          {templateName || 'VĂN BẢN TÙY BIẾN'}
        </h1>
        <div style={{ fontSize: '11pt', fontStyle: 'italic', color: '#555', marginTop: '4px' }}>
          (Tài liệu xuất tự động từ hệ thống VietKey DocGen)
        </div>
      </div>

      {/* Danh sách các trường đơn */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '20px' }}>
        {scalarFields.length > 0 ? (
          scalarFields.map((f) => (
            <div key={f.id} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <strong style={{ minWidth: '160px', color: '#334155' }}>{f.label}:</strong>
              <span
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleBlur(f.key, e)}
                className="editable-inline"
                style={{ flex: 1, fontWeight: f.key.includes('ten') ? 'bold' : 500 }}
              >
                {data[f.key] !== undefined && data[f.key] !== '' ? String(data[f.key]) : `(Nhập ${f.label.toLowerCase()}...)`}
              </span>
            </div>
          ))
        ) : (
          Object.keys(data)
            .filter((k) => !k.startsWith('_') && !Array.isArray(data[k]))
            .map((k) => (
              <div key={k} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                <strong style={{ minWidth: '160px', color: '#334155' }}>{k}:</strong>
                <span
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleBlur(k, e)}
                  className="editable-inline"
                  style={{ flex: 1 }}
                >
                  {String(data[k] || '')}
                </span>
              </div>
            ))
        )}
      </div>

      {/* Danh sách bảng nếu có */}
      {tableFields.map((tbl) => {
        const items: any[] = Array.isArray(data[tbl.key]) ? data[tbl.key] : []
        if (items.length === 0) return null
        const sample = items[0] || {}
        const cols = Object.keys(sample)

        return (
          <div key={tbl.id} style={{ marginTop: '16px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '6px' }}>{tbl.label}:</h3>
            <table className="a4-preview-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                  {cols.map((col) => (
                    <th key={col} style={{ border: '1px solid #000', padding: '6px 8px', textTransform: 'capitalize' }}>
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, rowIdx) => (
                  <tr key={rowIdx}>
                    {cols.map((col) => (
                      <td key={col} contentEditable suppressContentEditableWarning style={{ border: '1px solid #000', padding: '6px 8px' }}>
                        {String(it[col] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}

      {/* Ký tên */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '40px', textAlign: 'center', pageBreakInside: 'avoid' }}>
        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>NGƯỜI LẬP BIỂU</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: '70px' }} />
        </div>
        <div>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>ĐẠI DIỆN PHÊ DUYỆT</div>
          <div style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>(Ký tên, đóng dấu)</div>
          <div style={{ height: '70px' }} />
        </div>
      </div>
    </div>
  )
}
