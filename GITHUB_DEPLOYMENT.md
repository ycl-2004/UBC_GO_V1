# GitHub Pages Deployment Guide

## 設置 GitHub Secrets

在推送代碼之前，你需要在 GitHub Repository Settings 中添加 Secrets：

1. 前往你的 GitHub Repository
2. 點擊 **Settings** > **Secrets and variables** > **Actions**
3. 點擊 **New repository secret**
4. 添加以下兩個 secrets：

### Secret 1: VITE_SUPABASE_URL
- Name: `VITE_SUPABASE_URL`
- Value: `https://zrddkbqkuqrwukokaooc.supabase.co`

### Secret 2: VITE_SUPABASE_ANON_KEY
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: `sb_publishable_CaLVFrOLnK-SoPj-o7mZYg_2Aq5J1Jn`

## 啟用 GitHub Pages

1. 前往 Repository **Settings** > **Pages**
2. 在 **Source** 下拉選單中選擇 **GitHub Actions**
3. 保存設置

## 部署流程

當你推送代碼到 `main` 或 `master` 分支時：

1. GitHub Actions 會自動觸發構建
2. 構建過程會使用你設置的 Secrets 注入環境變數
3. 構建完成後自動部署到 GitHub Pages

## 驗證部署

部署完成後，你可以：
1. 在 Repository 的 **Actions** 標籤查看構建狀態
2. 訪問你的 GitHub Pages URL（通常在 `https://[username].github.io/UBC_GO_V1/`）
3. 檢查瀏覽器控制台確認 Supabase 連接正常

## 安全檢查清單

✅ `.gitignore` 已包含所有 `.env*` 文件
✅ GitHub Actions workflow 使用 Secrets 而不是硬編碼
✅ 環境變數使用 `VITE_` 前綴（Vite 要求）
✅ 本地 `.env.local` 文件不會被提交

## 故障排除

### 構建失敗：Missing environment variables
- 確認 Secrets 已正確設置
- 確認 Secret 名稱與 workflow 文件中的完全一致

### 構建成功但應用無法連接 Supabase
- 檢查瀏覽器控制台的錯誤訊息
- 確認 Secrets 中的 URL 和 Key 正確
- 確認 Supabase 項目設置允許你的 GitHub Pages 域名訪問

