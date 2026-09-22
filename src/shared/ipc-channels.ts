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
  TEMPLATE_DELETE: 'template:delete'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
