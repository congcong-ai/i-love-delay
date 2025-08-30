-- 创建广场分享表
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建评论表
CREATE TABLE IF NOT EXISTS public_task_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  public_task_id UUID REFERENCES public_tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建用户互动表（点赞、收藏）
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_task_id UUID REFERENCES public_tasks(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('like', 'favorite')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, public_task_id, interaction_type)
);

-- 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_public_tasks_user_id ON public_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_public_tasks_created_at ON public_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_task_comments_task_id ON public_task_comments(public_task_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_task ON user_interactions(user_id, public_task_id);

-- 创建更新时间的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_tasks_updated_at BEFORE UPDATE ON public_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 设置RLS（行级安全）
ALTER TABLE public_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有用户读取广场内容
CREATE POLICY "Allow read access to all users" ON public_tasks
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to comments" ON public_task_comments
    FOR SELECT USING (true);

-- 创建策略：用户只能创建自己的分享
CREATE POLICY "Users can create their own shares" ON public_tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 创建策略：用户只能删除自己的分享
CREATE POLICY "Users can delete their own shares" ON public_tasks
    FOR DELETE USING (auth.uid()::text = user_id);

-- 创建策略：用户只能创建自己的评论
CREATE POLICY "Users can create their own comments" ON public_task_comments
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 创建策略：用户只能删除自己的评论
CREATE POLICY "Users can delete their own comments" ON public_task_comments
    FOR DELETE USING (auth.uid()::text = user_id);

-- 创建策略：用户只能管理自己的互动
CREATE POLICY "Users can manage their own interactions" ON user_interactions
    FOR ALL USING (auth.uid()::text = user_id);