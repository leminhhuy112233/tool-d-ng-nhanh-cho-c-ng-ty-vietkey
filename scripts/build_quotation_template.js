const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')
const fs = require('fs')
const path = require('path')

// Re-convert fresh template from BaoGiaMau.doc
const { execSync } = require('child_process')
execSync('cscript //nologo scripts\\convert_baogia.vbs')

const templateFile = path.join(__dirname, '..', 'templates', 'BaoGia.docx')
const content = fs.readFileSync(templateFile, 'binary')
const zip = new PizZip(content)
let xml = zip.file('word/document.xml').asText()

// 1. Date: Khánh Hòa, ngày {ngay} tháng {thang} năm {nam}
xml = xml.replace('<w:t>1</w:t>', '<w:t>{ngay}</w:t>')
xml = xml.replace('<w:t>3</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>7</w:t>', '<w:t>{thang}</w:t>')
xml = xml.replace('<w:t>2026</w:t>', '<w:t>{nam}</w:t>')

// 2. Kính gửi: {ten_khach_hang}
xml = xml.replace('Qúy khách hàng!', '{ten_khach_hang}')
xml = xml.replace('Quý khách hàng!', '{ten_khach_hang}')

// 3. Dynamic row loop on Row 1 (01 | Đá 1x2 | M3 | 580.000)
xml = xml.replace('<w:t>01</w:t>', '<w:t>{#items}{stt}</w:t>')

// Tên hàng replacement across split text runs (matching xml:space="preserve")
xml = xml.replace('<w:t xml:space="preserve">Đá </w:t>', '<w:t>{ten_hang}</w:t>')
xml = xml.replace('<w:t>Đá </w:t>', '<w:t>{ten_hang}</w:t>')
xml = xml.replace('<w:t xml:space="preserve"> 1x2</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>1x2</w:t>', '<w:t></w:t>')

// Đơn vị replacement (M3 -> {don_vi})
xml = xml.replace('<w:t>M</w:t>', '<w:t>{don_vi}</w:t>')
xml = xml.replace('<w:t>3</w:t>', '<w:t></w:t>')

// Đơn giá: 580.000
xml = xml.replace('<w:t>580.000</w:t>', '<w:t>{don_gia}{/items}</w:t>')

// 4. Remove extra sample data rows (TR 3 to TR 9)
const tblParts = xml.split('</w:tbl>')
const table1Xml = tblParts[1]
const trs = table1Xml.split('</w:tr>')

const newTrs = [trs[0], trs[1], trs[trs.length - 1]]
tblParts[1] = newTrs.join('</w:tr>')
xml = tblParts.join('</w:tbl>')

zip.file('word/document.xml', xml)
const buffer = zip.generate({ type: 'nodebuffer' })
fs.writeFileSync(templateFile, buffer)

console.log('Quotation template created with dynamic {#items} table loop!')

// ===== TEST RENDER WITH DOCXTEMPLATER =====
const zipTest = new PizZip(buffer)
const doc = new Docxtemplater(zipTest, { paragraphLoop: true, linebreaks: true })

const testData = {
  ngay: '30',
  thang: '07',
  nam: '2026',
  ten_khach_hang: 'CÔNG TY CP TẬP ĐOÀN XUÂN PHÚC',
  items: [
    { stt: '01', ten_hang: 'Đá 1x2 xanh Biên Hòa', don_vi: 'M³', don_gia: '620.000' },
    { stt: '02', ten_hang: 'Cát tô Tân Châu', don_vi: 'M³', don_gia: '450.000' },
    { stt: '03', ten_hang: 'Xi măng Hà Tiên PCB40', don_vi: 'Bao', don_gia: '92.000' },
    { stt: '04', ten_hang: 'Thép Hòa Phát CB300-V (Phi 10)', don_vi: 'Tấn', don_gia: '16.500.000' }
  ]
}

doc.render(testData)
const testOut = path.join(__dirname, '..', 'templates', 'test_baogia_render.docx')
fs.writeFileSync(testOut, doc.getZip().generate({ type: 'nodebuffer' }))
console.log('TEST BAOGIA RENDER SUCCESSFUL! Saved to:', testOut)
