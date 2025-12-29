# AI Integration Setup Guide

## 概述

本项目已集成 Google Gemini API 来提供智能化的情境对比分析。系统会优先使用 AI 分析，如果 API 调用失败，会自动回退到基于权重的估算分析。

## 设置步骤

### 1. 安装依赖

在项目根目录运行：

```bash
npm install @google/generative-ai
```

### 2. 创建环境变量文件

在项目根目录创建 `.env.local` 文件（此文件已在 `.gitignore` 中，不会被提交到 Git）：

```bash
# .env.local
VITE_GEMINI_API_KEY=你的_API_密钥
```

**重要提示：**
- 不要将 API 密钥提交到 Git
- `.env.local` 文件已在 `.gitignore` 中
- 如果 API 密钥未设置，系统会自动使用估算分析

### 3. 获取 Gemini API 密钥

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 登录你的 Google 账号
3. 创建新的 API 密钥
4. 将密钥复制到 `.env.local` 文件中

### 4. 重启开发服务器

如果开发服务器正在运行，需要重启以加载新的环境变量：

```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev
```

## 功能说明

### AI 分析模式

当 API 密钥配置正确且 API 调用成功时：
- 显示蓝色标签："🤖 AI 精确分析 (Gemini)"
- 使用 Gemini AI 进行深度分析
- 提供更准确的主要驱动因素识别
- 生成个性化的改进建议

### 估算分析模式（回退）

当以下情况发生时，系统会自动切换到估算分析：
- API 密钥未设置
- API 调用失败（网络问题、密钥失效、频率限制等）
- API 返回无效数据

此时会显示灰色标签："📊 智能估算"

## 技术实现

### 文件结构

```
src/
├── services/
│   └── aiAnalysisService.js    # AI 服务层
├── utils/
│   └── scenarioComparison.js    # 分析逻辑（支持 AI 和回退）
└── components/
    └── ScenarioComparator.jsx   # UI 组件（显示分析模式）
```

### 工作流程

1. **优先尝试 AI 分析**
   - 检查 API 密钥是否存在
   - 调用 `getAIComparison()` 函数
   - 格式化情境数据并发送给 Gemini
   - 解析 AI 返回的 JSON 结果

2. **自动回退**
   - 如果 AI 调用失败，自动使用 `identifyPrimaryDriver()` 估算逻辑
   - 确保用户体验不受影响

3. **UI 状态显示**
   - 根据分析模式显示不同的标签
   - 加载状态显示
   - 错误处理

## API 使用说明

### Prompt 设计

AI 服务会发送详细的 Prompt 给 Gemini，包括：
- 两个情境的完整输入数据（GPA、科目分数、活动等）
- 计算结果差异
- 要求识别主要驱动因素
- 要求生成 2-3 条关键洞察

### 返回格式

AI 返回的 JSON 格式：

```json
{
  "primaryDriver": {
    "field": "gpa",
    "label": "GPA / 平均分",
    "inputDelta": 5.0,
    "impact": "高影响 - 学术成绩是录取的核心因素",
    "percentage": 65.5
  },
  "insights": [
    "提升 GPA 是提高录取概率最直接有效的方法",
    "建议重点关注核心科目（如 Math 12, English 12）的分数提升",
    "考虑参加 AP 或 IB 课程以展示学术挑战能力"
  ],
  "reasoning": "GPA 在 UBC 录取中通常占 70% 的权重，因此 GPA 的提升对最终结果影响最大"
}
```

## 故障排除

### 问题：AI 分析不工作

1. **检查 API 密钥**
   - 确认 `.env.local` 文件存在
   - 确认 `VITE_GEMINI_API_KEY` 已设置
   - 确认密钥格式正确（没有多余空格）

2. **检查网络连接**
   - 确认可以访问 Google AI Studio
   - 检查防火墙设置

3. **检查 API 配额**
   - 访问 [Google AI Studio](https://makersuite.google.com/app/apikey) 查看配额
   - 确认没有超过免费配额限制

4. **查看浏览器控制台**
   - 打开开发者工具 (F12)
   - 查看 Console 标签页的错误信息
   - 查看 Network 标签页的 API 请求状态

### 问题：始终显示"智能估算"

- 检查 `.env.local` 文件是否正确创建
- 确认环境变量名称是 `VITE_GEMINI_API_KEY`（不是 `GEMINI_API_KEY`）
- 重启开发服务器
- 检查浏览器控制台的错误信息

## 安全注意事项

1. **不要提交 API 密钥到 Git**
   - `.env.local` 已在 `.gitignore` 中
   - 不要将密钥硬编码到代码中
   - 不要在公开场合分享 API 密钥

2. **生产环境部署**
   - 使用环境变量管理工具（如 Vercel、Netlify 的环境变量设置）
   - 不要在客户端代码中暴露敏感信息
   - 考虑使用后端代理来保护 API 密钥

3. **API 密钥轮换**
   - 定期检查 API 使用情况
   - 如果密钥泄露，立即在 Google AI Studio 中撤销并创建新密钥

## 成本说明

Google Gemini API 提供免费配额：
- 免费层有使用限制
- 超出限制后可能需要付费
- 建议监控 API 使用情况

查看配额和定价：
- [Google AI Studio Pricing](https://ai.google.dev/pricing)

## 更新日志

- **2025-01-XX**: 初始集成 Gemini API
  - 实现 AI 分析和回退机制
  - 添加分析模式标签
  - 优化 Prompt 设计

