/**
 * Polyfills cho PDF.js v6 và các API JavaScript hiện đại
 * Giúp tương thích hoàn toàn với Chromium/Electron khi chạy offline
 */

// 1. Uint8Array.prototype.toHex (ECMAScript Stage 4)
if (!Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function (): string {
    let hex = ''
    for (let i = 0; i < this.length; i++) {
      hex += this[i].toString(16).padStart(2, '0')
    }
    return hex
  }
}

// 2. Uint8Array.prototype.setFromHex
if (!Uint8Array.prototype.setFromHex) {
  Uint8Array.prototype.setFromHex = function (hex: string) {
    const clean = hex.replace(/\s+/g, '')
    const pairs = clean.match(/.{1,2}/g) || []
    const count = Math.min(pairs.length, this.length)
    for (let i = 0; i < count; i++) {
      this[i] = parseInt(pairs[i], 16) || 0
    }
    return { read: count * 2, written: count }
  }
}

// 3. Promise.withResolvers
if (typeof (Promise as any).withResolvers !== 'function') {
  ;(Promise as any).withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void
    let reject!: (reason?: any) => void
    const promise = new Promise<T>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

/**
 * Bảng tra cứu Base64 (Lookup Table - LUT) giúp giải mã cực nhanh không qua atob chuỗi trung gian
 */
const b64Lookup = new Uint8Array(256)
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (let i = 0; i < chars.length; i++) {
  b64Lookup[chars.charCodeAt(i)] = i
}

/**
 * Chuyển chuỗi Base64 sang Uint8Array với hiệu năng cao, hỗ trợ cả Data URI prefix
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const commaIdx = base64.indexOf(',')
  const str = commaIdx >= 0 ? base64.slice(commaIdx + 1) : base64
  const len = str.length
  if (len === 0) return new Uint8Array(0)

  let padding = 0
  if (str.endsWith('==')) padding = 2
  else if (str.endsWith('=')) padding = 1

  const byteLength = Math.floor((len * 3) / 4) - padding
  const bytes = new Uint8Array(byteLength)

  let p = 0
  const mainLen = padding > 0 ? len - 4 : len

  for (let i = 0; i < mainLen; i += 4) {
    const e1 = b64Lookup[str.charCodeAt(i)]
    const e2 = b64Lookup[str.charCodeAt(i + 1)]
    const e3 = b64Lookup[str.charCodeAt(i + 2)]
    const e4 = b64Lookup[str.charCodeAt(i + 3)]

    bytes[p++] = (e1 << 2) | (e2 >> 4)
    bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2)
    bytes[p++] = ((e3 & 3) << 6) | e4
  }

  if (padding === 2) {
    const e1 = b64Lookup[str.charCodeAt(len - 4)]
    const e2 = b64Lookup[str.charCodeAt(len - 3)]
    bytes[p++] = (e1 << 2) | (e2 >> 4)
  } else if (padding === 1) {
    const e1 = b64Lookup[str.charCodeAt(len - 4)]
    const e2 = b64Lookup[str.charCodeAt(len - 3)]
    const e3 = b64Lookup[str.charCodeAt(len - 2)]
    bytes[p++] = (e1 << 2) | (e2 >> 4)
    bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2)
  }

  return bytes
}
