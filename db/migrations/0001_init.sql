-- Enable required extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Public square share table
CREATE TABLE IF NOT EXISTS public_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id TEXT NOT NULL,
  task_name TEXT NOT NULL,
  excuse TEXT NOT NULL,
  delay_count INTEGER DEFAULT 0,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  likes_count INTEGER DEFAULT 0,
  is_liked BOOLEAN DEFAULT FALSE,
  is_favorited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS public_task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_task_id UUID REFERENCES public_tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions (like, favorite)
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_task_id UUID REFERENCES public_tasks(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('like', 'favorite')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, public_task_id, interaction_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_public_tasks_user_id ON public_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_public_tasks_created_at ON public_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_task_comments_task_id ON public_task_comments(public_task_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_task ON user_interactions(user_id, public_task_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_public_tasks_updated_at ON public_tasks;
CREATE TRIGGER update_public_tasks_updated_at
BEFORE UPDATE ON public_tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
