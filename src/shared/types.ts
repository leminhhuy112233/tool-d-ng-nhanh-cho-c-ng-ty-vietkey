export type ExportFileType = 'word' | 'pdf' | 'both'

// Partner / Customer Saved Profile
export interface PartnerProfile {
  id: string
  ten_cong_ty: string
  mst: string
  dai_dien: string
  xung_danh: 'Ông' | 'Bà'
  chuc_vu: string
  dia_chi: string
  tai_khoan: string
  updatedAt: string
}

// Export History Record
export interface ExportHistoryRecord {
  id: string
  fileName: string
  filePath: string
  docType: 'contract' | 'quotation' | 'advance_request' | 'custom'
  exportType: ExportFileType
  customerName: string
  createdAt: string
  templateId?: string
  templateName?: string
  dataSnapshot?: ContractData | QuotationData | AdvanceRequestData | Record<string, any>
}

// Contract Document Data Schema
export interface ContractData {
  so_hd: string
  ngay: string
  thang: string
  nam: string
  noi_dung_mua_ban: string

  file_name: string
  export_dir: string
  export_type: ExportFileType

  bena_xung_danh: 'Ông' | 'Bà'
  bena_ten_cong_ty: string
  bena_dai_dien: string
  bena_chuc_vu: string
  bena_dia_chi: string
  bena_tai_khoan: string
  bena_mst: string

  benb_xung_danh: 'Ông' | 'Bà'
  benb_ten_cong_ty: string
  benb_dai_dien: string
  benb_chuc_vu: string
  benb_dia_chi: string
  benb_tai_khoan: string
  benb_mst: string
}

export const DEFAULT_BEN_B = {
  benb_xung_danh: 'Bà' as const,
  benb_ten_cong_ty: 'CÔNG TY TNHH ĐÀO TẠO VÀ PHÁT TRIỂN CÔNG NGHỆ VIETKEY',
  benb_dai_dien: 'NGUYỄN THỊ MINH VŨ',
  benb_chuc_vu: 'Giám đốc',
  benb_dia_chi: 'STH11.17 đường Thanh Tịnh, KĐT Lê Hồng Phong 1, phường Nam Nha Trang, tỉnh Khánh Hòa.',
  benb_tai_khoan: '183684999 Tại Ngân hàng Á Châu chi nhánh Vĩnh Phước',
  benb_mst: '4201605281'
}

// Quotation Document Data Schema
export interface QuotationItem {
  id: string
  stt: string
  ten_hang: string
  ghi_chu?: string
  don_vi: string
  don_gia: string
  phan_tram_tang?: string
  don_gia_sau_tang?: string
}

export interface QuotationData {
  ngay: string
  thang: string
  nam: string
  ten_khach_hang: string
  file_name: string
  export_dir: string
  export_type: ExportFileType
  co_ghi_chu?: boolean
  items: QuotationItem[]
}

// Advance Request Data Schema (Đề nghị tạm ứng)
export interface AdvanceRequestData {
  ngay: string
  thang: string
  nam: string
  ten_cong_ty_khach: string
  noi_dung_cung_cap: string
  dot_tam_ung: string
  gia_tri_don_hang: string
  gia_tri_tam_ung: string
  so_tien_bang_chu: string
  file_name: string
  export_dir: string
  export_type: ExportFileType
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  openaiApiKey: string
  defaultExportDir: string
  language: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  openaiApiKey: '',
  defaultExportDir: '',
  language: 'vi'
}

export interface ExportResult {
  success: boolean
  filePath?: string
  pdfPath?: string
  error?: string
}

// ===== Custom Dynamic Template Types =====
export type TemplateFieldType = 'text' | 'currency' | 'number' | 'date' | 'textarea' | 'select' | 'table'

export interface TableSubField {
  key: string
  label: string
  type: 'text' | 'number' | 'currency'
  width?: string
}

export interface TemplateField {
  id: string
  key: string
  label: string
  type: TemplateFieldType
  section?: string
  required?: boolean
  defaultValue?: string
  placeholder?: string
  options?: string[]
  subFields?: TableSubField[]
}

export interface CustomTemplateDef {
  id: string
  name: string
  description?: string
  fileName: string
  docxFilePath: string
  createdAt: string
  updatedAt: string
  fields: TemplateField[]
  isFromRedHighlight?: boolean
  category?: string
}

export interface AnalyzedTemplateResult {
  success: boolean
  error?: string
  templateName: string
  fields: TemplateField[]
  isRedTextDetected: boolean
  redFieldCount: number
  normalTagCount: number
  hasTable: boolean
  processedDocxBase64?: string
}

export interface ElectronAPI {
  // Settings
  getSetting: (key: string) => Promise<string | null>
  setSetting: (key: string, value: string) => Promise<void>
  getAllSettings: () => Promise<Record<string, string>>

  // Theme
  getTheme: () => Promise<string>
  setTheme: (theme: string) => Promise<void>

  // Window controls
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  toggleMiniMode: () => Promise<boolean>
  isMaximized: () => Promise<boolean>

  // File & Folder opening
  openPath: (path: string) => Promise<void>
  showItemInFolder: (path: string) => Promise<void>

  // File dialogs
  openFileDialog: (filters?: { name: string; extensions: string[] }[]) => Promise<string | null>
  openDirectoryDialog: () => Promise<string | null>
  saveFileDialog: (defaultName: string, filters?: { name: string; extensions: string[] }[]) => Promise<string | null>

  // Partner Memory Store
  getPartners: () => Promise<PartnerProfile[]>
  savePartner: (partner: Omit<PartnerProfile, 'id' | 'updatedAt'>) => Promise<void>

  // Export History
  getHistory: () => Promise<ExportHistoryRecord[]>
  addHistoryRecord: (record: Omit<ExportHistoryRecord, 'id' | 'createdAt'>) => Promise<void>
  deleteHistoryRecord: (id: string) => Promise<void>
  clearHistory: () => Promise<void>

  // Document Exports
  exportContract: (data: ContractData, targetPath: string) => Promise<ExportResult>
  exportQuotation: (data: QuotationData, targetPath: string) => Promise<ExportResult>
  exportAdvanceRequest: (data: AdvanceRequestData, targetPath: string) => Promise<ExportResult>

  // AI Assistant Parsing
  parseTextWithAI: (rawText: string) => Promise<Partial<ContractData>>
  parseQuotationTextWithAI: (rawText: string) => Promise<Partial<QuotationData>>
  parseAdvanceRequestWithAI: (rawText: string) => Promise<Partial<AdvanceRequestData>>

  // Template management
  openTemplatesFolder: () => Promise<void>
  openTemplateFile: (fileName: string) => Promise<void>

  // Custom Dynamic Template Management (MỚI)
  analyzeTemplate: (filePath: string) => Promise<AnalyzedTemplateResult>
  getCustomTemplates: () => Promise<CustomTemplateDef[]>
  saveCustomTemplate: (
    template: Omit<CustomTemplateDef, 'id' | 'createdAt' | 'updatedAt'>,
    processedDocxBase64?: string
  ) => Promise<{ success: boolean; template?: CustomTemplateDef; error?: string }>
  deleteCustomTemplate: (id: string) => Promise<{ success: boolean; error?: string }>
  getCustomTemplateById: (id: string) => Promise<CustomTemplateDef | null>
  exportCustomDocument: (
    templateId: string,
    data: Record<string, any>,
    targetPath: string,
    exportType?: ExportFileType
  ) => Promise<ExportResult>

  // App info
  getAppVersion: () => string
}

declare global {
  interface Window {
    api?: ElectronAPI
  }
}
