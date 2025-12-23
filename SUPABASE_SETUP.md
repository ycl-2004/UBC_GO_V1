# Supabase Integration Setup Guide

## 第一步：安裝依賴

在終端運行：

```bash
npm install @supabase/supabase-js
```

## 第二步：創建環境變數文件

在項目根目錄創建 `.env.local` 文件（如果還沒有）：

```env
VITE_SUPABASE_URL=https://zrddkbqkuqrwukokaooc.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_CaLVFrOLnK-SoPj-o7mZYg_2Aq5J1Jn
```

**重要**：`.env.local` 文件應該已經在 `.gitignore` 中，不要提交到 Git！

## 第三步：執行 SQL Schema

1. 登入你的 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇你的項目
3. 點擊左側選單的 **SQL Editor** 圖示
4. 打開 `supabase_schema.sql` 文件
5. 複製全部內容並貼到 SQL Editor
6. 點擊右下角的 **Run** 按鈕

這會創建：
- `profiles` 表：存儲用戶個人資料
- `degree_plans` 表：存儲學位計劃
- `course_status` 表：存儲課程完成狀態
- Row Level Security (RLS) 策略：確保用戶只能訪問自己的數據
- 自動觸發器：新用戶註冊時自動創建 profile

## 第四步：測試連接

1. 啟動開發服務器：`npm run dev`
2. 訪問 `/login` 頁面
3. 註冊一個新帳號
4. 檢查 Supabase Dashboard 的 **Authentication** > **Users** 確認用戶已創建
5. 檢查 **Table Editor** > **profiles** 確認 profile 已自動創建

## 數據庫結構

### profiles 表
- `id` (UUID, 主鍵，關聯 auth.users)
- `full_name` (TEXT)
- `email` (TEXT)
- `faculty` (TEXT)
- `major` (TEXT)
- `year_level` (TEXT)
- `target_graduation_year` (TEXT)
- `student_number` (TEXT)
- `date_of_birth` (DATE)

### degree_plans 表
- `id` (UUID, 主鍵)
- `user_id` (UUID, 關聯 profiles.id)
- `plan_name` (TEXT)
- `faculty` (TEXT)
- `major` (TEXT)
- `course_data` (JSONB) - 存儲課程列表

### course_status 表
- `id` (UUID, 主鍵)
- `user_id` (UUID, 關聯 profiles.id)
- `faculty` (TEXT)
- `major` (TEXT)
- `course_code` (TEXT)
- `status` (TEXT: 'not-started', 'in-progress', 'completed')

## 安全特性

- **Row Level Security (RLS)**：所有表都啟用了 RLS，用戶只能訪問自己的數據
- **自動 Profile 創建**：新用戶註冊時自動創建 profile 記錄
- **自動時間戳**：`created_at` 和 `updated_at` 自動管理

## 故障排除

### 錯誤：Missing Supabase environment variables
- 確認 `.env.local` 文件存在且包含正確的變數
- 重啟開發服務器（Vite 需要重啟才能讀取新的環境變數）

### 錯誤：relation "profiles" does not exist
- 確認你已經在 Supabase SQL Editor 中執行了 `supabase_schema.sql`

### 登入失敗
- 檢查 Supabase Dashboard > Authentication > Users 確認用戶存在
- 確認密碼正確（Supabase 要求至少 6 個字符）

## 下一步

現在你的應用已經連接到 Supabase！你可以：
1. 在 Supabase Dashboard 中查看和管理用戶數據
2. 數據會自動同步到所有設備
3. 用戶註冊和登入都是真實的，不再使用 localStorage mock

