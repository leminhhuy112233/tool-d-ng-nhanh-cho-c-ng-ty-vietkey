/**
 * imageResizeHelper — Tối ưu hóa dung lượng hình ảnh trước khi chèn vào PDF
 * Tự động thu nhỏ ảnh khổng lồ (4K/8K, 20-50MB) về kích thước hiển thị thực tế (max 1600px)
 * Tiết kiệm đến 90% dung lượng RAM và ngăn ngừa hiện tượng crash bộ nhớ GPU.
 */

export interface ResizeImageOptions {
  maxDimension?: number
  quality?: number
  mimeType?: 'image/jpeg' | 'image/png'
}

export async function resizeImageBeforeInsert(
  dataUrlOrFile: string | File,
  options: ResizeImageOptions = {}
): Promise<{ dataUrl: string; width: number; height: number; originalSize: number; newSize: number }> {
  const maxDim = options.maxDimension || 1600
  const quality = options.quality !== undefined ? options.quality : 0.9
  const mimeType = options.mimeType || 'image/png'

  let src = ''
  let originalSize = 0

  if (typeof dataUrlOrFile === 'string') {
    src = dataUrlOrFile
    originalSize = Math.round((dataUrlOrFile.length * 3) / 4)
  } else {
    originalSize = dataUrlOrFile.size
    src = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(dataUrlOrFile)
    })
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // Nếu ảnh đã nhỏ hơn maxDimension: giữ nguyên
      if (width <= maxDim && height <= maxDim) {
        resolve({
          dataUrl: src,
          width,
          height,
          originalSize,
          newSize: originalSize
        })
        return
      }

      // Tính toán tỉ lệ co dãn giữ nguyên aspect ratio
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve({ dataUrl: src, width: img.width, height: img.height, originalSize, newSize: originalSize })
        return
      }

      // Khử răng cưa chất lượng cao
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      const resizedDataUrl = canvas.toDataURL(mimeType, quality)
      const newSize = Math.round((resizedDataUrl.length * 3) / 4)

      // Dọn dẹp canvas ngay lập tức
      canvas.width = 1
      canvas.height = 1

      resolve({
        dataUrl: resizedDataUrl,
        width,
        height,
        originalSize,
        newSize
      })
    }

    img.onerror = (err) => reject(err)
    img.src = src
  })
}
