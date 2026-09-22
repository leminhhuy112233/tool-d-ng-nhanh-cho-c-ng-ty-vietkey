import { exec } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import path from 'path'

/**
 * Checks if a PDF file exists and is locked by a PDF reader (e.g. Foxit Reader / Adobe Acrobat).
 * If locked, generates a clean available fallback path (e.g. filename_1.pdf) so export never fails!
 */
function resolveAvailablePdfPath(targetPdfPath: string): { finalPdfPath: string; wasLocked: boolean } {
  if (!existsSync(targetPdfPath)) {
    return { finalPdfPath: targetPdfPath, wasLocked: false }
  }

  try {
    unlinkSync(targetPdfPath)
    return { finalPdfPath: targetPdfPath, wasLocked: false }
  } catch (err: any) {
    if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
      const dir = path.dirname(targetPdfPath)
      const ext = path.extname(targetPdfPath)
      const base = path.basename(targetPdfPath, ext)

      let counter = 1
      let candidate = path.join(dir, `${base}_${counter}${ext}`)
      while (existsSync(candidate)) {
        try {
          unlinkSync(candidate)
          break
        } catch (_) {
          counter++
          candidate = path.join(dir, `${base}_${counter}${ext}`)
        }
      }
      return { finalPdfPath: candidate, wasLocked: true }
    }
    return { finalPdfPath: targetPdfPath, wasLocked: false }
  }
}

/**
 * Converts a DOCX file to PDF using Word COM via PowerShell Base64 & Environment Variables
 * (Preserves Vietnamese UTF-8 paths like DỰ ÁN 2026 cleanly without encoding corruption)
 */
export function convertDocxToPdf(
  docxPath: string,
  pdfPath: string
): Promise<{ success: boolean; pdfPath?: string; error?: string; warning?: string }> {
  return new Promise((resolve) => {
    try {
      if (!existsSync(docxPath)) {
        return resolve({
          success: false,
          error: `Không tìm thấy file Word tại: ${docxPath}`
        })
      }

      // Check if original PDF path is locked by Foxit Reader / Acrobat, and resolve available path
      const { finalPdfPath, wasLocked } = resolveAvailablePdfPath(pdfPath)

      // PowerShell script using Environment Variables to preserve all Vietnamese UTF-8 paths cleanly
      const psScript = `
$docx = $env:DOCX_INPUT
$pdf = $env:PDF_OUTPUT

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.AutomationSecurity = 3

try {
  $doc = $word.Documents.Open($docx, $false, $true)
  if ($doc) {
    try {
      $doc.ExportAsFixedFormat($pdf, 17)
    } catch {
      $doc.SaveAs2($pdf, 17)
    }
    $doc.Close(0)
  }
} finally {
  $word.Quit()
}
`

      const encodedPs = Buffer.from(psScript, 'utf16le').toString('base64')

      const env = {
        ...process.env,
        DOCX_INPUT: docxPath,
        PDF_OUTPUT: finalPdfPath
      }

      exec(
        `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand "${encodedPs}"`,
        { env, timeout: 35000 },
        (error, _stdout, stderr) => {
          if (existsSync(finalPdfPath)) {
            const warningMsg = wasLocked
              ? 'Lưu ý: File PDF gốc đang được mở trong phần mềm đọc PDF (Foxit/Acrobat), hệ thống đã tự động lưu thành file mới.'
              : undefined
            resolve({ success: true, pdfPath: finalPdfPath, warning: warningMsg })
          } else {
            const errDetail = stderr || error?.message || 'Lỗi không xác định.'
            console.error('Lỗi chuyển đổi PDF PowerShell:', errDetail)
            resolve({
              success: false,
              error:
                'Không thể xuất file PDF. Vui lòng đóng phần mềm đọc PDF (Foxit Reader) hoặc chọn tên file mới rồi thử lại.'
            })
          }
        }
      )
    } catch (err: any) {
      resolve({ success: false, error: err.message || 'Lỗi khi xuất file PDF.' })
    }
  })
}
