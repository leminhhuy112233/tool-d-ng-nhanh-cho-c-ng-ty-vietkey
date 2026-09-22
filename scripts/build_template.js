const PizZip = require('pizzip')
const Docxtemplater = require('docxtemplater')
const fs = require('fs')
const path = require('path')

const templateFile = path.join(__dirname, '..', 'HĐNT MẪU.docx')
const outputFile = path.join(__dirname, '..', 'templates', 'HopDongNguyenTac.docx')

const content = fs.readFileSync(templateFile, 'binary')
const zip = new PizZip(content)
let xml = zip.file('word/document.xml').asText()

// 1. Contract Number (Clean inner text replacement only, leaving XML tags intact)
xml = xml.replace('<w:t>01</w:t>', '<w:t>{so_hd}</w:t>')
xml = xml.replace('<w:t>0</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>5</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>/2026</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>/HĐ</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>NT/</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>LH</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>-VK</w:t>', '<w:t></w:t>')

// 2. Date replacement
xml = xml.replace('<w:t>01</w:t>', '<w:t>{ngay}</w:t>')
xml = xml.replace('<w:t>0</w:t>', '<w:t></w:t>')
xml = xml.replace('<w:t>5</w:t>', '<w:t>{thang}</w:t>')
xml = xml.replace('<w:t>202</w:t>', '<w:t>{nam}</w:t>')
xml = xml.replace('<w:t>6,</w:t>', '<w:t>,</w:t>')

// 3. Xưng danh (Ông / Bà)
xml = xml.replace(' (Ông)', ' ({bena_xung_danh})')
xml = xml.replace(' (Bà)', ' ({benb_xung_danh})')

// 4. Bên A Tên công ty
xml = xml.replace('CÔNG TY TRÁCH NHIỆM HỮU HẠN XÂY DỰNG LIÊN HOA', '{bena_ten_cong_ty}')

// 5. Bên A Đại diện
xml = xml.replace('LÊ LỰC', '{bena_dai_dien}')

// 6. Bên A Chức vụ (lần 1)
xml = xml.replace('Giám đốc', '{bena_chuc_vu}')

// 7. Bên A Địa chỉ
xml = xml.replace('Thôn Đá Trắng, Xã Bác Ái Tây, Tỉnh Khánh Hòa, Việt Nam', '{bena_dia_chi}')

// 8. Bên A Tài khoản (P25 - safe insertion before closing p tag of P25)
xml = xml.replace(
  'w14:paraId="6E1979DD" w14:textId="5F48CC8C" w:rsidR="00853368" w:rsidRPr="00853368" w:rsidRDefault="00853368" w:rsidP="00853368"><w:pPr><w:spacing w:before="120"/><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:pPr>',
  'w14:paraId="6E1979DD" w14:textId="5F48CC8C" w:rsidR="00853368" w:rsidRPr="00853368" w:rsidRDefault="00853368" w:rsidP="00853368"><w:pPr><w:spacing w:before="120"/><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr><w:t>{bena_tai_khoan}</w:t></w:r>'
)

// 9. Bên A MST
xml = xml.replace('4500244347', '{bena_mst}')

// 10. Bên B Tên công ty
xml = xml.replace('CÔNG TY TNHH ĐÀO TẠO VÀ PHÁT TRIỂN CÔNG NGHỆ VIETKEY', '{benb_ten_cong_ty}')

// 11. Bên B Đại diện
xml = xml.replace('NGUYỄN THỊ MINH VŨ', '{benb_dai_dien}')

// 12. Bên B Chức vụ (lần 2)
xml = xml.replace('Giám đốc', '{benb_chuc_vu}')

// 13. Bên B Địa chỉ
xml = xml.replace('STH11.17 đường Thanh Tịnh, KĐT Lê Hồng Phong 1, phường Nam Nha Trang, tỉnh Khánh Hòa.', '{benb_dia_chi}')

// 14. Bên B Tài khoản
xml = xml.replace('183684999 Tại Ngân hàng Á Châu chi nhánh Vĩnh Phước', '{benb_tai_khoan}')

// 15. Bên B MST
xml = xml.replace('4201605281', '{benb_mst}')

// 16. Nội dung mua bán
xml = xml.replace('vật liệu xây dựng', '{noi_dung_mua_ban}')

// 17. CLEAN UP EXCESS SPACES & REMOVE TAB STOP 3825 ON BEN A & BEN B REPRESENTATIVE LINES
xml = xml.replace('<w:tabs><w:tab w:val="left" w:pos="3825"/></w:tabs>', '')
xml = xml.replace(/<w:t xml:space="preserve">\s{5,}<\/w:t>/g, '<w:t xml:space="preserve">   </w:t>')

zip.file('word/document.xml', xml)
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' })
fs.writeFileSync(outputFile, buffer)

console.log('Template HopDongNguyenTac.docx rebuilt with 100% valid XML at:', outputFile)
