-- V2.1 Updates - Only add new columns to existing user_profiles table
-- Execute this in a NEW QUERY (not in the existing schema file)

-- Add daily_goal column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS daily_goal INT DEFAULT 20;

-- Add streak_days column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;

-- Add last_study_date column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Add comments
COMMENT ON COLUMN user_profiles.daily_goal IS '每日学习目标单词数';
COMMENT ON COLUMN user_profiles.streak_days IS '连续学习天数';
COMMENT ON COLUMN user_profiles.last_study_date IS '最后学习日期';

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_study_date
ON user_profiles(last_study_date);

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
AND column_name IN ('daily_goal', 'streak_days', 'last_study_date');
