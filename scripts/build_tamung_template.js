const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')
const fs = require('fs')
const path = require('path')

const templateFile = path.join(__dirname, '..', 'templates', 'DeNghiTamUng.docx')
const content = fs.readFileSync(templateFile, 'binary')
const zip = new PizZip(content)
let xml = zip.file('word/document.xml').asText()

// 1. Replace Date: ngày {ngay} tháng {thang} năm {nam}
xml = xml.replace('<w:t>20</w:t>', '<w:t>{ngay}</w:t>')
xml = xml.replace('<w:t>07</w:t>', '<w:t>{thang}</w:t>')
xml = xml.replace('<w:t>2026</w:t>', '<w:t>{nam}</w:t>')

// 2. Kính gửi: {ten_cong_ty_khach} (Must preserve bold + italic)
// In original file, the company name was split across runs
const originalCompText1 = 'CÔNG TY CỔ PHẦN '
const originalCompText2 = 'PHÁT TRIỂN ĐẦU TƯ XÂY DỰNG VIỆT NAM'

xml = xml.replace(originalCompText1, '{ten_cong_ty_khach}')
xml = xml.replace(originalCompText2, '')

// Body text occurrences of client company name
const bodyCompPart1 = 'Công ty Cổ phần '
const bodyCompPart2 = 'Phát triển '
const bodyCompPart3 = 'đầu tư xây dựng '
const bodyCompPart4 = 'Việt Nam'

// First body occurrence
xml = xml.replace(bodyCompPart1, '{ten_cong_ty_khach}')
xml = xml.replace(bodyCompPart2, '')
xml = xml.replace(bodyCompPart3, '')
xml = xml.replace(bodyCompPart4, '')

// Second body occurrence
xml = xml.replace(bodyCompPart1, '{ten_cong_ty_khach}')
xml = xml.replace(bodyCompPart2, '')
xml = xml.replace(bodyCompPart3, '')
xml = xml.replace(bodyCompPart4, '')

// 3. Nội dung cung cấp: VLXD
xml = xml.replace('VLXD', '{noi_dung_cung_cap}')

// 4. Giá trị đơn hàng: 1.180.000.000
xml = xml.replace('<w:t>1</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>180</w:t>', '<w:t>{gia_tri_don_hang}</w:t>')

// 5. Giá trị tạm ứng đợt 1: {dot_tam_ung} & {gia_tri_tam_ung}
xml = xml.replace('đợt 1', 'đợt {dot_tam_ung}')
xml = xml.replace('<w:t>18</w:t>', '<w:t>{gia_tri_tam_ung}</w:t>')

// 6. Bằng chữ
xml = xml.replace('Một tỉ ', '{so_tien_bang_chu}')
xml = xml.replace('một trăm tám mươi ', '')
xml = xml.replace('triệu đồng./.', 'đồng./.')

zip.file('word/document.xml', xml)
const buffer = zip.generate({ type: 'nodebuffer' })
fs.writeFileSync(templateFile, buffer)

console.log('Advance Request (DeNghiTamUng) template created successfully!')

// ===== TEST RENDER WITH DOCXTEMPLATER =====
const zipTest = new PizZip(buffer)
const doc = new Docxtemplater(zipTest, { paragraphLoop: true, linebreaks: true })

const testData = {
  ngay: '30',
  thang: '07',
  nam: '2026',
  ten_cong_ty_khach: 'CÔNG TY CP TẬP ĐOÀN XUÂN PHÚC',
  noi_dung_cung_cap: 'VLXD và bê tông nhựa',
  dot_tam_ung: '1',
  gia_tri_don_hang: '1.824.000.000',
  gia_tri_tam_ung: '1.824.000.000',
  so_tien_bang_chu: 'Một tỷ tám trăm hai mươi tư triệu'
}

doc.render(testData)
const testOut = path.join(__dirname, '..', 'templates', 'test_tamung_render.docx')
fs.writeFileSync(testOut, doc.getZip().generate({ type: 'nodebuffer' }))
console.log('TEST DE NGHI TAM UNG RENDER SUCCESSFUL! Saved to:', testOut)
