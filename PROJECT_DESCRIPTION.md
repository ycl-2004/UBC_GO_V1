# UBC PathFinder - 项目完整描述

## 📋 项目概述

**UBC PathFinder** 是一个非官方的 UBC（英属哥伦比亚大学）申请和学位规划工具，帮助学生：
- 计算录取概率
- 规划学位课程
- 了解入学要求
- 跟踪学业进度

---

## 🎯 核心特性 (Core Characteristics)

### 技术栈 (Tech Stack)
- **前端框架**: React 18 + Vite
- **路由**: React Router v6
- **后端服务**: Supabase (数据库 + 认证)
- **样式**: CSS3 (自定义样式系统)
- **错误监控**: Sentry
- **设计**: 响应式设计，支持移动端/平板/桌面

### 设计特点 (Design Characteristics)
- 现代化 UI/UX 设计
- 卡片式布局系统
- 可视化进度展示（圆形进度条、条形图）
- 颜色编码系统（高/中/低概率）
- 交互式组件（模态框、下拉菜单、折叠面板）
- 移动端优先设计

---

## 🚀 主要功能模块 (Main Features)

### 1. 首页 (HomePage)

**组件结构:**
- Hero 区域 - 主标题和副标题
- Action Cards - 快速导航（申请人/学生分流）
- Value Proposition - 价值主张展示
- Feature Preview - 功能预览
- Monetization - 商业化服务展示
- Footer - 页脚链接和免责声明

**功能:**
- 清晰的用户引导
- 快速访问主要功能
- 展示网站核心价值

---

### 2. 申请信息页 (ApplyInfoPage) - ⭐ 核心功能

#### 2.1 分步骤入学要求查找器 (StepByStepRequirements)

**流程:**
1. **步骤 1**: 选择省份/地区
   - 支持 13 个加拿大省份/地区
   - 热门省份：BC, Ontario, Quebec
   - 其他省份：Alberta, Manitoba, New Brunswick 等

2. **步骤 2**: 选择学位项目
   - 支持 20 个 UBC 学位项目
   - 包括：Arts, Science, Engineering, Commerce, Fine Arts 等

3. **步骤 3**: 查看详细要求
   - 一般入学要求
   - Grade 12 必修课程
   - Grade 11 要求（如适用）
   - 推荐相关课程（可展开查看详情）
   - 额外信息
   - 官方资源链接

**特性:**
- 实时数据加载
- 可展开的课程详情
- 官方 UBC 链接集成
- 清晰的进度指示器

#### 2.2 录取概率计算器 (Admission Calculator) - ⭐⭐⭐ 核心功能

**4层评估模型:**

**Layer 1: 门控检查 (Gate Check)**
- 检查必修课程完成情况
- 核心科目最低分数要求
- 补充材料要求检查
- 硬性门槛验证

**Layer 2: 分数计算 (Score Calculation)**
- **学术分数 (Academic Score)**: 0-100
  - 基础 GPA
  - 课程难度加成 (Regular/AP/IB)
  - 核心科目分数调整
- **个人档案分数 (Profile Score)**: 0-100
  - 课外活动评分 (1-5)
  - 领导力评分 (1-5)
  - 志愿服务评分 (1-5)
  - 成绩趋势调整
  - 活动相关性调整
  - 角色深度调整
- **补充材料分数 (Supplement Score)**: 0-100
  - 适用于需要作品集/面试的专业

**Layer 3: 概率计算 (Probability Calculation)**
- 加权最终分数计算
- Sigmoid 函数概率转换
- 国际学生调整
- 概率上限设置
- 置信区间计算

**Layer 4: 解释生成 (Explanation Generation)**
- 门控问题警告
- 补充材料提醒
- 核心科目警告
- 分数分析
- Top 2 改进建议

**输入参数:**
- GPA/平均分 (0-100)
- 课程难度 (Regular/AP/IB)
- 申请人类型 (国内/国际)
- 成绩趋势 (上升/稳定/下降)
- 课程完成状态 (已完成/进行中/未修)
- 核心科目分数 (Math12, English12, Physics12 等)
- 课外活动评分 (1-5)
- 领导力评分 (1-5)
- 志愿服务评分 (1-5)
- 活动相关性 (高/中/低)
- 角色深度 (创始人/执行/成员)
- 补充材料分数 (0-100，适用于特定专业)

**输出结果:**
- 录取概率百分比（带置信区间）
- Safety/Match/Reach 分类
- 颜色编码 (绿色/黄色/红色)
- 分数分解显示
- 详细分析和建议
- 改进建议（Top 2 Actions）
- 警告和提醒信息

**支持的专业:**
- Applied Biology
- Applied Science (Engineering)
- Arts
- Bachelor + Master of Management
- Commerce (UBC Sauder School of Business)
- Dental Hygiene
- Design in Architecture, Landscape Architecture, and Urbanism
- Fine Arts
- Food and Resource Economics
- Food, Nutrition, and Health
- Indigenous Land Stewardship
- Indigenous Teacher Education Program (NITEP)
- International Economics
- Kinesiology
- Media Studies
- Music
- Natural Resources
- Pharmaceutical Sciences
- Science
- Urban Forestry

