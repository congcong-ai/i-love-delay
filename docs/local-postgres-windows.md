# 本地开发：Windows 11 安装与配置 PostgreSQL（用于 Square 功能）

本指南帮助你在 Windows 11 本地安装与配置 PostgreSQL，并让本项目在开发模式下直接连接本地数据库（无需远程服务器）。

## 1. 安装 PostgreSQL

- 访问官网下载安装包（建议 16/17 版本）：
  https://www.postgresql.org/download/windows/
- 安装时会设置超级用户 `postgres` 的密码，请妥善保存。
- 安装勾选常用组件：PostgreSQL Server + Command Line Tools（包含 `psql`）。
- 安装完成后，将 `psql.exe` 所在的 bin 目录加入 PATH（通常为：`C:\Program Files\PostgreSQL\16\bin`）。

验证命令：
```powershell
psql --version
```

## 2. 创建应用用户与数据库

打开“Windows PowerShell”，执行：

```powershell
# 设置超级用户密码到环境变量（仅当前会话有效）
$env:PGUSER='postgres'
$env:PGPASSWORD='<你的postgres密码>'

# 连接本地数据库服务器，创建应用用户与开发库
psql -h localhost -p 5432 -c "CREATE ROLE app_user WITH LOGIN PASSWORD 'REPLACE_STRONG_PASSWORD';"
psql -h localhost -p 5432 -c "CREATE DATABASE i_love_delay_dev OWNER app_user;"

# 为开发库启用 pgcrypto 扩展（用于 gen_random_uuid()）
psql -h localhost -p 5432 -d i_love_delay_dev -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

> 你也可以使用 pgAdmin 图形界面完成以上步骤。

## 3. 初始化表结构（迁移）

在项目根目录（含有 `db/migrations/0001_init.sql`）执行：

```powershell
# 使用超级用户或库 owner 执行迁移脚本
$env:PGUSER='postgres'
$env:PGPASSWORD='<你的postgres密码>'
psql -h localhost -p 5432 -d i_love_delay_dev -f db/migrations/0001_init.sql
```

## 4. 配置本地环境变量

编辑项目根目录下的 `.env.local`，填写本地连接串：

```bash
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="i love delay (开发版)"
NEXT_PUBLIC_DEFAULT_LOCALE=zh

# 本地 PostgreSQL（开发库）
DATABASE_URL=postgres://app_user:REPLACE_STRONG_PASSWORD@localhost:5432/i_love_delay_dev
# 本地无需 SSL，可不设置 PGSSLMODE
# PGSSLMODE=require
```

> `.env.local` 已被 .gitignore 忽略，不会提交到仓库。

## 5. 启动开发服务器并验证

安装依赖（首次或新增依赖后）：
```powershell
npm install
```

启动开发：
```powershell
npm run dev
```

访问页面：
- 主页（创建任务）：http://localhost:3000/zh
- 拖延页（添加借口并“分享到广场”）：http://localhost:3000/zh/delayed
- 广场（展示分享）：http://localhost:3000/zh/square

只读接口检查：
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/square/share?limit=3 -UseBasicParsing
```

## 6. 常见问题

- 无法连接数据库：
  - 检查 `DATABASE_URL` 是否正确（账号/密码/端口/库名）。
  - 确认 PostgreSQL 服务已启动（在“服务”中可查看）。
  - 防火墙通常不影响本机回环访问（localhost），如使用非默认端口需确认。
- 迁移脚本报权限：
  - 请以超级用户或数据库 owner 连接并执行 `db/migrations/0001_init.sql`。
- 页面仍显示“开发环境 + 模拟数据”：
  - 表示 `/api/square/share` GET 调用失败。检查数据库连接与表结构是否创建正确，查看终端日志报错信息。
