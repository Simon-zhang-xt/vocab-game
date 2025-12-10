-- ============================================================
-- Complete Supabase Schema for Vocabulary Learning Game
-- Version: V2.2 + V3.0 + V4.0
-- Date: 2025-12-10
-- ============================================================

-- ============================================================
-- V2.2: Example Sentences & Goal History
-- ============================================================

-- Example Sentences Table
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

CREATE INDEX IF NOT EXISTS idx_example_sentences_word_id ON example_sentences(word_id);
CREATE INDEX IF NOT EXISTS idx_example_sentences_source ON example_sentences(source_type);

COMMENT ON TABLE example_sentences IS 'Example sentences for vocabulary learning with TTS support';

-- Goal History Table
CREATE TABLE IF NOT EXISTS goal_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  old_goal INT,
  new_goal INT NOT NULL CHECK (new_goal BETWEEN 5 AND 100),
  change_reason VARCHAR(100),
  completion_rate FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_history_user_id ON goal_history(user_id);

COMMENT ON TABLE goal_history IS 'User daily goal change history for analytics';

-- ============================================================
-- V3.0: Advanced Learning Features
-- ============================================================

-- Word Images Table (Image Memory System)
CREATE TABLE IF NOT EXISTS word_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word_id VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  image_source VARCHAR(50) DEFAULT 'unsplash' CHECK (image_source IN ('unsplash', 'user_upload', 'admin')),
  photographer VARCHAR(200),
  unsplash_id VARCHAR(100),
  likes_count INT DEFAULT 0,
  usage_count INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_word_images_word_id ON word_images(word_id);
CREATE INDEX IF NOT EXISTS idx_word_images_approved ON word_images(is_approved) WHERE is_approved = true;

COMMENT ON TABLE word_images IS 'Images for visual memory learning (5x memory improvement)';

-- User Word Images (Favorites)
CREATE TABLE IF NOT EXISTS user_word_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id VARCHAR(100),
  image_id UUID REFERENCES word_images(id) ON DELETE CASCADE,
  is_liked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_user_word_images_user ON user_word_images(user_id);

-- Word Roots Table (Etymology System)
CREATE TABLE IF NOT EXISTS word_roots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  root VARCHAR(50) NOT NULL UNIQUE,
  meaning VARCHAR(200) NOT NULL,
  origin VARCHAR(100) CHECK (origin IN ('latin', 'greek', 'french', 'german', 'other')),
  example_words TEXT[],
  usage_frequency INT DEFAULT 0,
  difficulty_level INT DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_word_roots_difficulty ON word_roots(difficulty_level);

COMMENT ON TABLE word_roots IS '500+ word roots for systematic vocabulary building (+1000% growth)';

-- Word Affixes Table (Prefixes & Suffixes)
CREATE TABLE IF NOT EXISTS word_affixes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  affix VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('prefix', 'suffix')),
  meaning VARCHAR(200) NOT NULL,
  example_words TEXT[],
  usage_frequency INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_word_affixes_type ON word_affixes(type);

