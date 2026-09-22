# VietKey AI Document Generator (DocGen)

Ứng dụng Desktop tạo tài liệu Word tự động từ Template, tích hợp AI hỗ trợ bóc tách dữ liệu.

---

## Các tính năng vừa cập nhật

1. **Cấu hình xuất file ngay trên Form**:
   - **Tên file xuất (.docx)**: Tự động gợi ý tên file theo tên công ty khách hàng (ví dụ: `Hop Dong CÔNG TY LIÊN HOA.docx`), cho phép sửa tên tùy ý.
   - **Lựa chọn thư mục lưu**: Ô chọn thư mục lưu file trực tiếp trên Form + nút **"Chọn"** để mở trình duyệt thư mục native của Windows.
   - **Xuất trực tiếp**: Bấm *"Tạo & Xuất File Word"* sẽ lưu ngay vào [Thư mục đã chọn]\[Tên file] mà không phải thao tác rườm rà.

2. **Cải tiến AI & Local Smart Parser**:
   - Tự động bóc tách Mã số thuế, Tên công ty, Đại diện, Chức vụ, Địa chỉ, Số tài khoản.
   - Hoạt động 100% offline với bộ parser thông minh, tự động chuyển sang OpenAI GPT-4o-mini khi bạn điền API Key trong Cài đặt.

3. **Giao diện Desktop hiện đại**:
   - Cửa sổ tự động hiện và focus ngay khi khởi chạy.
   - Frameless Titlebar, Dark/Light mode, Toast thông báo mượt mà.

---

## Hướng dẫn khởi chạy

### Bước 1: Mở Terminal tại thư mục dự án

```bash
cd "d:\cong ty vietkey\DỰ ÁN 2026\tool dùng nhanh"
```

### Bước 2: Chạy ứng dụng

```bash
npm run dev
```

Cửa sổ ứng dụng **VietKey DocGen** sẽ tự động mở lên màn hình.

---

## Hướng dẫn sử dụng Hợp đồng nguyên tắc

1. Mở mục **"Hợp đồng nguyên tắc"** ở Sidebar bên trái.
2. **Chọn cách nhập liệu**:
   - **Phương án 1 (Nhập thủ công)**: Điền các ô trên Form.
   - **Phương án 2 (Dán văn bản nhờ AI điền nhanh)**: Dán email, đoạn chat Zalo... rồi bấm *"Phân tích & Điền vào Form"*.
3. **Kiểm tra Cấu hình File xuất**:
   - Kiểm tra **Tên file xuất (.docx)**.
   - Chọn **Thư mục lưu file** (bấm nút *"Chọn"*).
4. **Bấm nút "Tạo & Xuất File Word"** ở góc phải bên dưới để xuất file `.docx` ngay lập tức!
