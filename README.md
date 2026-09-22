# ⚡ VietKey DocGen — AI Smart Document Generator

<div align="center">

![VietKey DocGen Banner](https://img.shields.io/badge/VietKey-DocGen%20PRO-06b6d4?style=for-the-badge&logo=electron&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-VietKey%20Internal-emerald?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20Desktop-1e293b?style=for-the-badge&logo=windows)

<p align="center">
  <b>Hệ thống phần mềm Desktop tạo tài liệu Doanh nghiệp tự động siêu tốc từ Template Word (.docx) & PDF</b><br>
  Tích hợp AI bóc tách thông minh, bộ nhớ khách hàng, công cụ tính toán % giá bán tự động và tùy biến linh hoạt.
</p>

</div>

---

## 🌟 Tính Năng Nổi Bật

### 1. 📋 Bảng Báo Giá Thông Minh & Tiện Ích Tốc Độ Cao
- **Tính toán % Tăng Tự Động**: Nhập đơn giá gốc và tỷ lệ `%` muốn tăng (VD: đơn giá gạch `1.340`, nhập tăng `20%` $\rightarrow$ máy tự động tính ra **`1.608`** VNĐ).
- **Tăng % Đồng Loạt Toàn Bảng**: Hỗ trợ tăng % nhanh cho toàn bộ 10–50 mặt hàng cùng lúc chỉ với 1 cú click hoặc các phím tắt chọn nhanh `+5%`, `+10%`, `+15%`, `+20%`, `+25%`.
- **Cột Ghi Chú Tùy Chọn Linh Hoạt**:
  - Tùy chọn bật/tắt `[+ Cột Ghi Chú]` ngay trên bảng hàng hóa (mặc định ẩn để gọn gàng).
  - Khi bật: hiển thị cột Ghi chú sau cột Tên hàng hóa và tự động xuất ra file Word mẫu 5 cột chuẩn chỉnh (`STT` | `TÊN HÀNG HÓA` | `GHI CHÚ` | `ĐƠN VỊ` | `ĐƠN GIÁ`).
- **AI Bóc Tách Văn Bản Zalo/Email**: Dán nội dung chat thô, AI tự động nhận diện tên vật tư, đơn vị tính và đơn giá để điền ngay vào bảng.

### 2. 📝 Hợp Đồng Nguyên Tắc Mua Bán
- **Tự Động Điền Chuẩn Mực**: Tạo hợp đồng nguyên tắc chuẩn mực giữa VietKey và đối tác.
- **Bộ Nhớ Đối Tác Thông Minh (Partner Memory Hub)**: Tự động ghi nhớ thông tin khách hàng cũ (Mã số thuế, Người đại diện, Chức vụ, Địa chỉ, Tài khoản ngân hàng). Chỉ cần gõ vài chữ cái là tự động gợi ý điền toàn bộ.
- **Chuẩn Hóa Danh Xưng & Chức Vụ**: Tự động nhận diện Ông/Bà, viết hoa tên đại diện và công ty chuẩn theo thể thức văn bản hành chính.

### 3. 💳 Giấy Đề Nghị Tạm Ứng
- Soạn thảo giấy đề nghị tạm ứng tiến độ thanh toán theo đợt nhanh chóng.
- **Tự Động Đọc Số Tiền Thành Chữ**: Tự động chuyển đổi các khoản tiền hàng tỷ đồng sang chữ tiếng Việt chuẩn xác 100% kèm chữ *"đồng chẵn"* (Thuật toán chuẩn ngữ pháp Việt Nam).

### 4. 🖨️ Xuất File Đa Định Dạng (Word & PDF)
- **Tùy chọn linh hoạt**: Xuất riêng file Word (`.docx`), file PDF hoặc xuất cả 2 file cùng lúc.
- **Cấu hình trực tiếp trên Form**: Tự động gợi ý tên file theo tên khách hàng, cho phép chọn thư mục lưu mặc định để xuất file 1-click.
- **Thanh thao tác nổi (Floating Action Bar)**: Thanh xuất file cố định thông minh kèm phím tắt <kbd>Ctrl</kbd> + <kbd>Enter</kbd> giúp thao tác tức thì.

---

## 🛠️ Công Nghệ Sử Dụng

- **Core Engine**: [Electron 34](https://www.electronjs.org/) + [Node.js](https://nodejs.org/)
- **Build Tooling**: [Electron-Vite](https://electron-vite.org/) + [Vite 6](https://vitejs.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Frontend Framework**: [React 18](https://react.dev/) + [TailwindCSS v4](https://tailwindcss.com/)
- **Icons & UI Effects**: [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Docx Engine**: [Docxtemplater](https://docxtemplater.com/) + [PizZip](https://github.com/open-xml-templating/pizzip)
- **Data Persistence**: SQLite / JSON Storage & Windows Credential Integration

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Yêu cầu hệ thống
- Hệ điều hành: Windows 10 / Windows 11 (64-bit)
- [Node.js](https://nodejs.org/) phiên bản 18.x trở lên
- Trình soạn thảo Word (Microsoft Word / WPS Office) để xem kết quả xuất

### 2. Cài đặt thư viện
Mở Terminal tại thư mục dự án:
```bash
npm install
```

### 3. Khởi chạy chế độ phát triển (Development)
```bash
npm run dev
```
Cửa sổ ứng dụng **VietKey DocGen** sẽ tự động mở lên màn hình desktop với giao diện Onyx & Candy Blue.

### 4. Đóng gói ứng dụng Desktop (.exe installer)
```bash
npm run build
```

---

## ⌨️ Bảng Phím Tắt Tiện Ích

| Phím Tắt | Chức Năng |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Xuất nhanh file Word / PDF tại màn hình hiện tại |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | Mở thanh tìm kiếm & Command Palette thông minh |
| <kbd>Tab</kbd> | Chuyển tiếp nhanh giữa các ô nhập dữ liệu |

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
tool-dung-nhanh/
├── .agents/                 # Workspace Rules & AI safety configurations
├── scripts/                 # Scripts tự động build & test các mẫu Template docx
├── src/
│   ├── main/                # Tiến trình chính Electron (IPC, Docx engine, PDF, Database)
│   │   ├── ipc/             # Handlers giao tiếp giữa UI và hệ điều hành
│   │   └── services/        # AI Parser, SQLite DB, Docx render engine
│   ├── preload/             # Electron Preload script & Secure Bridge
│   ├── renderer/            # Giao diện người dùng React (UI/UX)
│   │   ├── src/
│   │   │   ├── assets/      # Main CSS, Design Tokens, Themes
│   │   │   ├── components/  # Layout (Sidebar, Header), Common Controls
│   │   │   ├── pages/       # Dashboard, ContractForm, QuotationForm, AdvanceRequestForm
│   │   │   └── stores/      # State management (Theme, Settings)
│   └── shared/              # Typescript Types & Data Schemas dùng chung
├── templates/               # Thư mục chứa các mẫu Word chuẩn (.docx)
│   ├── HopDongNguyenTac.docx # Template Hợp đồng nguyên tắc
│   ├── BaoGia.docx          # Template Báo giá 4 cột chuẩn
│   └── BaoGia_CoGhiChu.docx # Template Báo giá 5 cột (có cột Ghi chú)
├── AGENTS.md                # Quy tắc bảo mật Git & mã hóa UTF-8 bắt buộc
└── README.md                # Tài liệu hướng dẫn dự án
```

---

## 🔒 Quy Tắc Bảo Mật & An Toàn Dữ Liệu

- **Bảo mật Git**: Mọi thay đổi chỉ được phép đẩy lên GitHub khi có yêu cầu trực tiếp từ người quản trị.
- **Bảo vệ dữ liệu nhạy cảm**: Tuyệt đối không commit các file bí mật, API key, file môi trường `.env`, database cục bộ hoặc file tạm của Microsoft Office.
- **Bảo vệ tiếng Việt (UTF-8 Protection)**: Tất cả mã nguồn và dữ liệu đều được lưu dưới chuẩn UTF-8, đảm bảo hiển thị chuẩn xác dấu tiếng Việt, không bị lỗi font (mojibake).

---

<div align="center">
  <sub>Phát triển và vận hành bởi <b>Công ty TNHH Đào Tạo Và Phát Triển Công Nghệ VietKey</b> © 2026</sub>
</div>
