# 📚 词汇学习游戏 V2.0 - Vocabulary Learning Game

现代化的交互式词汇学习Web应用，支持TOEFL/IELTS备考，包含用户账号、云端同步、后台管理等完整功能。

## ✨ 核心特性

### 🎮 学习端
- **多种题型**: 选择题、填空题、匹配题
- **智能复习**: Ebbinghaus遗忘曲线算法
- **学习统计**: 实时进度追踪、准确率分析
- **现代UI**: 流利说风格设计，渐变配色，流畅动画
- **响应式**: 完美支持桌面和移动端（底部导航）
- **用户系统**: 注册登录、游客模式
- **云端同步**: Supabase后端，数据实时同步

### 🛠️ 后台管理
- **词库管理**: 完整的单词增删改查
- **课程管理**: 课程创建和编辑
- **批量导入**: JSON格式批量导入
- **数据导出**: 完整数据备份

## 🚀 快速访问

**学习页面**: https://simon-zhang-xt.github.io/vocab-game/

**后台管理**: https://simon-zhang-xt.github.io/vocab-game/admin.html

## 📖 使用说明

### 后台管理 - 添加单词词库

1. 访问 `/admin.html`
2. 点击"添加新单词"按钮
3. 填写必填字段：
   - 单词（例如: abandon）
   - 词性（例如: v.）
   - 释义（例如: 放弃；抛弃）
   - 难度等级（1-3）
4. 可选填写: 音标、例句、同义词、反义词、标签
5. 点击"保存单词"

### 批量导入单词

使用JSON格式批量导入：

\`\`\`json
[
  {
    "id": "word_001",
    "word": "abandon",
    "phonetic": "/əˈbændən/",
    "partOfSpeech": "v.",
    "definition": "放弃；抛弃",
    "example": {
      "en": "He abandoned his family.",
      "zh": "他抛弃了他的家人。"
    },
    "synonyms": ["desert", "forsake"],
    "antonyms": ["keep", "maintain"],
    "difficulty": 2,
    "tags": ["TOEFL", "高频"]
  }
]
\`\`\`

## 🏗️ 技术栈

- **前端**: Vanilla JavaScript ES6+, CSS3
- **后端**: Supabase (PostgreSQL + Auth)
- **部署**: GitHub Pages
- **设计**: 流利说风格现代UI

## 📁 项目结构

\`\`\`
vocab-game/
├── index.html              # 学习页面
├── admin.html              # 后台管理
├── css/                    # 样式文件
├── js/
│   ├── app.js             # 主应用
│   ├── admin.js           # 后台管理
│   ├── models/            # 数据模型
│   ├── services/          # 服务层
│   ├── components/        # UI组件
│   └── utils/             # 工具函数
├── data/                   # 初始数据
└── tests/                  # 测试文件
\`\`\`

## 🗄️ 数据库结构

- **user_profiles**: 用户资料（level, points, streak）
- **user_progress**: 学习进度
- **word_mastery**: 单词掌握度（Ebbinghaus）
- **mistake_records**: 错题记录
- **daily_stats**: 每日统计

## 🎨 UI特点

- 渐变色系：紫色主题
- 大圆角设计：16-32px
- 流畅动画：60 FPS
- 移动端底部导航
- 卡片悬浮效果

## 📱 移动端支持

- 底部Tab导航（<768px）
- 触摸优化
- 响应式布局
- GPU加速动画

## 🔐 隐私保护

- 游客模式：LocalStorage本地存储
- 注册用户：Supabase云端加密
- 可随时删除数据
- 无第三方追踪

## 🛠️ 本地开发

\`\`\`bash
# 克隆项目
git clone https://github.com/Simon-zhang-xt/vocab-game.git

# 启动服务器
cd vocab-game
npx http-server -p 8080

# 访问
# http://localhost:8080 - 学习页面
# http://localhost:8080/admin.html - 后台管理
\`\`\`

## 📄 许可证

MIT License

## 👨‍💻 作者

**Simon Zhang** - GitHub: [@Simon-zhang-xt](https://github.com/Simon-zhang-xt)

---

**⭐ 如果这个项目对你有帮助，请给个Star！**

**Made with ❤️ by Claude Code + Sonnet**
