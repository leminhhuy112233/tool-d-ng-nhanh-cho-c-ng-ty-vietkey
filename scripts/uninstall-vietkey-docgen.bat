@echo off
chcp 65001 >nul 2>&1
setlocal EnableDelayedExpansion

:: ============================================================
::  GỠ CÀI ĐẶT NHANH - VietKey DocGen
::  Script này gỡ bỏ hoàn toàn VietKey DocGen khỏi máy tính.
::  Dữ liệu người dùng (VietKey_Data) được BẢO TOÀN.
:: ============================================================

title Gỡ Cài Đặt VietKey DocGen

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║     GỠ CÀI ĐẶT NHANH - VIETKEY DOCGEN              ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║  Script sẽ gỡ bỏ hoàn toàn VietKey DocGen.          ║
echo  ║  Dữ liệu khách hàng (VietKey_Data) KHÔNG bị xóa.   ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Xác nhận
set /p "CONFIRM=Bạn có chắc muốn gỡ cài đặt VietKey DocGen? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo.
    echo  [!] Đã hủy gỡ cài đặt.
    pause
    exit /b 0
)

echo.
echo  [1/5] Đang tắt VietKey DocGen nếu đang chạy...
taskkill /F /IM "VietKey DocGen.exe" >nul 2>&1
if %errorlevel% equ 0 (
    echo        ✓ Đã tắt VietKey DocGen.
    timeout /t 2 /nobreak >nul
) else (
    echo        - VietKey DocGen không đang chạy.
)

:: Tìm và chạy NSIS Uninstaller (cách chính thống nhất)
echo  [2/5] Đang tìm bộ gỡ cài đặt chính thức...

set "UNINSTALLER_FOUND=0"

:: Kiểm tra đường dẫn mặc định (per-user install)
set "DEFAULT_PATH=%LOCALAPPDATA%\Programs\vietkey-docgen"
if exist "%DEFAULT_PATH%\Uninstall VietKey DocGen.exe" (
    echo        ✓ Tìm thấy tại: %DEFAULT_PATH%
    echo        Đang gỡ cài đặt...
    "%DEFAULT_PATH%\Uninstall VietKey DocGen.exe" /S
    set "UNINSTALLER_FOUND=1"
    timeout /t 3 /nobreak >nul
)

:: Nếu không tìm thấy, thử tìm trong Registry
if "%UNINSTALLER_FOUND%"=="0" (
    for /f "tokens=2,*" %%a in ('reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\{com.vietkey.docgen}" /v "UninstallString" 2^>nul ^| findstr /i "UninstallString"') do (
        set "REG_UNINSTALLER=%%b"
    )
    if defined REG_UNINSTALLER (
        echo        ✓ Tìm thấy từ Registry.
        echo        Đang gỡ cài đặt...
        "!REG_UNINSTALLER!" /S
        set "UNINSTALLER_FOUND=1"
        timeout /t 3 /nobreak >nul
    )
)

:: Thử per-machine install
if "%UNINSTALLER_FOUND%"=="0" (
    for /f "tokens=2,*" %%a in ('reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\{com.vietkey.docgen}" /v "UninstallString" 2^>nul ^| findstr /i "UninstallString"') do (
        set "REG_UNINSTALLER=%%b"
    )
    if defined REG_UNINSTALLER (
        echo        ✓ Tìm thấy từ Registry (per-machine).
        echo        Đang gỡ cài đặt...
        "!REG_UNINSTALLER!" /S
        set "UNINSTALLER_FOUND=1"
        timeout /t 3 /nobreak >nul
    )
)

if "%UNINSTALLER_FOUND%"=="0" (
    echo        ! Không tìm thấy bộ gỡ cài đặt chính thức.
    echo        Sẽ dọn dẹp thủ công...
)

:: Xóa thư mục cài đặt nếu còn sót
echo  [3/5] Đang dọn dẹp thư mục cài đặt...

if exist "%DEFAULT_PATH%" (
    rd /s /q "%DEFAULT_PATH%" >nul 2>&1
    if not exist "%DEFAULT_PATH%" (
        echo        ✓ Đã xóa thư mục cài đặt.
    ) else (
        echo        ! Không thể xóa hoàn toàn (có thể file đang bị khóa).
        echo          Hãy khởi động lại máy và chạy lại script này.
    )
) else (
    echo        - Thư mục cài đặt đã được dọn dẹp.
)

:: Xóa shortcut Desktop
echo  [4/5] Đang xóa shortcut Desktop và Start Menu...

set "DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\VietKey DocGen.lnk"
set "PUBLIC_DESKTOP_SHORTCUT=%PUBLIC%\Desktop\VietKey DocGen.lnk"
set "STARTMENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\VietKey DocGen"

if exist "%DESKTOP_SHORTCUT%" (
    del /f "%DESKTOP_SHORTCUT%" >nul 2>&1
    echo        ✓ Đã xóa shortcut Desktop.
) else if exist "%PUBLIC_DESKTOP_SHORTCUT%" (
    del /f "%PUBLIC_DESKTOP_SHORTCUT%" >nul 2>&1
    echo        ✓ Đã xóa shortcut Desktop (public).
) else (
    echo        - Không tìm thấy shortcut Desktop.
)

if exist "%STARTMENU_DIR%" (
    rd /s /q "%STARTMENU_DIR%" >nul 2>&1
    echo        ✓ Đã xóa shortcut Start Menu.
) else (
    echo        - Không tìm thấy shortcut Start Menu.
)

:: Dọn dẹp Registry (nếu NSIS uninstaller chưa dọn)
echo  [5/5] Đang dọn dẹp Registry...

reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\{com.vietkey.docgen}" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\{com.vietkey.docgen}" /f >nul 2>&1
echo        ✓ Đã dọn Registry.

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  ✓ GỠ CÀI ĐẶT HOÀN TẤT!                           ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║  VietKey DocGen đã được gỡ bỏ khỏi máy tính.       ║
echo  ║                                                      ║
echo  ║  Lưu ý: Thư mục dữ liệu người dùng vẫn được       ║
echo  ║  giữ nguyên tại:                                     ║
echo  ║  %USERPROFILE%\VietKey_Data\                         ║
echo  ║                                                      ║
echo  ║  Nếu muốn xóa luôn dữ liệu, hãy xóa thư mục      ║
echo  ║  VietKey_Data thủ công.                              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
pause
