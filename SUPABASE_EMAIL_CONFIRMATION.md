# Supabase Email Confirmation 設置指南

## 問題說明

默認情況下，Supabase 要求新註冊的用戶確認 email 才能登入。這會導致：
- 註冊成功
- 但登入時出現 "Invalid login credentials" 錯誤

## 解決方案（選擇其一）

### 方案 1：禁用 Email Confirmation（推薦用於開發/測試）

1. 登入 Supabase Dashboard
2. 前往 **Authentication** > **Providers** > **Email**
3. 找到 **"Confirm email"** 選項
4. **取消勾選** "Enable email confirmations"
5. 點擊 **Save**

這樣新註冊的用戶可以立即登入，無需確認 email。

### 方案 2：保持 Email Confirmation（生產環境推薦）

如果保持啟用 email confirmation：

1. 用戶註冊後會收到確認郵件
2. 點擊郵件中的確認連結
3. 然後才能登入

**注意**：確認郵件可能被發送到垃圾郵件文件夾。

### 方案 3：使用 Magic Link（無密碼登入）

可以考慮實現 Magic Link 登入，用戶只需輸入 email，會收到登入連結。

## 檢查當前設置

在 Supabase Dashboard：
- **Authentication** > **Providers** > **Email**
- 查看 "Confirm email" 是否啟用

## 測試

1. 註冊一個新帳號
2. 如果 email confirmation 已禁用，應該可以立即登入
3. 如果 email confirmation 已啟用，檢查 email（包括垃圾郵件）並點擊確認連結

## 生產環境建議

- **開發階段**：禁用 email confirmation 以便快速測試
- **生產環境**：啟用 email confirmation 以提高安全性

