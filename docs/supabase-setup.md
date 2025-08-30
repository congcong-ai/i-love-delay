# Supabase 配置指南

## 🚀 快速开始

### 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `i-love-delay`
   - **Database Password**: 设置一个强密码
   - **Region**: **Singapore (Singapore)** ⭐ 推荐

### 🌏 区域选择建议

**对于中国大陆江浙沪用户，强烈推荐选择 Singapore (Singapore)**

| 区域 | 延迟(江浙沪) | 推荐指数 | 备注 |
|------|-------------|----------|------|
| **Singapore** | 30-50ms | ⭐⭐⭐⭐⭐ | **最佳选择** |
| Tokyo | 50-80ms | ⭐⭐⭐⭐ | 次选 |
| Seoul | 60-90ms | ⭐⭐⭐ | 备选 |
| US West | 150-200ms | ⭐⭐ | 延迟较高 |
| EU West | 200-300ms | ⭐ | 延迟最高 |

**选择Singapore的理由：**
- ✅ 地理位置最近（距离江浙沪约2000公里）
- ✅ 网络延迟最低（30-50ms）
- ✅ 稳定性最好
- ✅ 对中国大陆访问限制较少

### 2. 获取配置信息

项目创建完成后，在 **Settings > API** 页面找到：
- **Project URL**: `https://[your-project].supabase.co`
- **anon/public key**: 复制这个key

### 3. 配置环境变量

**重要：使用 `.env.local` 而不是 `.env`**

将以下信息填入 `.env.local` 文件：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

**为什么使用 `.env.local`：**
- ✅ 自动被 `.gitignore` 忽略，避免敏感信息泄露
- ✅ Next.js官方推荐用于敏感信息
- ✅ 每个开发者可以有自己的配置
- ✅ 生产环境变量通过平台配置

## 🗄️ 数据库初始化

### 1. 创建数据表

在Supabase的 **SQL Editor** 中执行以下SQL：

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任务表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('todo', 'completed', 'delayed')) DEFAULT 'todo',
  delay_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 借口表
CREATE TABLE excuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 广场任务表
CREATE TABLE public_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户交互表（点赞、收藏）
CREATE TABLE user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  public_task_id UUID REFERENCES public_tasks(id) ON DELETE CASCADE,
  interaction_type TEXT CHECK (interaction_type IN ('like', 'favorite')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, public_task_id, interaction_type)
);

-- 评论表
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  public_task_id UUID REFERENCES public_tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_excuses_task_id ON excuses(task_id);
CREATE INDEX idx_public_tasks_user_id ON public_tasks(user_id);
CREATE INDEX idx_public_tasks_created_at ON public_tasks(created_at DESC);
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_comments_public_task_id ON comments(public_task_id);

-- 创建视图：广场任务列表
CREATE VIEW public_tasks_view AS
SELECT 
  pt.id,
  pt.task_id,
  pt.user_id,
  u.nickname as user_name,
  u.avatar as user_avatar,
  t.name as task_name,
  t.delay_count,
  e.content as excuse,
  e.word_count,
  pt.likes_count,
  pt.created_at
FROM public_tasks pt
JOIN users u ON pt.user_id = u.id
JOIN tasks t ON pt.task_id = t.id
LEFT JOIN excuses e ON t.id = e.task_id
WHERE pt.is_public = true;

-- 创建视图：用户统计
CREATE VIEW user_stats_view AS
SELECT 
  u.id as user_id,
  u.nickname,
  u.avatar,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'delayed' THEN 1 END) as delayed_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  COALESCE(SUM(t.delay_count), 0) as total_delays,
  MAX(t.created_at) as last_activity
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.nickname, u.avatar;
```

### 2. 启用行级安全 (RLS)

```sql
-- 启用RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 用户表策略
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- 任务表策略
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- 广场任务策略
CREATE POLICY "Public tasks are viewable by everyone" ON public_tasks FOR SELECT USING (true);
CREATE POLICY "Users can manage own public tasks" ON public_tasks FOR ALL USING (auth.uid() = user_id);

