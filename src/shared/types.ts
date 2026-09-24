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

// Advance Request Item Schema
export interface AdvanceRequestItem {
  id: string
  stt: number
  ten_vat_tu: string
  don_vi: string
  so_luong: string
  don_gia: string
  thanh_tien: string
  ghi_chu?: string
}

// Advance Request Data Schema (Đề nghị tạm ứng)
export interface AdvanceRequestData {
  ngay: string
  thang: string
  nam: string
  ten_cong_ty_khach: string
  noi_dung_cung_cap: string
  dot_tam_ung: string
  ngay_don_hang?: string
  thang_don_hang?: string
  nam_don_hang?: string
  items?: AdvanceRequestItem[]
  dieu_kien_thanh_toan?: string
  tong_tien?: string
  gia_tri_don_hang?: string
  gia_tri_tam_ung?: string
  so_tien_bang_chu: string
  file_name: string
  export_dir?: string
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

export interface TemplateVersion {
  version: number
  versionName?: string
  changeNote?: string
  docxFilePath: string
  fileName: string
  fields: TemplateField[]
  createdAt: string
  fileSize?: string
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
  currentVersion?: number
  versions?: TemplateVersion[]
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

// ===== PDF Tools Types =====
export interface PdfPageInfo {
  id?: string
  index: number
  width: number
  height: number
  rotation: number
}

export interface PdfOpenResult {
  filePath?: string
  fileName?: string
  base64?: string
  pageCount?: number
  pages?: PdfPageInfo[]
  error?: string
}

export interface PdfOperationResult {
  base64?: string
  pageCount?: number
  pages?: PdfPageInfo[]
  error?: string
  success?: boolean
  canceled?: boolean
  filePath?: string
  outputPaths?: string[]
  mergedFiles?: string[]
}

export interface PdfAnnotationData {
  type: 'image' | 'text' | 'shape' | 'highlight'
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  // For image
  imageBase64?: string
  imageType?: 'png' | 'jpg'
  // For text
  text?: string
  fontSize?: number
  color?: { r: number; g: number; b: number } | string
  fontFamily?: string
  fontWeight?: string
  // For shape
  shapeType?: 'rect' | 'circle' | 'arrow' | 'line'
  strokeColor?: string
  strokeWidth?: number
  fillColor?: string
  opacity?: number
}

export interface PdfWatermarkOptions {
  text: string
  opacity?: number
  fontSize?: number
  color?: { r: number; g: number; b: number }
  rotationDegrees?: number
  pageIndices?: number[]
}

export interface PdfSplitRange {
  start: number
  end: number
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
  saveFileDialog: (defaultName?: string, filters?: { name: string; extensions: string[] }[]) => Promise<string | null>

  // Partner Memory Store
  getPartners: () => Promise<any[]>
  savePartner: (profile: any) => Promise<any>

  // Export History
  getHistory: () => Promise<any[]>
  addHistoryRecord: (record: any) => Promise<any>
  deleteHistoryRecord: (id: string) => Promise<boolean>
  clearHistory: () => Promise<boolean>

  // Document Exports
  exportContract: (data: ContractData, targetPath: string) => Promise<ExportResult>
  exportQuotation: (data: QuotationData, targetPath: string) => Promise<ExportResult>
  exportAdvanceRequest: (data: AdvanceRequestData, targetPath: string) => Promise<ExportResult>

  // AI Assistant Parsing
  parseTextWithAI: (rawText: string) => Promise<Partial<ContractData>>
  parseQuotationTextWithAI: (rawText: string) => Promise<Partial<QuotationData>>
  parseAdvanceRequestWithAI: (rawText: string) => Promise<Partial<AdvanceRequestData>>

  // Template management
  openTemplatesFolder: () => Promise<string[]>
  openTemplateFile: (fileName: string) => Promise<string>

  // Custom Dynamic Template Management (MỚI)
  analyzeTemplate: (filePath: string) => Promise<AnalyzedTemplateResult>
  getCustomTemplates: () => Promise<CustomTemplateDef[]>
  saveCustomTemplate: (
    template: Omit<CustomTemplateDef, 'id' | 'createdAt' | 'updatedAt'>,
    processedDocxBase64?: string
  ) => Promise<{ success: boolean; template?: CustomTemplateDef; error?: string }>
  deleteCustomTemplate: (id: string) => Promise<{ success: boolean; error?: string }>
  getCustomTemplateById: (id: string) => Promise<CustomTemplateDef | null>
  updateCustomTemplate: (
    id: string,
    templateData: Partial<CustomTemplateDef>,
    processedDocxBase64?: string,
    changeNote?: string
  ) => Promise<{ success: boolean; template?: CustomTemplateDef; error?: string }>
  getTemplateVersions: (id: string) => Promise<TemplateVersion[]>
  rollbackCustomTemplateVersion: (
    id: string,
    targetVersion: number
  ) => Promise<{ success: boolean; template?: CustomTemplateDef; error?: string }>
  exportCustomDocument: (
    templateId: string,
    data: Record<string, any>,
    targetPath: string,
    exportType?: ExportFileType
  ) => Promise<ExportResult>
  renderPreviewDocx: (
    type: 'quotation' | 'contract' | 'advance' | 'custom',
    data: any,
    customTemplateId?: string
  ) => Promise<{ success: boolean; docxBase64?: string; error?: string }>