-- Word Etymology (Root Breakdown)
CREATE TABLE IF NOT EXISTS word_etymology (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  word_id VARCHAR(100) NOT NULL UNIQUE,
  root_ids UUID[],
  prefix_ids UUID[],
  suffix_ids UUID[],
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_word_etymology_word ON word_etymology(word_id);

-- Pronunciation Records (AI Speech Evaluation)
CREATE TABLE IF NOT EXISTS pronunciation_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id VARCHAR(100) NOT NULL,
  spoken_text VARCHAR(100),
  confidence FLOAT CHECK (confidence BETWEEN 0 AND 1),
  score INT CHECK (score BETWEEN 0 AND 100),
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pronunciation_user_word ON pronunciation_records(user_id, word_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_created ON pronunciation_records(created_at DESC);

COMMENT ON TABLE pronunciation_records IS 'AI-powered pronunciation evaluation records';

-- ============================================================
-- V3.0: Social Features
-- ============================================================

-- Friendships Table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Study Groups Table
CREATE TABLE IF NOT EXISTS study_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES auth.users(id),
  member_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  group_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_public ON study_groups(is_public) WHERE is_public = true;

-- Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

-- Leaderboards Table
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  metric VARCHAR(50) NOT NULL CHECK (metric IN ('words_learned', 'streak_days', 'accuracy', 'study_time')),
  score INT NOT NULL,
  rank INT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, period, metric, created_at::date)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_period_metric_rank ON leaderboards(period, metric, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user ON leaderboards(user_id);

-- ============================================================
-- V4.0: AI & Enterprise Features
-- ============================================================

-- AI Learning Paths Table
CREATE TABLE IF NOT EXISTS ai_learning_paths (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INT DEFAULT 1,
  recommended_words TEXT[],
  difficulty_adjustment FLOAT DEFAULT 1.0,
  learning_style VARCHAR(50) CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'reading')),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_learning_paths_user ON ai_learning_paths(user_id);

-- Adaptive Quiz Sessions
CREATE TABLE IF NOT EXISTS adaptive_quiz_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id VARCHAR(100),
  difficulty_level FLOAT,
  response_time_ms INT,
  is_correct BOOLEAN,
  confidence_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptive_quiz_user_word ON adaptive_quiz_sessions(user_id, word_id);

-- Tutor Sessions (Real Human Tutors)
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES auth.users(id),
  session_type VARCHAR(50) CHECK (session_type IN ('pronunciation', 'conversation', 'grammar', 'vocabulary')),
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INT DEFAULT 30,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_sessions_student ON tutor_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_scheduled ON tutor_sessions(scheduled_at);

-- Enterprise Teams Table
CREATE TABLE IF NOT EXISTS enterprise_teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  admin_id UUID REFERENCES auth.users(id),
  member_limit INT DEFAULT 50,
  subscription_tier VARCHAR(50) CHECK (subscription_tier IN ('basic', 'professional', 'enterprise')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_id UUID REFERENCES enterprise_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Learning Analytics (For Teams)
CREATE TABLE IF NOT EXISTS learning_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES enterprise_teams(id) ON DELETE SET NULL,
  metric_name VARCHAR(100),
  metric_value FLOAT,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_analytics_user ON learning_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_analytics_team ON learning_analytics(team_id);

-- ============================================================
-- User Profile Extensions
-- ============================================================

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS preferred_learning_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_difficulty_level FLOAT DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS total_study_time_minutes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_voice VARCHAR(50) DEFAULT 'en-US-Neural2-A',
ADD COLUMN IF NOT EXISTS enable_ai_recommendations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_pronunciation_practice BOOLEAN DEFAULT true;

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Example Sentences (Public Read)
ALTER TABLE example_sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read example sentences" ON example_sentences FOR SELECT TO authenticated, anon USING (true);

-- Goal History (User Private)
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own goal history" ON goal_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goal history" ON goal_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Word Images (Public Approved)
ALTER TABLE word_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved images" ON word_images FOR SELECT TO authenticated, anon USING (is_approved = true);

-- Pronunciation Records (User Private)
ALTER TABLE pronunciation_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own pronunciation records" ON pronunciation_records FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Friendships (User Access)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own friendships" ON friendships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own friendships" ON friendships FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Study Groups (Public/Private)
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read public groups" ON study_groups FOR SELECT TO authenticated, anon USING (is_public = true);
CREATE POLICY "Members can read their groups" ON study_groups FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid())
);

-- Leaderboards (Public Read)
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read leaderboards" ON leaderboards FOR SELECT TO authenticated, anon USING (true);

