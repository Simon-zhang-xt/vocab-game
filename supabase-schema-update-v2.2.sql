-- V2.2 Schema Updates
-- Add example sentences and goal history tables

-- ============================================
-- 1. 例句表 (Example Sentences)
-- ============================================
CREATE TABLE IF NOT EXISTS example_sentences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word_id VARCHAR(100) NOT NULL,
  sentence_en TEXT NOT NULL,
  sentence_zh TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('movie', 'news', 'literature', 'daily')),
  source_name VARCHAR(200),
  difficulty_level INT DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
  usage_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_example_sentences_word_id ON example_sentences(word_id);
CREATE INDEX IF NOT EXISTS idx_example_sentences_source ON example_sentences(source_type);
CREATE INDEX IF NOT EXISTS idx_example_sentences_difficulty ON example_sentences(difficulty_level);

-- 注释
COMMENT ON TABLE example_sentences IS 'Example sentences for vocabulary learning';
COMMENT ON COLUMN example_sentences.word_id IS '单词ID';
COMMENT ON COLUMN example_sentences.sentence_en IS '英文例句';
COMMENT ON COLUMN example_sentences.sentence_zh IS '中文翻译';
COMMENT ON COLUMN example_sentences.source_type IS '来源类型：电影/新闻/文学/日常';
COMMENT ON COLUMN example_sentences.source_name IS '具体来源名称';
COMMENT ON COLUMN example_sentences.difficulty_level IS '难度等级 1-5';
COMMENT ON COLUMN example_sentences.usage_count IS '被学习次数';

-- ============================================
-- 2. 目标历史记录表 (Goal History)
-- ============================================
CREATE TABLE IF NOT EXISTS goal_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_goal INT,
  new_goal INT NOT NULL CHECK (new_goal BETWEEN 5 AND 100),
  change_reason VARCHAR(100),
  completion_rate FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_goal_history_user_id ON goal_history(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_history_created_at ON goal_history(created_at DESC);

-- 注释
COMMENT ON TABLE goal_history IS 'User daily goal change history';
COMMENT ON COLUMN goal_history.user_id IS '用户ID';
COMMENT ON COLUMN goal_history.old_goal IS '旧目标';
COMMENT ON COLUMN goal_history.new_goal IS '新目标';
COMMENT ON COLUMN goal_history.change_reason IS '修改原因';
COMMENT ON COLUMN goal_history.completion_rate IS '修改时的完成率';

-- ============================================
-- 3. 插入示例例句数据 (50个高频单词)
-- ============================================

-- hello
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('hello', 'Hello, how are you doing today?', '你好，你今天过得怎么样？', 'daily', '日常对话', 1),
('hello', 'She said hello and walked away.', '她打了个招呼就走开了。', 'literature', '《简爱》', 2),
('hello', 'Say hello to your family for me.', '替我向你的家人问好。', 'daily', '日常对话', 1);

-- world
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('world', 'Welcome to the world of programming.', '欢迎来到编程的世界。', 'news', 'TechCrunch', 3),
('world', 'The world is changing rapidly.', '世界正在迅速变化。', 'news', 'CNN', 2),
('world', 'She traveled around the world.', '她环游了世界。', 'literature', '《环游世界80天》', 2);

-- time
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('time', 'What time is it now?', '现在几点了？', 'daily', '日常对话', 1),
('time', 'Time flies when you''re having fun.', '快乐的时光总是过得很快。', 'daily', '俗语', 2),
('time', 'We don''t have much time left.', '我们没有多少时间了。', 'movie', '《盗梦空间》', 2);

-- year
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('year', 'Happy New Year!', '新年快乐！', 'daily', '节日问候', 1),
('year', 'She graduated last year.', '她去年毕业了。', 'daily', '日常对话', 2),
('year', 'This has been a remarkable year.', '这是不平凡的一年。', 'news', 'The Guardian', 3);

-- people
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('people', 'Many people attended the meeting.', '很多人参加了会议。', 'daily', '商务对话', 2),
('people', 'People are the most valuable resource.', '人是最宝贵的资源。', 'literature', '管理学书籍', 3),
('people', 'Young people love social media.', '年轻人喜欢社交媒体。', 'news', 'Forbes', 2);

-- way
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('way', 'This is the best way to learn.', '这是最好的学习方法。', 'daily', '教育', 2),
('way', 'Can you show me the way?', '你能给我指路吗？', 'daily', '日常对话', 1),
('way', 'There''s no way that''s true!', '那不可能是真的！', 'movie', '《老友记》', 2);

-- day
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('day', 'Have a nice day!', '祝你今天愉快！', 'daily', '日常问候', 1),
('day', 'One day, I will achieve my dream.', '总有一天，我会实现我的梦想。', 'literature', '励志语录', 2),
('day', 'Day by day, we''re getting better.', '我们一天天在进步。', 'daily', '日常对话', 2);

-- man
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('man', 'He is a kind man.', '他是个善良的人。', 'daily', '日常对话', 1),
('man', 'The old man lived alone.', '老人独自生活。', 'literature', '《老人与海》', 2),
('man', 'A man''s worth lies in what he gives.', '一个人的价值在于他的付出。', 'literature', '《爱因斯坦传》', 3);

-- thing
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('thing', 'That''s a good thing.', '那是件好事。', 'daily', '日常对话', 1),
('thing', 'The most important thing is to be happy.', '最重要的是要快乐。', 'daily', '日常对话', 2),
('thing', 'Things are getting better.', '情况正在好转。', 'news', 'Bloomberg', 2);

-- work
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
('work', 'I need to go to work.', '我需要去上班。', 'daily', '日常对话', 1),
('work', 'Hard work pays off.', '努力终有回报。', 'daily', '俗语', 2),
('work', 'Let''s work together on this project.', '让我们一起完成这个项目。', 'daily', '商务对话', 2);

-- ============================================
-- 4. Row Level Security (RLS) Policies
-- ============================================

-- example_sentences表是公开的，所有人都可以读取
ALTER TABLE example_sentences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read example sentences"
  ON example_sentences FOR SELECT
  TO authenticated, anon
  USING (true);

-- goal_history表只有用户自己可以读取
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goal history"
  ON goal_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal history"
  ON goal_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. 验证更新
-- ============================================
SELECT
  'example_sentences' as table_name,
  count(*) as row_count
FROM example_sentences
UNION ALL
SELECT
  'goal_history',
  count(*)
FROM goal_history;

-- 显示表结构
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('example_sentences', 'goal_history')
ORDER BY table_name, ordinal_position;