-- 交互策略
CREATE POLICY "Users can view all interactions" ON user_interactions FOR SELECT USING (true);
CREATE POLICY "Users can manage own interactions" ON user_interactions FOR ALL USING (auth.uid() = user_id);

-- 评论策略
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can manage own comments" ON comments FOR ALL USING (auth.uid() = user_id);
```

### 3. 创建存储过程

```sql
-- 创建或更新用户
CREATE OR REPLACE FUNCTION create_or_update_user(user_openid TEXT, user_nickname TEXT, user_avatar TEXT)
RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  INSERT INTO users (openid, nickname, avatar)
  VALUES (user_openid, user_nickname, user_avatar)
  ON CONFLICT (openid) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    updated_at = NOW()
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- 同步任务数据
CREATE OR REPLACE FUNCTION sync_task_data(
  p_user_id UUID,
  p_tasks JSONB
) RETURNS VOID AS $$
BEGIN
  -- 处理任务同步逻辑
  -- 这里可以添加更复杂的同步逻辑
END;
$$ LANGUAGE plpgsql;
```

## 🔐 认证设置

### 1. 创建自定义JWT认证

在 **Authentication > Providers** 中：

1. 点击 "Add Provider"
2. 选择 "Custom"
3. 配置如下：

```json
{
  "name": "wechat",
  "type": "custom",
  "enabled": true,
  "config": {
    "jwt_secret": "your-jwt-secret-key"
  }
}
```

### 2. 创建边缘函数（Edge Functions）

创建 `supabase/functions/wechat-auth/index.ts`：

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { openid, nickname, avatar } = await req.json()
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .upsert({ openid, nickname, avatar })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

## 🧪 测试数据

### 插入测试数据

```sql
-- 插入测试用户
INSERT INTO users (openid, nickname, avatar) VALUES
('test_openid_1', '拖延大师', 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'),
('test_openid_2', '借口专家', 'https://api.dicebear.com/7.x/avataaars/svg?seed=2');

-- 插入测试任务
INSERT INTO tasks (user_id, name, status, delay_count) VALUES
((SELECT id FROM users WHERE openid = 'test_openid_1'), '学习React', 'delayed', 5),
((SELECT id FROM users WHERE openid = 'test_openid_1'), '健身计划', 'delayed', 3),
((SELECT id FROM users WHERE openid = 'test_openid_2'), '读书计划', 'delayed', 7);

-- 插入测试借口
INSERT INTO excuses (task_id, content, word_count) VALUES
((SELECT id FROM tasks WHERE name = '学习React' LIMIT 1), '今天状态不好，明天一定学！', 14),
((SELECT id FROM tasks WHERE name = '健身计划' LIMIT 1), '天气太冷了，等暖和点再去', 15);

-- 插入广场任务
INSERT INTO public_tasks (task_id, user_id) VALUES
((SELECT id FROM tasks WHERE name = '学习React' LIMIT 1), 
 (SELECT id FROM users WHERE openid = 'test_openid_1'));
```

## 📊 监控和优化

### 1. 性能监控

在 **Settings > Infrastructure** 中：
- 启用 **Database Performance**
- 设置 **Connection Pooling**
- 配置 **Query Performance**

### 2. 备份策略

在 **Settings > Infrastructure > Backups** 中：
- 启用自动备份（每日）
- 设置备份保留期（7天）
- 配置跨区域备份

## 🔧 本地开发配置

### 1. 安装Supabase CLI

```bash
# 安装Supabase CLI
npm install -g supabase

# 登录
supabase login

# 初始化项目
supabase init
```

### 2. 本地开发环境

```bash
# 启动本地Supabase
supabase start

# 查看状态
supabase status

# 停止本地服务
supabase stop
```

## 📞 技术支持

- **Supabase文档**: https://supabase.com/docs
- **Discord社区**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

*配置完成后，记得将实际的URL和密钥填入.env.local文件*