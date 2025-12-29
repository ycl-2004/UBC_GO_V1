# ⚠️ 安全警告：API 密钥暴露

## 问题发现

在 Git 历史记录中发现 `.env.local` 文件曾被提交，其中包含：
- Gemini API 密钥
- Supabase 密钥

## 已采取的措施

1. ✅ 已从 Git 跟踪中移除 `.env.local` 文件
2. ✅ `.gitignore` 已正确配置，包含所有 `.env*` 文件
3. ✅ 代码中没有硬编码 API 密钥（使用环境变量）

## 需要立即执行的操作

### 1. 撤销并更换 API 密钥（重要！）

由于 API 密钥已在 Git 历史中暴露，**必须立即撤销并更换**：

#### Gemini API 密钥
1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 找到暴露的 API 密钥：`AIzaSyBmxJAQ-71pZQYQPthdfqF-duhqirqAfK8`
3. **立即删除/撤销该密钥**
4. 创建新的 API 密钥
5. 更新 `.env.local` 文件中的新密钥

#### Supabase 密钥
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目设置 → API Settings
3. **撤销暴露的 anon key**（如果担心安全）
4. 生成新的 anon key（如果需要）
5. 更新 `.env.local` 文件

### 2. 清理 Git 历史（可选但推荐）

如果仓库是私有的，可以：
- 保持现状（密钥已从当前版本移除）
- 或者重写 Git 历史（需要强制推送，影响所有协作者）

如果仓库是公开的，**强烈建议**：
- 撤销所有暴露的密钥
- 考虑创建新的仓库（如果历史记录中有敏感信息）

### 3. 提交更改

```bash
git add .gitignore
git commit -m "Remove .env.local from Git tracking"
git push
```

## 预防措施

### ✅ 已实施
- `.gitignore` 包含所有 `.env*` 文件
- 代码使用环境变量，不硬编码密钥

### 📋 最佳实践
1. **永远不要提交 `.env` 文件**
2. **使用 `.env.example` 作为模板**（不包含真实密钥）
3. **定期检查 Git 状态**：`git status` 确保没有意外添加敏感文件
4. **使用 Git hooks** 防止意外提交敏感文件

## 检查清单

- [ ] 撤销暴露的 Gemini API 密钥
- [ ] 创建新的 Gemini API 密钥
- [ ] 更新 `.env.local` 文件
- [ ] 撤销/更换 Supabase 密钥（如需要）
- [ ] 提交 Git 更改（移除 `.env.local`）
- [ ] 测试新密钥是否工作正常

## 当前状态

- ✅ `.env.local` 已从 Git 跟踪中移除
- ✅ `.gitignore` 配置正确
- ⚠️ **需要撤销并更换 API 密钥**

---

**最后更新**: 2025-01-XX

