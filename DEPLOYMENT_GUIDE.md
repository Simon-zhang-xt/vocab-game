# 词汇学习游戏 - 云端部署操作指引

## 🌐 第一步：启用 GitHub Pages

### 操作步骤：

1. **打开 GitHub 仓库设置页面**
   ```
   https://github.com/Simon-zhang-xt/vocab-game/settings/pages
   ```

2. **配置 Pages 设置**
   - 在 "Source" 部分：
     - Branch: 选择 `main`
     - Folder: 选择 `/ (root)`
   - 点击 **Save** 按钮

3. **等待部署完成**
   - 部署需要 2-3 分钟
   - 刷新页面，会看到成功提示：
     ```
     Your site is live at https://simon-zhang-xt.github.io/vocab-game/
     ```

4. **验证部署**
   - 访问：https://simon-zhang-xt.github.io/vocab-game/
   - 应该能看到词汇学习游戏主页

### 故障排除：

如果页面显示 404：
- 等待 5 分钟再试（GitHub Pages 首次部署可能较慢）
- 检查仓库是否为 Public（Settings → General → Change visibility）
- 清除浏览器缓存

---

## 🗄️ 第二步：配置 Supabase 数据库（可选，10分钟）

### 前提条件：
- Supabase 项目已创建
- 项目 URL: `https://pzksoyntzzygfcbvchxr.supabase.co`

### 操作步骤：

1. **登录 Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **选择项目**
   - 找到项目 ID: `pzksoyntzzygfcbvchxr`
   - 点击进入项目

3. **打开 SQL Editor**
   - 左侧菜单 → SQL Editor
   - 点击 "+ New query"

4. **创建数据库表**

#### 表1: 用户表 (users)
```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
```

#### 表2: 学习记录 (learning_records)
```sql
CREATE TABLE IF NOT EXISTS learning_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  word TEXT NOT NULL,
  course_id TEXT,
  correct_attempts INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  mastery_level INTEGER DEFAULT 1 CHECK (mastery_level BETWEEN 1 AND 5),
  last_reviewed TIMESTAMP WITH TIME ZONE,
  study_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_learning_records_user ON learning_records(user_id);
CREATE INDEX idx_learning_records_word ON learning_records(word_id);
```

#### 表3: 每日目标 (daily_goals)
```sql
CREATE TABLE IF NOT EXISTS daily_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_type, date)
);

-- 创建索引
CREATE INDEX idx_daily_goals_user_date ON daily_goals(user_id, date);
```

#### 表4: 学习统计 (study_stats)
```sql
CREATE TABLE IF NOT EXISTS study_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  words_learned INTEGER DEFAULT 0,
  total_study_time INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 创建索引
CREATE INDEX idx_study_stats_user_date ON study_stats(user_id, date);
```

#### 表5: 好友关系 (friends)
```sql
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- 创建索引
CREATE INDEX idx_friends_user1 ON friends(user1_id);
CREATE INDEX idx_friends_user2 ON friends(user2_id);
```

#### 表6: 好友请求 (friend_requests)
```sql
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- 创建索引
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
```

#### 表7: 学习小组 (study_groups)
```sql
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX idx_study_groups_public ON study_groups(is_public);
```

#### 表8: 小组成员 (group_members)
```sql
CREATE TABLE IF NOT EXISTS group_members (
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 创建索引
CREATE INDEX idx_group_members_user ON group_members(user_id);
```

#### 表9: 排行榜 (leaderboard)
```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar TEXT,
  total_words INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  avg_accuracy DECIMAL(5,2) DEFAULT 0,
  study_days INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_leaderboard_score ON leaderboard(total_score DESC);
CREATE INDEX idx_leaderboard_words ON leaderboard(total_words DESC);
CREATE INDEX idx_leaderboard_accuracy ON leaderboard(avg_accuracy DESC);
```

5. **执行 SQL 语句**
   - 将上述 SQL 代码复制到 SQL Editor
   - 点击 **Run** 按钮
   - 等待执行完成（应该显示 "Success"）

