const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');
const Docxtemplater = require('docxtemplater');

const srcTemplate = path.join(__dirname, '..', 'templates', 'BaoGia.docx');
const outTemplate = path.join(__dirname, '..', 'templates', 'BaoGia_CoGhiChu.docx');

const content = fs.readFileSync(srcTemplate, 'binary');
const zip = new PizZip(content);
let xml = zip.file('word/document.xml').asText();

// 1. Update Grid to 5 columns
// STT: 800, TenHang: 3600, GhiChu: 2000, DonVi: 1122, DonGia: 2400 (Total: 9922 dxa)
const oldGrid = '<w:tblGrid><w:gridCol w:w="1417"/><w:gridCol w:w="4678"/><w:gridCol w:w="1417"/><w:gridCol w:w="2410"/></w:tblGrid>';
const newGrid = '<w:tblGrid><w:gridCol w:w="800"/><w:gridCol w:w="3600"/><w:gridCol w:w="2000"/><w:gridCol w:w="1122"/><w:gridCol w:w="2400"/></w:tblGrid>';
xml = xml.replace(oldGrid, newGrid);

// 2. Header row modifications
// STT width
xml = xml.replace('<w:tcPr><w:tcW w:w="1417" w:type="dxa"/>', '<w:tcPr><w:tcW w:w="800" w:type="dxa"/>');

// After TÊN HÀNG HÓA, add GHI CHÚ cell
const oldTenHangCell = '<w:tcW w:w="4678" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="1B365D" w:fill="1B365D"/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="002735B6" w:rsidRPr="00443524" w:rsidRDefault="002735B6" w:rsidP="002735B6"><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>TÊN HÀNG HÓA</w:t></w:r></w:p></w:tc>';

const ghiChuHeaderCell = '<w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="1B365D" w:fill="1B365D"/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="002735B6" w:rsidRPr="00443524" w:rsidRDefault="002735B6" w:rsidP="002735B6"><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>GHI CHÚ</w:t></w:r></w:p></w:tc>';

const newTenHangCell = '<w:tcW w:w="3600" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="1B365D" w:fill="1B365D"/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="002735B6" w:rsidRPr="00443524" w:rsidRDefault="002735B6" w:rsidP="002735B6"><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>TÊN HÀNG HÓA</w:t></w:r></w:p></w:tc>' + ghiChuHeaderCell;

xml = xml.replace(oldTenHangCell, newTenHangCell);

// Header Don vi & Don gia widths
xml = xml.replace('<w:tcPr><w:tcW w:w="1417" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="1B365D" w:fill="1B365D"/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="002735B6" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="002735B6"><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>Đơn vị</w:t>', '<w:tcPr><w:tcW w:w="1122" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="1B365D" w:fill="1B365D"/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="002735B6" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="002735B6"><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:b/><w:bCs/><w:color w:val="FFFFFF"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>Đơn vị</w:t>');

xml = xml.replace('<w:tcPr><w:tcW w:w="2410" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="1B365D" w:fill="1B365D"/>', '<w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="nil"/></w:tcBorders><w:shd w:val="clear" w:color="1B365D" w:fill="1B365D"/>');

// 3. Data row modifications
// STT width
xml = xml.replace('<w:tcW w:w="1417" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="00F755CC"><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>{#items}{stt}</w:t>', '<w:tcW w:w="800" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="00F755CC"><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>{#items}{stt}</w:t>');

// After {ten_hang}, add {ghi_chu} cell
const oldDataTenHangCell = '<w:tcW w:w="4678" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="00F755CC"><w:pPr><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>{ten_hang}</w:t></w:r><w:r w:rsidR="008A3DC8"><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t></w:t></w:r></w:p></w:tc>';

const dataGhiChuCell = '<w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="00F755CC"><w:pPr><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>{ghi_chu}</w:t></w:r></w:p></w:tc>';

const newDataTenHangCell = '<w:tcW w:w="3600" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="00F755CC"><w:pPr><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr></w:pPr><w:r w:rsidRPr="00443524"><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t>{ten_hang}</w:t></w:r><w:r w:rsidR="008A3DC8"><w:rPr><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:eastAsia="en-US"/></w:rPr><w:t></w:t></w:r></w:p></w:tc>' + dataGhiChuCell;

xml = xml.replace(oldDataTenHangCell, newDataTenHangCell);

// Don vi & Don gia data widths
xml = xml.replace('<w:tcW w:w="1417" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="008A3DC8"><w:pPr><w:jc w:val="center"/>', '<w:tcW w:w="1122" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/><w:hideMark/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="00F755CC" w:rsidP="008A3DC8"><w:pPr><w:jc w:val="center"/>');

xml = xml.replace('<w:tcW w:w="2410" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="000E128A"', '<w:tcW w:w="2400" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tcBorders><w:noWrap/><w:vAlign w:val="center"/></w:tcPr><w:p w:rsidR="00F755CC" w:rsidRPr="00443524" w:rsidRDefault="000E128A"');

zip.file('word/document.xml', xml);
const outBuf = zip.generate({ type: 'nodebuffer' });
fs.writeFileSync(outTemplate, outBuf);
console.log('SUCCESS: Generated templates/BaoGia_CoGhiChu.docx!');

// Test render with docxtemplater
const testZip = new PizZip(outBuf);
const doc = new Docxtemplater(testZip, { paragraphLoop: true, linebreaks: true });
doc.render({
  ngay: '22',
  thang: '09',
  nam: '2026',
  ten_khach_hang: 'BỆNH VIỆN YHCT KHÁNH HÒA',
  items: [
    { stt: '01', ten_hang: 'Gạch không nung 40x80x180', ghi_chu: 'Giao tại công trình', don_vi: 'Viên', don_gia: '1.608' },
    { stt: '02', ten_hang: 'Gạch không nung 80x80x180', ghi_chu: 'Tiêu chuẩn TCVN', don_vi: 'Viên', don_gia: '2.308' }
  ]
});
const testOut = path.join(__dirname, '..', 'templates', 'test_baogia_ghichu.docx');
fs.writeFileSync(testOut, doc.getZip().generate({ type: 'nodebuffer' }));
console.log('TEST RENDER BAOGIA CO GHI CHU SUCCESSFUL!');
