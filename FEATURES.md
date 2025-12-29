# UBC PathFinder - 功能清单

## 📋 快速功能索引

本文档提供 UBC PathFinder 网站的完整功能清单，方便快速查找和了解所有可用功能。

---

## 🎯 核心功能

### 1. 录取概率计算器 ⭐⭐⭐
**位置**: `/ApplyInfo`

**主要功能:**
- 4层评估模型计算录取概率
- 支持20个UBC学位项目
- 实时计算（输入即更新）
- 详细的分数分解和分析
- 个性化改进建议

**输入参数:**
- GPA/平均分
- 课程难度
- 申请人类型
- 成绩趋势
- 课程完成状态
- 核心科目分数
- 课外活动评分
- 领导力评分
- 志愿服务评分
- 活动相关性
- 角色深度
- 补充材料分数

**输出结果:**
- 录取概率百分比
- Safety/Match/Reach 分类
- 分数分解
- 详细建议
- 警告和提醒

---

### 2. 学位规划器 ⭐⭐
**位置**: `/planner`

**主要功能:**
- 多计划管理（最多3个）
- 课程状态跟踪
- 进度可视化
- 学分计算
- 课程详情查看

**支持的专业:**
- 13个工程专业完整课程表
- Arts 学院支持

**课程管理:**
- 添加/移除课程
- 状态切换（未开始/已计划/已完成）
- 课程详情模态框
- UBCGrades 链接

---

### 3. 入学要求查找器 ⭐
**位置**: `/ApplyInfo` (页面顶部)

**主要功能:**
- 3步流程查找要求
- 支持13个加拿大省份
- 支持20个学位项目
- 详细要求展示
- 官方资源链接

**流程:**
1. 选择省份
2. 选择学位
3. 查看要求

---

### 4. 第一年指南 ⭐
**位置**: `/first-year-guide`

**主要功能:**
- 标准第一年工程课程表
- 专业先修要求
- 链式反应课程展示

**支持:**
- Applied Science 学院
- 13个工程专业

---

## 👤 用户功能

### 认证系统
- **注册**: 邮箱注册，密码设置，邮箱确认
- **登录**: 邮箱密码登录，会话管理
- **登出**: 完整清理，安全退出
- **个人资料**: 信息编辑，学术设置

### 数据保存
- **登录用户**: Supabase 云端存储，跨设备同步
- **访客用户**: localStorage 本地存储

---

## 📊 数据支持

### 省份覆盖 (13个)
✅ British Columbia, Ontario, Quebec, Alberta, Manitoba, New Brunswick, Newfoundland & Labrador, Northwest Territories, Nova Scotia, Nunavut, Prince Edward Island, Saskatchewan, Yukon

### 学位项目 (20个)
✅ Applied Biology, Applied Science (Engineering), Arts, Bachelor + Master of Management, Commerce, Dental Hygiene, Design, Fine Arts, Food and Resource Economics, Food Nutrition and Health, Indigenous Land Stewardship, NITEP, International Economics, Kinesiology, Media Studies, Music, Natural Resources, Pharmaceutical Sciences, Science, Urban Forestry

### 工程专业 (13个)
✅ Biomedical, Chemical and Biological, Civil, Computer, Electrical, Engineering Physics, Environmental, Geological, Integrated, Manufacturing, Materials, Mechanical, Mining

---

## 🎨 UI/UX 特性

### 可视化
- 圆形进度条
- 条形进度条
- 颜色编码系统
- 状态徽章

### 交互
- 模态框
- 下拉菜单
- 折叠面板
- 实时计算
- 悬停效果

### 响应式
- 移动端优化
- 平板适配
- 桌面端完整功能

---

## 🔗 外部集成

### UBCGrades
- 课程详情页面链接
- 查看历史成绩分布

### 官方 UBC 链接
- 省份要求页面
- 申请指南
- 英语要求

---

## 📱 页面列表

1. **首页** (`/`) - 介绍和导航
2. **申请信息** (`/ApplyInfo`) - 计算器和要求查找
3. **规划器** (`/planner`) - 学位规划
4. **第一年指南** (`/first-year-guide`) - 第一年课程指南
5. **登录** (`/login`) - 用户认证
6. **个人资料** (`/profile`) - 用户信息管理
7. **关于** (`/about`) - 项目介绍
8. **联系** (`/contact`) - 联系方式
9. **隐私政策** (`/privacy`) - 隐私条款
10. **服务条款** (`/terms`) - 使用条款

---

## 🚀 快速开始

### 作为申请人
1. 访问 `/ApplyInfo`
2. 使用要求查找器找到你的要求
3. 使用计算器评估录取概率
4. 查看改进建议

### 作为学生
1. 访问 `/planner`
2. 创建学位计划
3. 添加已完成的课程
4. 跟踪你的进度

### 作为新用户
1. 访问 `/first-year-guide`
2. 查看第一年标准课程
3. 了解专业先修要求

---

*最后更新: 2025年1月*