6. **验证表创建**
   - 左侧菜单 → Table Editor
   - 应该能看到所有 9 个表：
     - users
     - learning_records
     - daily_goals
     - study_stats
     - friends
     - friend_requests
     - study_groups
     - group_members
     - leaderboard

7. **配置行级安全策略（RLS）**

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 学习记录策略
CREATE POLICY "Users can manage their own learning records" ON learning_records
  FOR ALL USING (auth.uid() = user_id);

-- 每日目标策略
CREATE POLICY "Users can manage their own goals" ON daily_goals
  FOR ALL USING (auth.uid() = user_id);

-- 学习统计策略
CREATE POLICY "Users can manage their own stats" ON study_stats
  FOR ALL USING (auth.uid() = user_id);

-- 好友策略
CREATE POLICY "Users can view their friends" ON friends
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create friendships" ON friends
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 好友请求策略
CREATE POLICY "Users can view requests involving them" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests sent to them" ON friend_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- 学习小组策略
CREATE POLICY "Anyone can view public groups" ON study_groups
  FOR SELECT USING (is_public = true OR creator_id = auth.uid());

CREATE POLICY "Users can create groups" ON study_groups
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their groups" ON study_groups
  FOR UPDATE USING (auth.uid() = creator_id);

-- 小组成员策略
CREATE POLICY "Members can view their memberships" ON group_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 排行榜策略（公开可读）
CREATE POLICY "Anyone can view leaderboard" ON leaderboard
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can update their own leaderboard" ON leaderboard
  FOR ALL USING (auth.uid() = user_id);
```

8. **启用实时订阅（可选）**
   - 左侧菜单 → Database → Replication
   - 为以下表启用 Realtime：
     - friend_requests
     - group_members
     - leaderboard

---

## 🔑 第三步：验证配置

### 测试 Supabase 连接：

1. **访问已部署的网站**
   ```
   https://simon-zhang-xt.github.io/vocab-game/
   ```

2. **测试用户注册**
   - 点击 "登录/注册"
   - 尝试注册新账号
   - 检查是否成功

3. **测试学习记录**
   - 学习几个单词
   - 刷新页面，检查学习进度是否保存

4. **检查 Supabase Dashboard**
   - Table Editor → users
   - 应该能看到新注册的用户

---

## 🐛 常见问题排查

### Q1: GitHub Pages 显示 404
**解决方案：**
- 等待 5-10 分钟
- 检查 Settings → Pages 是否正确配置
- 确保仓库是 Public

### Q2: Supabase 连接失败
**解决方案：**
- 检查 `js/config/supabase.js` 中的 URL 是否正确
- 检查 Supabase 项目是否暂停（免费版会自动暂停）
- 检查 RLS 策略是否正确配置

### Q3: 用户注册失败
**解决方案：**
- 在 Supabase Dashboard → Authentication → Settings
- 检查 "Enable email confirmations" 是否关闭（开发环境）
- 检查 "Site URL" 是否设置为 GitHub Pages URL

### Q4: 数据无法保存
**解决方案：**
- 检查浏览器控制台错误信息
- 验证 Supabase RLS 策略
- 确认用户已登录

---

## 📊 部署完成检查清单

- [ ] GitHub Pages 已启用
- [ ] 网站可以访问
- [ ] Supabase 所有表已创建
- [ ] RLS 策略已配置
- [ ] 用户注册功能正常
- [ ] 学习记录可以保存
- [ ] 社交功能可以使用（如果配置了）

---

## 🎉 完成！

现在您的词汇学习游戏已经完全部署到云端，可以从任何设备访问：

- 🌐 网站地址: https://simon-zhang-xt.github.io/vocab-game/
- 📦 代码仓库: https://github.com/Simon-zhang-xt/vocab-game
- 🗄️ 数据库: Supabase (已配置)

---

## 📞 需要帮助？

如果遇到任何问题，请检查：
1. 浏览器控制台错误信息
2. Supabase Dashboard 日志
3. GitHub Actions 构建日志
