/**
 * EditorObjects — Định nghĩa hệ thống đối tượng biên tập trong VietKey PDF Studio
 * Toàn bộ tọa độ gốc (x, y, width, height) LUÔN LUÔN được lưu theo chuẩn PDF Points (1/72 inch)
 * với gốc tọa độ ở góc trên-trái (Top-Left Origin), độc lập hoàn toàn với Zoom và độ phân giải màn hình.
 */

export type EditorObjectType =
  | 'text'
  | 'image'
  | 'shape'
  | 'drawing'
  | 'highlight'
  | 'signature'
  | 'whiteout'
  | 'note'

export interface BaseEditorObject {
  id: string
  pageId?: string // Định danh duy nhất của trang, không đổi khi xoay/xóa/đảo trang
  pageIndex: number
  type: EditorObjectType
  // Tọa độ chuẩn PDF Points (1/72 inch)
  x: number
  y: number
  width: number
  height: number
  rotation?: number // Góc xoay độ (0-360)
  opacity?: number // Độ trong suốt (0-1)
  label?: string // Tên nhãn hiển thị trên Contextual Toolbar
  zIndex?: number // Thứ tự lớp hiển thị
  locked?: boolean // Khóa đối tượng
  createdAt: number
  updatedAt?: number
}

// 1. Văn bản (Text Object)
export interface TextEditorObject extends BaseEditorObject {
  type: 'text'
  text: string
  fontSize: number // Cỡ chữ tính theo PDF Points (mặc định 14 pt)
  fontFamily: string
  color: string // Mã màu hex hoặc rgb
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: 'left' | 'center' | 'right'
  lineHeight?: number
}

// 2. Hình ảnh (Image Object)
export interface ImageEditorObject extends BaseEditorObject {
  type: 'image'
  assetId?: string
  src: string // DataURL hoặc Blob URL an toàn
  status: 'loading' | 'loaded' | 'error'
  errorMessage?: string
  aspectRatio?: number
  naturalWidth?: number
  naturalHeight?: number
}

// 3. Hình khối (Shape Object - Vector SVG thuần túy)
export type ShapeType = 'rect' | 'circle' | 'arrow' | 'line'

export interface ShapeEditorObject extends BaseEditorObject {
  type: 'shape'
  shapeType: ShapeType
  strokeColor: string
  strokeWidth: number // Độ dày viền theo PDF Points
  fillColor: string // Màu nền (mã hex hoặc rgba)
  strokeStyle?: 'solid' | 'dashed'
}

// 4. Hình vẽ tay tự do (Drawing Object)
export interface DrawingEditorObject extends BaseEditorObject {
  type: 'drawing'
  points: Array<{ x: number; y: number }> // Danh sách tọa độ PDF Points
  strokeColor: string
  strokeWidth: number
}

// 5. Bút dạ quang (Highlight Object)
export interface HighlightEditorObject extends BaseEditorObject {
  type: 'highlight'
  color: string // vd: rgba(254, 240, 138, 0.45)
}

// 6. Chữ ký số & Con dấu (Signature Object)
export interface SignatureEditorObject extends BaseEditorObject {
  type: 'signature'
  assetId?: string
  src: string
  signerName?: string
  signedAt?: string
}

// 7. Bút xóa & Viết đè (Whiteout Object)
export interface WhiteoutEditorObject extends BaseEditorObject {
  type: 'whiteout'
  fillColor: string // Mặc định #ffffff
  replacementText?: string
}

// 8. Ghi chú dán (Sticky Note Object)
export interface NoteEditorObject extends BaseEditorObject {
  type: 'note'
  title: string
  content: string
  color: string
}

export type EditorObject =
  | TextEditorObject
  | ImageEditorObject
  | ShapeEditorObject
  | DrawingEditorObject
  | HighlightEditorObject
  | SignatureEditorObject
  | WhiteoutEditorObject
  | NoteEditorObject
