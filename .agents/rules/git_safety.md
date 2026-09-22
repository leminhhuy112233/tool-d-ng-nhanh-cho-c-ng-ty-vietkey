---
description: Quy tắc an toàn Git - Không tự ý push và bảo mật file quan trọng
---

# Quy tắc an toàn Git

1. **Chỉ push khi có lệnh từ người dùng**:
   - Nghiêm cấm mọi hành vi tự động chạy `git push` trong quá trình hoàn thành tính năng hay sửa lỗi nếu người dùng không yêu cầu trực tiếp.
   - Khi người dùng yêu cầu push, hiển thị danh sách các file thay đổi để người dùng nắm rõ trước khi push.

2. **Bảo mật tuyệt đối các file quan trọng**:
   - Tuyệt đối không commit và không push các file cấu hình chứa API key, mật khẩu, file `.env`, database cục bộ (`*.db`, `*.sqlite`), và các file tạm office (`~$*.doc*`).
   - Mọi file mới thuộc nhóm nhạy cảm phải được khai báo ngay vào `.gitignore`.
