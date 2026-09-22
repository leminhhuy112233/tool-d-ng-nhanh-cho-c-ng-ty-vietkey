/**
 * PdfSignatureModal — Studio Ký Tên & Con Dấu Chuẩn Doanh Nghiệp (Enterprise Edition)
 * 4 Nhóm chức năng:
 * 1. Vẽ chữ ký tay (Draw Signature) với nét mượt, khử răng cưa
 * 2. Tải ảnh chữ ký / con dấu (Smart Background Remover khử nền giấy trắng)
 * 3. Chữ ký nghệ thuật theo tên (Type-to-Sign với 4 phong cách)
 * 4. Con dấu mẫu văn phòng (Office Stamp Generator: ĐÃ DUYỆT, ĐÃ THANH TOÁN, BẢO MẬT...)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  FileSignature,
  PenTool,
  Upload,
  Type,
  Stamp,
  RotateCcw,
  Trash2,
  Check,
  X,
  Sparkles,
  Layers,
  Palette,
  Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type SignatureTab = 'draw' | 'upload' | 'type' | 'stamp'

export interface SignatureResult {
  imageBase64: string // PNG dataURL hoặc base64
  initialWidth: number
  initialHeight: number
  label: string
}

interface PdfSignatureModalProps {
  initialTab?: SignatureTab
  onConfirm: (result: SignatureResult) => void
  onClose: () => void
}

const INK_COLORS = [
  { id: 'blue', label: 'Xanh doanh nghiệp', hex: '#003399' },
  { id: 'black', label: 'Đen văn bản', hex: '#111827' },
  { id: 'red', label: 'Đỏ dấu ấn', hex: '#dc2626' }
]

const OFFICE_STAMPS = [
  { id: 'approved', title: 'ĐÃ DUYỆT', subtitle: 'APPROVED BY VIETKEY', color: '#003399' },
  { id: 'paid', title: 'ĐÃ THANH TOÁN', subtitle: 'PAID IN FULL', color: '#dc2626' },
  { id: 'confidential', title: 'BẢO MẬT', subtitle: 'CONFIDENTIAL', color: '#dc2626' },
  { id: 'original', title: 'BẢN GỐC', subtitle: 'ORIGINAL DOCUMENT', color: '#16a34a' },
  { id: 'copy', title: 'SAO Y BẢN CHÍNH', subtitle: 'CERTIFIED TRUE COPY', color: '#d97706' }
]

const FONT_STYLES = [
  { id: 'segoe', name: 'Thanh lịch (Script)', font: "'Segoe Script', 'Dancing Script', cursive" },
  { id: 'brush', name: 'Phóng khoáng (Brush)', font: "'Brush Script MT', 'Caveat', cursive" },
  { id: 'handwriting', name: 'Tự nhiên (Handwriting)', font: "'Lucida Handwriting', 'Great Vibes', cursive" },
  { id: 'serif', name: 'Trang trọng (Formal)', font: "'Playfair Display', 'Times New Roman', serif" }
]

export function PdfSignatureModal({
  initialTab = 'draw',
  onConfirm,
  onClose
}: PdfSignatureModalProps) {
  const [activeTab, setActiveTab] = useState<SignatureTab>(initialTab)
  const [inkColor, setInkColor] = useState(INK_COLORS[0].hex)
  const [penWidth, setPenWidth] = useState(3)

  // 1. Draw Tab State
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const drawHistoryRef = useRef<ImageData[]>([])

  // 2. Upload Tab State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [removeWhiteBg, setRemoveWhiteBg] = useState(true)
  const [processedUpload, setProcessedUpload] = useState<string | null>(null)

  // 3. Type Tab State
  const [signerName, setSignerName] = useState('Lê Minh Huy')
  const [selectedFont, setSelectedFont] = useState(FONT_STYLES[0].font)

  // 4. Stamp Tab State
  const [selectedStamp, setSelectedStamp] = useState(OFFICE_STAMPS[0])
  const [stampDate, setStampDate] = useState(() => {
    const today = new Date()
    return `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
  })

  // ===== CANVAS DRAW LOGIC =====
  const initDrawCanvas = useCallback(() => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set high resolution for retina displays
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = inkColor
    ctx.lineWidth = penWidth

    // Save initial blank state
    drawHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)]
  }, [inkColor, penWidth])

  useEffect(() => {
    if (activeTab === 'draw') {
      const timer = setTimeout(() => {
        initDrawCanvas()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [activeTab, initDrawCanvas])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasDrawn(true)
    const { x, y } = getCanvasCoords(e)
    ctx.strokeStyle = inkColor
    ctx.lineWidth = penWidth
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCanvasCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.closePath()

    // Push to history
    drawHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
  }

  const clearDrawCanvas = () => {
    const canvas = drawCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawHistoryRef.current = []
    setHasDrawn(false)
  }

  const undoDraw = () => {
    const canvas = drawCanvasRef.current
    if (!canvas || drawHistoryRef.current.length <= 1) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawHistoryRef.current.pop() // remove current
    const prev = drawHistoryRef.current[drawHistoryRef.current.length - 1]
    if (prev) {
      ctx.putImageData(prev, 0, 0)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
    }
  }

  // ===== SMART BACKGROUND REMOVER (UPLOAD TAB) =====
  const processUploadedImage = useCallback((dataUrl: string, removeWhite: boolean) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0)

      if (removeWhite) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imgData.data
        // Transparent keying for white / near-white pixels
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i]
          const g = d[i + 1]
          const b = d[i + 2]
          // If luminance is high (near white) -> make transparent
          const brightness = (r * 299 + g * 587 + b * 114) / 1000
          if (brightness > 220) {
            d[i + 3] = 0 // transparent
          } else if (brightness > 180) {
            // Anti-aliased feathering at borders
            d[i + 3] = Math.round(((220 - brightness) / 40) * 255)
          }
        }
        ctx.putImageData(imgData, 0, 0)
      }

      setProcessedUpload(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setUploadedImage(result)
      processUploadedImage(result, removeWhiteBg)
    }
    reader.readAsDataURL(file)
  }

  const toggleRemoveWhiteBg = (enabled: boolean) => {
    setRemoveWhiteBg(enabled)
    if (uploadedImage) {
      processUploadedImage(uploadedImage, enabled)
    }
  }

  // ===== RENDER STAMP CANVAS =====
  const generateStampPng = useCallback((): { dataUrl: string; width: number; height: number } => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 200
    const ctx = canvas.getContext('2d')
    if (!ctx) return { dataUrl: '', width: 200, height: 100 }

    const col = selectedStamp.color

    // Outer double border
    ctx.lineWidth = 4
    ctx.strokeStyle = col
    ctx.strokeRect(10, 10, 380, 180)

    ctx.lineWidth = 1.5
    ctx.strokeRect(16, 16, 368, 168)

    // Inner Title
    ctx.fillStyle = col
    ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(selectedStamp.title, 200, 65)

    // Divider
    ctx.beginPath()
    ctx.moveTo(35, 100)
    ctx.lineTo(365, 100)
    ctx.lineWidth = 2
    ctx.stroke()

    // Subtitle & Date
    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif'
    ctx.fillText(`${selectedStamp.subtitle} • ${stampDate}`, 200, 130)

    // Small star badges
    ctx.font = '16px sans-serif'
    ctx.fillText('★', 45, 65)
    ctx.fillText('★', 355, 65)

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: 200,
      height: 100
    }
  }, [selectedStamp, stampDate])

  // ===== RENDER TEXT SIGNATURE CANVAS =====
  const generateTextSignaturePng = useCallback((): { dataUrl: string; width: number; height: number } => {
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 220
    const ctx = canvas.getContext('2d')
    if (!ctx) return { dataUrl: '', width: 200, height: 80 }

    ctx.fillStyle = inkColor
    ctx.font = `italic bold 56px ${selectedFont}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(signerName || 'VietKey', 250, 100)

    // Subtle flourish underline
    ctx.lineWidth = 2
    ctx.strokeStyle = inkColor
    ctx.beginPath()
    ctx.moveTo(80, 150)
    ctx.bezierCurveTo(200, 170, 320, 130, 420, 155)
    ctx.stroke()

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: 200,
      height: 90
    }
  }, [signerName, selectedFont, inkColor])

  // ===== CONFIRM & INSERT =====
  const handleConfirm = () => {
    if (activeTab === 'draw') {
      const canvas = drawCanvasRef.current
      if (!canvas || !hasDrawn) return
      // Create cropped trimmed PNG
      const dataUrl = canvas.toDataURL('image/png')
      onConfirm({
        imageBase64: dataUrl,
        initialWidth: 180,
        initialHeight: 90,
        label: 'Chữ ký tay'
      })
    } else if (activeTab === 'upload') {
      if (!processedUpload) return
      onConfirm({
        imageBase64: processedUpload,
        initialWidth: 160,
        initialHeight: 120,
        label: 'Con dấu / Chữ ký tải lên'
      })
    } else if (activeTab === 'type') {
      const { dataUrl, width, height } = generateTextSignaturePng()
      onConfirm({
        imageBase64: dataUrl,
        initialWidth: width,
        initialHeight: height,
        label: `Chữ ký (${signerName})`
      })
    } else if (activeTab === 'stamp') {
      const { dataUrl, width, height } = generateStampPng()
      onConfirm({
        imageBase64: dataUrl,
        initialWidth: width,
        initialHeight: height,
        label: `Con dấu ${selectedStamp.title}`
      })
    }
    onClose()
  }

  return (
    <div className="pdf-modal-overlay" onClick={onClose}>
      <motion.div
        className="pdf-modal pdf-signature-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
      >
        {/* Modal Header */}
        <div className="pdf-modal-header">
          <div className="pdf-modal-title">
            <FileSignature size={20} className="text-cyan-400" />
            <span>Ký Tên & Con Dấu Doanh Nghiệp</span>
          </div>
          <button className="pdf-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 4 Mode Tabs */}
        <div className="pdf-sig-tabs">
          <button
            className={`pdf-sig-tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
            onClick={() => setActiveTab('draw')}
          >
            <PenTool size={16} />
            <span>Vẽ tay</span>
          </button>
          <button
            className={`pdf-sig-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={16} />
            <span>Tải ảnh con dấu</span>
          </button>
          <button
            className={`pdf-sig-tab-btn ${activeTab === 'type' ? 'active' : ''}`}
            onClick={() => setActiveTab('type')}
          >
            <Type size={16} />
            <span>Chữ ký theo tên</span>
          </button>
          <button
            className={`pdf-sig-tab-btn ${activeTab === 'stamp' ? 'active' : ''}`}
            onClick={() => setActiveTab('stamp')}
          >
            <Stamp size={16} />
            <span>Con dấu mẫu</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="pdf-modal-body">
          {/* ===== TAB 1: VẼ CHỮ KÝ TAY ===== */}
          {activeTab === 'draw' && (
            <div className="pdf-sig-draw-pane">
              {/* Toolbar nét vẽ & màu mực */}
              <div className="pdf-sig-toolbar">
                <div className="pdf-sig-color-picker">
                  {INK_COLORS.map((c) => (
                    <button
                      key={c.id}
                      className={`pdf-color-dot ${inkColor === c.hex ? 'active' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setInkColor(c.hex)}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="pdf-sig-width-picker">
                  <span className="text-xs text-muted-foreground">Nét bút:</span>
                  {[2, 3, 5].map((w) => (
                    <button
                      key={w}
                      className={`pdf-width-btn ${penWidth === w ? 'active' : ''}`}
                      onClick={() => setPenWidth(w)}
                    >
                      <div
                        style={{
                          width: `${w * 4}px`,
                          height: `${w}px`,
                          backgroundColor: inkColor,
                          borderRadius: '2px'
                        }}
                      />
                    </button>
                  ))}
                </div>

                <div className="pdf-sig-actions-right">
                  <button className="pdf-sig-tool-btn" onClick={undoDraw} title="Hoàn tác nét cuối">
                    <RotateCcw size={14} />
                    <span>Lùi lại</span>
                  </button>
                  <button className="pdf-sig-tool-btn danger" onClick={clearDrawCanvas} title="Xóa toàn bộ để vẽ lại">
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>

              {/* Bảng Canvas vẽ */}
              <div className="pdf-sig-canvas-wrap">
                <canvas
                  ref={drawCanvasRef}
                  className="pdf-sig-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="pdf-sig-hint-overlay">
                    <PenTool size={24} className="opacity-40 mb-2" />
                    <span>Dùng chuột hoặc bút cảm ứng ký vào đây</span>
                  </div>
                )}
                <div className="pdf-sig-baseline" />
              </div>
            </div>
          )}

          {/* ===== TAB 2: TẢI ẢNH CHỮ KÝ / CON DẤU ===== */}
          {activeTab === 'upload' && (
            <div className="pdf-sig-upload-pane">
              {!uploadedImage ? (
                <label className="pdf-sig-upload-dropzone">
                  <Upload size={32} className="text-cyan-400 mb-2" />
                  <span className="font-semibold text-sm">Nhấn hoặc kéo ảnh chữ ký / con dấu vào đây</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Hỗ trợ PNG, JPG, JPEG (Khuyên dùng ảnh chụp sắc nét)
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                </label>
              ) : (
                <div className="pdf-sig-upload-preview-wrap">
                  <div className="pdf-sig-checker-preview">
                    {processedUpload && (
                      <img src={processedUpload} alt="Preview" className="pdf-sig-preview-img" />
                    )}
                  </div>

                  <div className="pdf-sig-upload-controls">
                    <label className="pdf-checkbox-label">
                      <input
                        type="checkbox"
                        checked={removeWhiteBg}
                        onChange={(e) => toggleRemoveWhiteBg(e.target.checked)}
                      />
                      <span>Tự động khử nền trắng (Chỉ giữ lại nét vẽ / con dấu đỏ)</span>
                    </label>

                    <label className="pdf-btn pdf-btn-sm pdf-btn-ghost cursor-pointer">
                      <Upload size={14} />
                      <span>Chọn ảnh khác</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB 3: CHỮ KÝ THEO TÊN (TYPE) ===== */}
          {activeTab === 'type' && (
            <div className="pdf-sig-type-pane">
              <div className="pdf-form-group">
                <label className="pdf-form-label">Nhập họ và tên người ký:</label>
                <div className="flex gap-2">
                  <input
                    className="pdf-form-input flex-1"
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Ví dụ: Lê Minh Huy"
                  />
                  <div className="pdf-sig-color-picker">
                    {INK_COLORS.map((c) => (
                      <button
                        key={c.id}
                        className={`pdf-color-dot ${inkColor === c.hex ? 'active' : ''}`}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setInkColor(c.hex)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <label className="pdf-form-label mt-3">Chọn phong cách chữ ký:</label>
              <div className="pdf-font-styles-grid">
                {FONT_STYLES.map((f) => {
                  const isSel = selectedFont === f.font
                  return (
                    <div
                      key={f.id}
                      className={`pdf-font-card ${isSel ? 'active' : ''}`}
                      onClick={() => setSelectedFont(f.font)}
                    >
                      <span className="pdf-font-card-name">{f.name}</span>
                      <div
                        className="pdf-font-card-preview"
                        style={{ fontFamily: f.font, color: inkColor }}
                      >
                        {signerName || 'VietKey Signature'}
                      </div>
                      {isSel && (
                        <div className="pdf-font-card-check">
                          <Check size={12} color="white" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ===== TAB 4: CON DẤU MẪU DOANH NGHIỆP ===== */}
          {activeTab === 'stamp' && (
            <div className="pdf-sig-stamp-pane">
              <div className="pdf-stamp-controls">
                <div className="pdf-form-group flex-1">
                  <label className="pdf-form-label">Ngày ghi trên con dấu:</label>
                  <input
                    className="pdf-form-input"
                    type="text"
                    value={stampDate}
                    onChange={(e) => setStampDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              <label className="pdf-form-label mt-3">Chọn mẫu con dấu doanh nghiệp:</label>
              <div className="pdf-stamps-grid">
                {OFFICE_STAMPS.map((s) => {
                  const isSel = selectedStamp.id === s.id
                  return (
                    <div
                      key={s.id}
                      className={`pdf-stamp-card ${isSel ? 'active' : ''}`}
                      onClick={() => setSelectedStamp(s)}
                    >
                      <div
                        className="pdf-stamp-preview-box"
                        style={{ borderColor: s.color, color: s.color }}
                      >
                        <span className="pdf-stamp-prev-title">{s.title}</span>
                        <div className="pdf-stamp-prev-div" style={{ backgroundColor: s.color }} />
                        <span className="pdf-stamp-prev-sub">{s.subtitle} • {stampDate}</span>
                      </div>
                      <span className="pdf-stamp-name">{s.title}</span>
                      {isSel && (
                        <div className="pdf-stamp-check">
                          <Check size={12} color="white" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pdf-modal-footer">
          <button className="pdf-btn pdf-btn-ghost" onClick={onClose}>
            Hủy bỏ
          </button>
          <button
            className="pdf-btn pdf-btn-primary"
            onClick={handleConfirm}
            disabled={
              (activeTab === 'draw' && !hasDrawn) ||
              (activeTab === 'upload' && !processedUpload) ||
              (activeTab === 'type' && !signerName.trim())
            }
          >
            <Check size={16} />
            <span>Chèn vào tài liệu</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
