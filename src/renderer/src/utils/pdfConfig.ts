/**
 * VietKey PDF Studio — PDF.js Configuration & Worker Initializer
 * Khởi tạo PDF.js với đầy đủ Polyfill và Worker tương thích môi trường Electron offline
 */

import './pdfPolyfills'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

// Cấu hình worker local bundle từ Vite (không phụ thuộc internet hay CDN)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
}

export { pdfjsLib }
export * from './pdfPolyfills'
export * from './pdfDocumentManager'