-- AI Learning Paths (User Private)
ALTER TABLE ai_learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own AI paths" ON ai_learning_paths FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Function: Update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE study_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE study_groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_member_count
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Function: Increment sentence usage count
CREATE OR REPLACE FUNCTION increment_sentence_usage(sentence_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE example_sentences SET usage_count = usage_count + 1 WHERE id = sentence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate user learning streaks
CREATE OR REPLACE FUNCTION calculate_learning_streak(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_streak INT := 0;
  v_last_date DATE;
  v_current_date DATE := CURRENT_DATE;
BEGIN
  SELECT last_study_date INTO v_last_date FROM user_profiles WHERE user_id = p_user_id;

  IF v_last_date IS NULL THEN
    RETURN 0;
  END IF;

  IF v_last_date = v_current_date OR v_last_date = v_current_date - 1 THEN
    SELECT streak_days INTO v_streak FROM user_profiles WHERE user_id = p_user_id;
    RETURN COALESCE(v_streak, 0);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Sample Data Insertion
-- ============================================================

-- Insert 30 example sentences (10 words × 3 sentences each)
INSERT INTO example_sentences (word_id, sentence_en, sentence_zh, source_type, source_name, difficulty_level) VALUES
-- hello
('hello', 'Hello, how are you doing today?', '你好，你今天过得怎么样？', 'daily', '日常对话', 1),
('hello', 'She said hello and walked away.', '她打了个招呼就走开了。', 'literature', '《简爱》', 2),
('hello', 'Say hello to your family for me.', '替我向你的家人问好。', 'daily', '日常对话', 1),
-- world
('world', 'Welcome to the world of programming.', '欢迎来到编程的世界。', 'news', 'TechCrunch', 3),
('world', 'The world is changing rapidly.', '世界正在迅速变化。', 'news', 'CNN', 2),
('world', 'She traveled around the world.', '她环游了世界。', 'literature', '《环游世界80天》', 2),
-- time
('time', 'What time is it now?', '现在几点了？', 'daily', '日常对话', 1),
('time', 'Time flies when you''re having fun.', '快乐的时光总是过得很快。', 'daily', '俗语', 2),
('time', 'We don''t have much time left.', '我们没有多少时间了。', 'movie', '《盗梦空间》', 2),
-- year
('year', 'Happy New Year!', '新年快乐！', 'daily', '节日问候', 1),
('year', 'She graduated last year.', '她去年毕业了。', 'daily', '日常对话', 2),
('year', 'This has been a remarkable year.', '这是不平凡的一年。', 'news', 'The Guardian', 3),
-- people
('people', 'Many people attended the meeting.', '很多人参加了会议。', 'daily', '商务对话', 2),
('people', 'People are the most valuable resource.', '人是最宝贵的资源。', 'literature', '管理学书籍', 3),
('people', 'Young people love social media.', '年轻人喜欢社交媒体。', 'news', 'Forbes', 2),
-- way
('way', 'This is the best way to learn.', '这是最好的学习方法。', 'daily', '教育', 2),
('way', 'Can you show me the way?', '你能给我指路吗？', 'daily', '日常对话', 1),
('way', 'There''s no way that''s true!', '那不可能是真的！', 'movie', '《老友记》', 2),
-- day
('day', 'Have a nice day!', '祝你今天愉快！', 'daily', '日常问候', 1),
('day', 'One day, I will achieve my dream.', '总有一天，我会实现我的梦想。', 'literature', '励志语录', 2),
('day', 'Day by day, we''re getting better.', '我们一天天在进步。', 'daily', '日常对话', 2),
-- man
('man', 'He is a kind man.', '他是个善良的人。', 'daily', '日常对话', 1),
('man', 'The old man lived alone.', '老人独自生活。', 'literature', '《老人与海》', 2),
('man', 'A man''s worth lies in what he gives.', '一个人的价值在于他的付出。', 'literature', '《爱因斯坦传》', 3),
-- thing
('thing', 'That''s a good thing.', '那是件好事。', 'daily', '日常对话', 1),
('thing', 'The most important thing is to be happy.', '最重要的是要快乐。', 'daily', '日常对话', 2),
('thing', 'Things are getting better.', '情况正在好转。', 'news', 'Bloomberg', 2),
-- work
('work', 'I need to go to work.', '我需要去上班。', 'daily', '日常对话', 1),
('work', 'Hard work pays off.', '努力终有回报。', 'daily', '俗语', 2),
('work', 'Let''s work together on this project.', '让我们一起完成这个项目。', 'daily', '商务对话', 2)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Count tables
SELECT
  'example_sentences' as table_name, count(*) as row_count FROM example_sentences
UNION ALL SELECT 'word_images', count(*) FROM word_images
UNION ALL SELECT 'word_roots', count(*) FROM word_roots
UNION ALL SELECT 'study_groups', count(*) FROM study_groups;

-- Show user profile extensions
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('preferred_learning_style', 'ai_difficulty_level', 'subscription_tier');

-- ============================================================
-- End of Complete Schema
-- ============================================================
