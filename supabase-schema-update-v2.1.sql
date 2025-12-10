-- V2.1 Schema Updates
-- Add daily goal and streak tracking fields to user_profiles

-- Add daily_goal column (default 20 words per day)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS daily_goal INT DEFAULT 20;

-- Add streak_days column (consecutive learning days)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;

-- Add last_study_date column (track last study date for streak calculation)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.daily_goal IS '每日学习目标单词数';
COMMENT ON COLUMN user_profiles.streak_days IS '连续学习天数';
COMMENT ON COLUMN user_profiles.last_study_date IS '最后学习日期';

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_study_date
ON user_profiles(last_study_date);

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('daily_goal', 'streak_days', 'last_study_date');
