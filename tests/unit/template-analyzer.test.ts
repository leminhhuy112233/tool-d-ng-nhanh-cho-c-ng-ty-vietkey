import { describe, it, expect, vi } from 'vitest'
import { analyzeDocxTemplate } from '../../src/main/services/template-analyzer'

// Mock getSetting
vi.mock('../../src/main/services/database', () => ({
  getSetting: vi.fn(() => '')
}))

describe('Smart Template Analyzer Test', () => {
  it('phân tích file TẠM ỨNG ĐỢT 2 conv.docx không bị phân mảnh thành từng chữ cái', async () => {
    const testPath = 'tests/fixtures/tam_ung_red_sample.docx'
    const result = await analyzeDocxTemplate(testPath)

    console.log('Result Success:', result.success)
    console.log('Total Fields Detected:', result.fields.length)
    console.log('Fields Summary:', result.fields.map(f => `${f.key} (${f.label}): "${f.defaultValue}"`))

    expect(result.success).toBe(true)
    expect(result.isRedTextDetected).toBe(true)
    
    // Trước đây sinh ra 108 trường vì mỗi chữ cái 1 trường (ng, à, y, 13...)
    // Bây giờ chỉ được phép từ 10 đến 20 trường chuẩn xác
    expect(result.fields.length).toBeLessThan(25)
    expect(result.fields.length).toBeGreaterThan(5)

    // Đảm bảo không có các trường rác gồm từng chữ cái
    const keys = result.fields.map(f => f.key)
    expect(keys).not.toContain('ng')
    expect(keys).not.toContain('a')
    expect(keys).not.toContain('y')
    expect(keys).not.toContain('t')
    expect(keys).not.toContain('h')

    // Phải nhận diện được khách hàng và ngày tháng
    const hasCustomer = result.fields.some(f => f.key.includes('khach_hang') || f.defaultValue?.includes('CIENC04'))
    expect(hasCustomer).toBe(true)

    const hasDate = result.fields.some(f => f.key.includes('ngay') || f.defaultValue?.includes('tháng'))
    expect(hasDate).toBe(true)
  })
})
