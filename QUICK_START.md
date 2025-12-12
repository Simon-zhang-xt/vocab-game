# 🚀 快速开始 - 5分钟部署指南

## ⏱️ 第一步：启用 GitHub Pages（2分钟）

### 📸 图文操作：

1. **打开设置页面**
   
   点击这个链接：https://github.com/Simon-zhang-xt/vocab-game/settings/pages
   
   或者：
   - 打开 GitHub 仓库
   - 点击顶部 "Settings" 标签
   - 左侧菜单找到 "Pages"

2. **配置部署**
   
   在 "Build and deployment" 部分：
   
   ```
   Source: [Deploy from a branch]
   Branch: [main] [/ (root)] [Save]
   ```
   
   - 第一个下拉框选择：**main**
   - 第二个下拉框选择：**/ (root)**
   - 点击蓝色 **Save** 按钮

3. **等待部署**
   
   - 刷新页面（等待 1-2 分钟）
   - 看到绿色提示框：
     ```
     ✅ Your site is live at https://simon-zhang-xt.github.io/vocab-game/
     ```

4. **访问网站**
   
   点击链接或直接访问：
   ```
   https://simon-zhang-xt.github.io/vocab-game/
   ```

**✅ 完成！网站已经可以访问了！**

---

## 🗄️ 第二步：配置 Supabase（3分钟）

### 为什么需要 Supabase？
- V2.1 用户登录/注册需要
- V2.2 数据可视化需要  
- V3.5 社交功能需要
- 如果只是体验 V3.1-V3.4，可以跳过这一步

### 📸 图文操作：

1. **登录 Supabase**
   
   访问：https://supabase.com/dashboard
   
   使用您的 GitHub 账号登录

2. **找到项目**
   
   - 在项目列表中找到项目 ID：`pzksoyntzzygfcbvchxr`
   - 点击进入项目

3. **打开 SQL Editor**
   
   - 左侧菜单点击 **SQL Editor**（图标：</>）
   - 点击右上角 **+ New query** 按钮

4. **复制并执行 SQL**
   
   **方法A：使用完整 SQL（推荐）**
   
   复制以下完整 SQL 到编辑器：
   
   ```sql
   -- 创建所有表和策略（一次性执行）
   
   -- 1. 用户表
   CREATE TABLE IF NOT EXISTS users (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     email TEXT UNIQUE NOT NULL,
     username TEXT,
     avatar TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   CREATE INDEX idx_users_email ON users(email);
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
   CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
   
   -- 2. 学习记录表
   CREATE TABLE IF NOT EXISTS learning_records (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     word_id TEXT NOT NULL,
     word TEXT NOT NULL,
     correct_attempts INTEGER DEFAULT 0,
     total_attempts INTEGER DEFAULT 0,
     mastery_level INTEGER DEFAULT 1,
     last_reviewed TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   CREATE INDEX idx_learning_records_user ON learning_records(user_id);
   ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users manage own records" ON learning_records FOR ALL USING (auth.uid() = user_id);
   
   -- 3. 每日目标表
   CREATE TABLE IF NOT EXISTS daily_goals (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     goal_type TEXT NOT NULL,
     target_value INTEGER NOT NULL,
     current_value INTEGER DEFAULT 0,
     date DATE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user_id, goal_type, date)
   );
   ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users manage own goals" ON daily_goals FOR ALL USING (auth.uid() = user_id);
   
   -- 4. 好友表（V3.5 社交功能）
   CREATE TABLE IF NOT EXISTS friends (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
     user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(user1_id, user2_id)
   );
   ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users view friends" ON friends FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
   
   -- 5. 好友请求表
   CREATE TABLE IF NOT EXISTS friend_requests (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users view own requests" ON friend_requests FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
   
   -- 6. 学习小组表
   CREATE TABLE IF NOT EXISTS study_groups (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     description TEXT,
     creator_id UUID REFERENCES users(id),
     is_public BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "View public groups" ON study_groups FOR SELECT USING (is_public = true);
   
   -- 7. 排行榜表
   CREATE TABLE IF NOT EXISTS leaderboard (
     user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
     username TEXT NOT NULL,
     total_words INTEGER DEFAULT 0,
     total_score INTEGER DEFAULT 0,
     avg_accuracy DECIMAL(5,2) DEFAULT 0,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "View leaderboard" ON leaderboard FOR SELECT TO public USING (true);
   ```
   
   - 点击右下角绿色 **Run** 按钮
   - 等待 5-10 秒
   - 看到 "Success. No rows returned" 表示成功

5. **验证表创建**
   
   - 左侧菜单点击 **Table Editor**（图标：📊）
   - 应该看到 7 个新表：
     - ✅ users
     - ✅ learning_records
     - ✅ daily_goals
     - ✅ friends
     - ✅ friend_requests
     - ✅ study_groups
     - ✅ leaderboard

6. **配置认证设置**
   
   - 左侧菜单点击 **Authentication** → **Settings**
   - 关闭 "Enable email confirmations"（开发环境）
   - 在 "Site URL" 填入：`https://simon-zhang-xt.github.io/vocab-game/`
   - 点击 **Save**

**✅ 完成！数据库已配置！**

---

## 🎯 第三步：测试功能（1分钟）

1. **访问网站**
   ```
   https://simon-zhang-xt.github.io/vocab-game/
   ```

2. **测试基础功能（不需要登录）**
   - 浏览课程列表 ✓
   - 开始学习单词 ✓
   - 尝试游戏模式 ✓
   - 使用图像记忆（V3.2）✓
   - 使用词根词缀（V3.3）✓
   - 使用发音训练（V3.4）✓

3. **测试登录功能（需要 Supabase）**
   - 点击右上角 "登录/注册"
   - 注册新账号
   - 学习几个单词
   - 刷新页面，检查进度是否保存

4. **测试社交功能（需要 Supabase）**
   - 进入 "社交学习" 页面
   - 搜索用户
   - 创建学习小组
   - 查看排行榜

**✅ 完成！所有功能正常运行！**

---

## 📱 分享给朋友

您的词汇学习游戏现在可以分享给任何人：

```
🎓 词汇学习游戏
📍 https://simon-zhang-xt.github.io/vocab-game/

✨ 功能特点：
- 📚 TOEFL/IELTS 词汇库
- 🎮 多种游戏模式
- 📷 图像记忆法
- 🌳 词根词缀学习
- 🎙️ AI 发音训练
- 🌐 社交学习功能
- 📊 数据可视化
- 📱 PWA 离线支持
```

---

## ❓ 常见问题

### Q: GitHub Pages 显示 404
**A:** 等待 5 分钟，GitHub Pages 首次部署需要时间。确保仓库是 Public。

### Q: 无法注册用户
**A:** 检查 Supabase 是否正确配置，特别是 Authentication 设置。

### Q: 学习进度没有保存
**A:** 
- 如果没登录：检查浏览器是否启用 localStorage
- 如果已登录：检查 Supabase RLS 策略是否正确

### Q: 社交功能无法使用
**A:** 确保已完成 Supabase 配置，特别是创建了社交相关的表。

---

## 🎉 恭喜完成！

您的词汇学习游戏现在已经：
- ✅ 部署到 GitHub Pages
- ✅ 配置了 Supabase 后端
- ✅ 所有 V1.0-V3.5 功能可用
- ✅ 可以从任何设备访问

**代码统计：23,154 行**
**功能模块：8 个主要版本**
**部署时间：< 5 分钟**

享受学习吧！🚀