  // App info
  getAppVersion: () => string

  // PDF Tools
  pdfOpenFile: () => Promise<PdfOpenResult | null>
  pdfReadFile: (filePath: string) => Promise<PdfOpenResult>
  pdfSaveFile: (pdfBase64: string, suggestedName?: string) => Promise<PdfOperationResult>
  pdfDeletePages: (pdfBase64: string, pageIndices: number[]) => Promise<PdfOperationResult>
  pdfRotatePages: (pdfBase64: string, pageIndices: number[], angleDegrees: number) => Promise<PdfOperationResult>
  pdfReorderPages: (pdfBase64: string, newOrder: number[]) => Promise<PdfOperationResult>
  pdfDuplicatePages: (pdfBase64: string, pageIndices: number[]) => Promise<PdfOperationResult>
  pdfExtractPages: (pdfBase64: string, pageIndices: number[]) => Promise<PdfOperationResult>
  pdfSplit: (pdfBase64: string, ranges: PdfSplitRange[]) => Promise<PdfOperationResult>
  pdfMerge: () => Promise<PdfOperationResult>
  pdfFlattenAnnotations: (pdfBase64: string, annotations: PdfAnnotationData[]) => Promise<PdfOperationResult>
  pdfAddWatermark: (pdfBase64: string, options: PdfWatermarkOptions) => Promise<PdfOperationResult>
  pdfImagesToPdf: (images: { base64: string; type?: 'png' | 'jpg' }[]) => Promise<PdfOperationResult>
  pdfAddBlankPage: (
    pdfBase64: string,
    position: 'before' | 'after' | 'end',
    targetIndex: number
  ) => Promise<PdfOperationResult>
  pdfImportPages: (
    targetBase64: string,
    sourceBytesArr: number[],
    position: 'before' | 'after' | 'end',
    targetIndex: number,
    pageIndices?: number[]
  ) => Promise<PdfOperationResult>
  pdfCompress: (
    pdfBase64: string,
    level: 'low' | 'medium' | 'high'
  ) => Promise<PdfOperationResult & { newSizeBytes?: number }>
  pdfUpdateMetadata: (pdfBase64: string, metadata: any) => Promise<PdfOperationResult>

  // Local Storage Hub & Data Protection Layer
  storageGetInfo: () => Promise<StorageHubInfo>
  storageSetPath: (newPath: string) => Promise<{ success: boolean; path?: string; error?: string }>
  storageOpenExplorer: (subfolder?: string) => Promise<boolean>
  storageCreateBackup: () => Promise<{ success: boolean; backupPath?: string; error?: string }>
  storageCleanupTemp: () => Promise<{ success: boolean; freedBytesFormatted?: string }>
  storageGetHealth: () => Promise<DataHealthReport>
  storageRestoreBackup: (backupPath?: string) => Promise<{ success: boolean; restoredRecords?: number; error?: string }>
  storageExportBackup: (targetDir?: string) => Promise<{ success: boolean; exportPath?: string; error?: string }>
}

export interface DataHealthReport {
  status: 'healthy' | 'warning' | 'error'
  schemaVersion: number
  database: {
    ok: boolean
    message: string
    path: string
    sizeFormatted: string
    partnerCount: number
    historyCount: number
    customTemplateCount: number
  }
  directories: {
    ok: boolean
    hubPath: string
    missingDirs: string[]
  }
  backup: {
    ok: boolean
    backupCount: number
    latestBackupDate?: string
    latestBackupPath?: string
  }
  checkedAt: string
}

export interface StorageHubInfo {
  dataHubPath: string
  databasePath: string
  documentsPath: string
  templatesPath: string
  backupsPath: string
  cachePath: string
  tempPath: string
  recoveryPath: string
  metadataPath: string
  totalSizeFormatted: string
  documentCount: number
  backupCount: number
  schemaVersion: number
  healthStatus: 'healthy' | 'warning' | 'error'
}

declare global {
  interface Window {
    api?: ElectronAPI
  }
}