**特性:**
- 实时计算（输入即更新）
- 专业特定的权重配置
- 智能建议生成
- 详细的解释和指导

---

### 3. 学位规划器 (PlannerPage) - ⭐⭐ 核心功能

#### 3.1 计划管理
- **创建新计划**
  - 计划命名
  - 选择学院
  - 选择专业
- **切换计划** - 快速在不同计划间切换
- **删除计划** - 删除不需要的计划
- **计划限制** - 最多 3 个计划
- **元数据编辑** - 编辑计划名称、学院、专业

#### 3.2 课程管理
- **课程状态系统**
  - 未开始 (Not Yet)
  - 已计划 (Planned)
  - 已完成 (Completed)
- **课程详情模态框**
  - 课程描述
  - 先修要求
  - 并修要求
  - UBCGrades 链接
- **课程状态切换** - 一键切换状态
- **课程添加/移除** - 从计划中添加或移除课程

#### 3.3 进度跟踪
- **总体进度**
  - 圆形进度条显示完成百分比
  - 已完成学分 / 总学分
  - 剩余学分显示
- **分类进度**
  - Communication 学分进度
  - Science 学分进度
  - Literature 学分进度
- **课程统计**
  - 已完成课程数
  - 进行中课程数
  - 剩余课程数

#### 3.4 课程数据支持
**支持的工程专业 (13个):**
- Biomedical Engineering
- Chemical and Biological Engineering
- Civil Engineering
- Computer Engineering
- Electrical Engineering
- Engineering Physics
- Environmental Engineering
- Geological Engineering
- Integrated Engineering
- Manufacturing Engineering
- Materials Engineering
- Mechanical Engineering
- Mining Engineering

**课程视图:**
- 课程网格视图（按学年和学期组织）
- 学年标签切换
- 学期分组显示
- 课程卡片显示（代码、学分、描述）

#### 3.5 用户功能
- **登录用户**: 云端保存（Supabase）
- **访客用户**: 本地存储（localStorage）
- **自动保存提示**: 显示未保存更改
- **手动保存按钮**: 手动保存更改

---

### 4. 第一年指南 (FirstYearGuide)

#### 4.1 标准第一年工程课程
- 完整课程列表
- 课程代码、学分、标题
- 是否包含在时间表中

#### 4.2 补充研究信息
- 人文/社会科学选修课说明
- 推荐课程级别

#### 4.3 第二学年专业先修要求
- 专业选择器（13个工程专业）
- 先修课程映射
- 链式反应课程展示（显示受影响的后续课程）

**特性:**
- 可折叠的信息展示
- 清晰的表格布局
- 专业特定的先修要求

---

### 5. 用户认证系统 (Authentication)

#### 5.1 注册功能
- 邮箱注册
- 密码设置（最少6位）
- 姓名输入
- 邮箱确认流程

#### 5.2 登录功能
- 邮箱密码登录
- 错误处理和提示
- 会话管理
- 自动登录状态恢复

#### 5.3 登出功能
- 完整清理（localStorage + sessionStorage）
- 强制重定向到首页

#### 5.4 个人资料管理
- 个人信息编辑
  - 全名
  - 出生日期
  - UBC 学号（8位数字）
- 学术信息设置
  - 学院选择
  - 专业选择
  - 年级选择
  - 目标毕业年份
- 学位进度显示
  - 完成百分比
  - 进度条可视化

---

### 6. 其他页面

#### 6.1 About Page
- 项目介绍
- 团队信息

#### 6.2 Contact Page
- 联系方式
- 反馈表单

#### 6.3 Privacy Policy
- 隐私政策
- 数据使用说明

#### 6.4 Terms of Service
- 服务条款
- 使用协议

---

## 🧩 组件功能 (Component Features)

### 导航组件 (Navigation)
- 响应式导航栏
- 用户状态显示（已登录/未登录）
- 登出功能
- 快速链接到主要页面

### 课程详情模态框 (CourseDetailModal)
- 课程完整信息展示
- 先修要求解析和显示
- 并修要求显示
- UBCGrades 链接集成

### 要求解析器 (RequirementParser)
- 智能解析先修要求文本
- 格式化显示
- 支持复杂要求格式

### 行动卡片 (ActionCards)
- 快速导航卡片
- 申请人/学生分流
- 视觉化引导

### 价值主张 (ValueProposition)
- 核心价值展示
- 特色功能亮点
- 图标化展示

### 功能预览 (FeaturePreview)
- 功能可视化预览
- 图表和网格展示
- 吸引用户使用

### 商业化展示 (Monetization)
- 服务卡片展示
- 链接到外部服务
- 变现路径

