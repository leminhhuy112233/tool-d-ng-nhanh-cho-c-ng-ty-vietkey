# QUY TẮC AN TOÀN VÀ BẢO MẬT DỰ ÁN (VIETKEY DOCGEN)

## 1. Quy tắc Git và Bảo Mật (Bắt buộc tuân thủ 100%)
- **TUYỆT ĐỐI KHÔNG TỰ Ý PUSH LÊN GIT**: AI không được phép tự động chạy `git push` lên GitHub/GitLab nếu người dùng chưa ra lệnh hoặc yêu cầu rõ ràng.
- **Bảo vệ dữ liệu nhạy cảm**:
  - Không bao giờ commit các file bí mật, API key, file `.env`, file `.env.local`.
  - Không commit database cục bộ (`*.sqlite`, `*.db`).
  - Không commit các file tạm thời của Microsoft Office (`~$*.doc*`, `*.tmp`).
  - Luôn kiểm tra kỹ `git status` trước khi thực hiện add và commit.

## 2. Quy tắc Mã hóa Tiếng Việt (UTF-8 Protection)
- Luôn lưu tất cả file code và tài liệu ở định dạng UTF-8.
- Bảo tồn đầy đủ dấu tiếng Việt, không để xảy ra hiện tượng lỗi font (mojibake).
