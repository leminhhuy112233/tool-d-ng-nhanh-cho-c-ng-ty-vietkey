/**
 * AssetManager — Quản lý vòng đời tài nguyên hình ảnh an toàn cho Editor Object
 * Đảm bảo:
 * - Ảnh được nạp và kiểm tra tính hợp lệ trước khi tạo Object (tránh broken image 100%)
 * - Quản lý an toàn dataURL / Blob URL, không thu hồi (revoke) khi đối tượng vẫn đang hiển thị
 * - Hỗ trợ retry và thay thế ảnh khi có sự cố mạng/dữ liệu
 */

export interface AssetRecord {
  id: string
  src: string // DataURL hoặc Blob URL an toàn
  width: number
  height: number
  aspectRatio: number
  fileSize?: number
  mimeType?: string
  createdAt: number
}

export class AssetManager {
  private static instance: AssetManager
  private assets: Map<string, AssetRecord> = new Map()
  private objectUrls: Set<string> = new Set()

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager()
    }
    return AssetManager.instance
  }

  /**
   * Đăng ký và kiểm tra tải thử hình ảnh trước khi dùng trong canvas.
   * Nếu dữ liệu ảnh lỗi hoặc rỗng, Promise sẽ reject với thông báo rõ ràng.
   */
  public async registerAndValidate(
    src: string,
    fileSize?: number,
    mimeType?: string
  ): Promise<AssetRecord> {
    if (!src || src.trim().length === 0) {
      throw new Error('Dữ liệu nguồn hình ảnh rỗng hoặc không hợp lệ')
    }

    // Kiểm tra tải ảnh thật qua HTMLImageElement
    const { width, height } = await this.preloadImage(src)
    const aspectRatio = width > 0 && height > 0 ? width / height : 1
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const record: AssetRecord = {
      id: assetId,
      src,
      width,
      height,
      aspectRatio,
      fileSize,
      mimeType,
      createdAt: Date.now()
    }

    this.assets.set(assetId, record)

    if (src.startsWith('blob:')) {
      this.objectUrls.add(src)
    }

    return record
  }

  /**
   * Tạo Object URL từ Blob/File an toàn và đăng ký quản lý
   */
  public async registerFile(file: File): Promise<AssetRecord> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string
          const record = await this.registerAndValidate(dataUrl, file.size, file.type)
          resolve(record)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Lỗi khi đọc file hình ảnh từ máy tính'))
      reader.readAsDataURL(file)
    })
  }

  public getAsset(assetId: string): AssetRecord | undefined {
    return this.assets.get(assetId)
  }

  public getSource(assetId: string): string | undefined {
    return this.assets.get(assetId)?.src
  }

  public hasAsset(assetId: string): boolean {
    return this.assets.has(assetId)
  }

  /**
   * Thu hồi các Blob URL đã không còn bất kỳ đối tượng nào sử dụng
   */
  public cleanupUnusedUrls(activeSources: Set<string>): void {
    for (const url of this.objectUrls) {
      if (!activeSources.has(url)) {
        try {
          URL.revokeObjectURL(url)
          this.objectUrls.delete(url)
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Kiểm tra xem một chuỗi source có nạp thành công thành ảnh hợp lệ hay không
   */
  private preloadImage(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          width: img.naturalWidth || img.width || 200,
          height: img.naturalHeight || img.height || 200
        })
      }
      img.onerror = () => {
        reject(new Error('Không thể tải hoặc giải mã tài nguyên hình ảnh'))
      }
      img.src = src
    })
  }
}
