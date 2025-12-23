# 環境變數問題排查指南

## 當前錯誤
```
Uncaught Error: Missing Supabase environment variables. Please check your .env.local file.
```

## 檢查步驟

### 1. 確認 GitHub Secrets 設置

前往：Repository → Settings → Secrets and variables → Actions → **Secrets** 標籤

必須有以下兩個 Secrets（注意：是 Secrets，不是 Variables）：

- ✅ `VITE_SUPABASE_URL` = `https://zrddkbqkuqrwukokaooc.supabase.co`
- ✅ `VITE_SUPABASE_ANON_KEY` = `sb_publishable_CaLVFrOLnK-SoPj-o7mZYg_2Aq5J1Jn`

**重要**：
- Secret 名稱必須完全匹配（區分大小寫）
- 必須在 **Secrets** 標籤中，不是 Variables
- 刪除任何不需要的 secrets（如 `NEXT_PUBLIC_SUPABASE_URL`）

### 2. 檢查 GitHub Actions 構建日誌

1. 前往 Repository → **Actions** 標籤
2. 點擊最新的 workflow run
3. 展開 "Verify environment variables" 步驟
4. 應該看到：
   ```
   ✓ Environment variables are set correctly
     VITE_SUPABASE_URL: https://zrddkbqkuqrwukokaooc...
     VITE_SUPABASE_ANON_KEY: sb_publishable_CaLVFrOLnK...
   ```

如果看到錯誤，說明 Secrets 沒有正確設置。

### 3. 重新觸發構建

如果 Secrets 設置正確但構建仍然失敗：

1. 前往 Actions 標籤
2. 點擊左側的 "Deploy to GitHub Pages" workflow
3. 點擊右上角的 "Run workflow" 按鈕
4. 選擇分支（通常是 `main`）
5. 點擊 "Run workflow"

### 4. 驗證構建輸出

在構建日誌的 "Build with Vite" 步驟中，應該看到：
```
Building with environment variables...
VITE_SUPABASE_URL length: 45
VITE_SUPABASE_ANON_KEY length: 51
```

如果長度是 0，說明環境變數沒有被正確傳遞。

## 常見問題

### Q: Secrets 設置了但構建仍然失敗
A: 
1. 確認 Secret 名稱完全匹配（沒有多餘空格）
2. 確認值正確（沒有多餘引號）
3. 刪除並重新創建 Secrets
4. 重新觸發構建

### Q: 本地開發正常，但生產環境失敗
A: 
- 本地使用 `.env.local` 文件
- 生產環境使用 GitHub Secrets
- 確認兩者的變數名稱一致（都是 `VITE_` 前綴）

### Q: 構建成功但網站仍然報錯
A:
- 清除瀏覽器緩存
- 檢查構建產物中是否包含環境變數（應該被 Vite 嵌入到代碼中）
- 確認部署的是最新構建

## 快速修復

如果以上步驟都確認無誤，嘗試：

1. **刪除並重新創建 Secrets**：
   - 刪除現有的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
   - 重新創建，確保名稱和值完全正確

2. **手動觸發構建**：
   - Actions → Deploy to GitHub Pages → Run workflow

3. **檢查構建日誌**：
   - 查看 "Verify environment variables" 步驟的輸出
   - 查看 "Build with Vite" 步驟的輸出

