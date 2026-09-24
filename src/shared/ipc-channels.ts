export const IPC_CHANNELS = {
  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',

  // Theme
  THEME_GET: 'theme:get',
  THEME_SET: 'theme:set',

  // Window controls
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_TOGGLE_MINI: 'window:toggle-mini',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // File & Shell Actions
  SHELL_OPEN_PATH: 'shell:open-path',
  SHELL_SHOW_ITEM_IN_FOLDER: 'shell:show-item-in-folder',

  // File dialogs
  DIALOG_OPEN_FILE: 'dialog:open-file',
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',
  DIALOG_SAVE_FILE: 'dialog:save-file',

  // Partner Memory Store
  PARTNER_GET_ALL: 'partner:get-all',
  PARTNER_SAVE: 'partner:save',

  // Export History
  HISTORY_GET_ALL: 'history:get-all',
  HISTORY_ADD: 'history:add',
  HISTORY_DELETE: 'history:delete',
  HISTORY_CLEAR: 'history:clear',

  // Document exports
  DOCUMENT_EXPORT_CONTRACT: 'document:export-contract',
  DOCUMENT_EXPORT_QUOTATION: 'document:export-quotation',
  DOCUMENT_EXPORT_ADVANCE_REQUEST: 'document:export-advance-request',

  // AI Parsers
  DOCUMENT_PARSE_AI: 'document:parse-ai',
  DOCUMENT_PARSE_QUOTATION_AI: 'document:parse-quotation-ai',
  DOCUMENT_PARSE_ADVANCE_REQUEST_AI: 'document:parse-advance-request-ai',

  // Template management
  TEMPLATE_LIST: 'template:list',
  TEMPLATE_GET: 'template:get',
  TEMPLATE_IMPORT: 'template:import',
  TEMPLATE_DELETE: 'template:delete',

  // Custom Dynamic Template & AI Red-Text Generator
  TEMPLATE_ANALYZE: 'template:analyze',
  TEMPLATE_CUSTOM_LIST: 'template:custom-list',
  TEMPLATE_CUSTOM_SAVE: 'template:custom-save',
  TEMPLATE_CUSTOM_UPDATE: 'template:custom-update',
  TEMPLATE_CUSTOM_VERSIONS: 'template:custom-versions',
  TEMPLATE_CUSTOM_ROLLBACK: 'template:custom-rollback',
  TEMPLATE_CUSTOM_DELETE: 'template:custom-delete',
  TEMPLATE_CUSTOM_GET: 'template:custom-get',
  DOCUMENT_EXPORT_CUSTOM: 'document:export-custom',
  DOCUMENT_RENDER_PREVIEW_DOCX: 'document:render-preview-docx',

  // PDF Tools
  PDF_OPEN_FILE: 'pdf:open-file',
  PDF_SAVE_FILE: 'pdf:save-file',
  PDF_READ_FILE: 'pdf:read-file',
  PDF_DELETE_PAGES: 'pdf:delete-pages',
  PDF_ROTATE_PAGES: 'pdf:rotate-pages',
  PDF_SPLIT: 'pdf:split',
  PDF_MERGE: 'pdf:merge',
  PDF_REORDER_PAGES: 'pdf:reorder-pages',
  PDF_DUPLICATE_PAGES: 'pdf:duplicate-pages',
  PDF_EXTRACT_PAGES: 'pdf:extract-pages',
  PDF_ADD_WATERMARK: 'pdf:add-watermark',
  PDF_FLATTEN_ANNOTATIONS: 'pdf:flatten-annotations',
  PDF_ENCRYPT: 'pdf:encrypt',
  PDF_TO_IMAGES: 'pdf:to-images',
  PDF_IMAGES_TO_PDF: 'pdf:images-to-pdf',
  PDF_ADD_BLANK_PAGE: 'pdf:add-blank-page',
  PDF_IMPORT_PAGES: 'pdf:import-pages',
  PDF_COMPRESS: 'pdf:compress',
  PDF_UPDATE_METADATA: 'pdf:update-metadata',

  // Local Storage Hub (MỚI)
  STORAGE_GET_INFO: 'storage:get-info',
  STORAGE_SET_PATH: 'storage:set-path',
  STORAGE_OPEN_EXPLORER: 'storage:open-explorer',
  STORAGE_CREATE_BACKUP: 'storage:create-backup',
  STORAGE_CLEANUP_TEMP: 'storage:cleanup-temp',
  STORAGE_GET_HEALTH: 'storage:get-health',
  STORAGE_RESTORE_BACKUP: 'storage:restore-backup',
  STORAGE_EXPORT_BACKUP: 'storage:export-backup'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