### 页脚 (Footer)
- 页脚链接导航
- 免责声明
- 版权信息

---

## 📊 数据覆盖范围 (Data Coverage)

### 省份/地区覆盖
✅ **13个加拿大省份/地区完整支持:**
- British Columbia (BC)
- Ontario (ON)
- Quebec (QC)
- Alberta (AB)
- Manitoba (MB)
- New Brunswick (NB)
- Newfoundland & Labrador (NL)
- Northwest Territories (NT)
- Nova Scotia (NS)
- Nunavut (NU)
- Prince Edward Island (PE)
- Saskatchewan (SK)
- Yukon (YT)

### 学位项目覆盖
✅ **20个UBC学位项目:**
- Applied Biology
- Applied Science (Engineering)
- Arts
- Bachelor + Master of Management
- Commerce (UBC Sauder School of Business)
- Dental Hygiene
- Design in Architecture, Landscape Architecture, and Urbanism
- Fine Arts
- Food and Resource Economics
- Food, Nutrition, and Health
- Indigenous Land Stewardship
- Indigenous Teacher Education Program (NITEP)
- International Economics
- Kinesiology
- Media Studies
- Music
- Natural Resources
- Pharmaceutical Sciences
- Science
- Urban Forestry

### 工程专业覆盖
✅ **13个工程专业完整课程表:**
- Biomedical Engineering
- Chemical and Biological Engineering
- Civil Engineering
- Computer Engineering
- Electrical Engineering
- Engineering Physics
- Environmental Engineering
- Geological Engineering
- Integrated Engineering
- Manufacturing Engineering
- Materials Engineering
- Mechanical Engineering
- Mining Engineering

### 课程数据
- 第一年标准课程完整数据
- 各专业完整课程表
- 先修要求数据
- 课程描述和学分信息

---

## 🎨 用户体验特性 (UX Features)

### 进度指示器
- 3步流程可视化
- 步骤完成状态显示
- 清晰的进度反馈

### 视觉反馈
- 颜色编码系统
  - 绿色：高概率/Safety
  - 黄色：中等概率/Match
  - 红色：低概率/Reach
- 进度条动画
- 状态徽章显示

### 交互设计
- 模态框交互
- 下拉菜单
- 折叠面板
- 悬停效果
- 点击反馈

### 信息架构
- 清晰的信息层次
- 面包屑导航
- 重置功能
- 返回按钮

### 实时计算
- 输入即更新结果
- 无需点击按钮
- 即时反馈

### 智能建议
- 基于输入的个性化建议
- Top 2 改进建议
- 详细的解释和指导

---

## 💾 数据持久化 (Data Persistence)

### 登录用户
- **云端存储**: Supabase 数据库
- **自动同步**: 跨设备数据同步
- **安全认证**: Supabase Auth

### 访客用户
- **本地存储**: localStorage
- **临时保存**: 浏览器会话期间有效
- **无账户要求**: 快速体验功能

---

## 🔒 安全特性 (Security Features)

### 认证安全
- Supabase Auth 集成
- 邮箱确认流程
- 密码加密存储
- 会话管理

### 数据安全
- 用户数据隔离
- 安全的 API 调用
- 错误处理机制

---

## 📱 响应式设计 (Responsive Design)

### 移动端优化
- 触摸友好的界面
- 适配小屏幕
- 优化的导航菜单

### 平板优化
- 中等屏幕布局
- 优化的卡片显示

### 桌面端优化
- 大屏幕布局
- 多列显示
- 完整的功能展示

---

## 🛠️ 开发工具和配置

### 开发环境
- Vite 构建工具
- Hot Module Replacement (HMR)
- ESLint 代码检查
- Prettier 代码格式化

### 部署
- GitHub Pages 部署
- 自动化构建流程
- 404 页面处理

### 监控
- Sentry 错误监控
- 用户行为追踪

---

## 📈 未来规划 (Future Roadmap)

### 短期目标
- [ ] UI/UX 体验优化
  - 课程详情弹窗增强
  - 空状态插图和引导
  - 手机版导航优化

### 中期目标
- [ ] 核心功能增强
  - 先修课检查器
  - GPA 计算器
  - 课程推荐系统

### 长期目标
- [ ] 商业化功能
  - 家教媒合
  - 学习笔记销售
  - 付费功能

---

## 📝 更新日志

### 当前版本功能
- ✅ 13个省份完整支持
- ✅ 20个学位项目支持
- ✅ 13个工程专业课程表
- ✅ 4层录取概率计算模型
- ✅ 多计划管理
- ✅ 用户认证系统
- ✅ 响应式设计

---

## 📄 许可证和免责声明

**免责声明**: 本网站与英属哥伦比亚大学（UBC）无任何关联。所有录取概率计算基于历史数据和趋势，不保证录取结果。请参考官方 UBC 网站获取权威信息。

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

*最后更新: 2025年1月*

