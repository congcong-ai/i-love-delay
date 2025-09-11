# 自建部署指南（Ubuntu 24.04 + PostgreSQL + Supervisor + Nginx）

本文档指导将本项目从 Supabase 切换到自建 PostgreSQL，并在自有服务器（Ubuntu 24.04）上部署 Next.js 应用与反向代理。

## 架构说明

- 前端（浏览器）仅访问 Next.js 提供的 API 路由（如 `/api/square/share`）。
- Next.js 运行在服务器上（Node.js 运行时），在服务器端通过 `DATABASE_URL` 连接 PostgreSQL。
- 无需单独的后端项目，Next.js 的 API 路由就是后端。
- 数据库使用两个库（推荐命名）：
  - 生产库：`i_love_delay`
  - 开发库：`i_love_delay_dev`

> 命名建议采用全小写 + 下划线的 snake_case，避免连字符与大小写带来的兼容问题。

---

## 一、准备服务器环境

1) 更新系统

```bash
sudo apt update && sudo apt upgrade -y
```

2) 安装 Node.js（推荐 LTS 20/22）

使用官方 NodeSource（示例以 Node 20 为例）：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

3) 安装 Git（可选，若用 git 拉代码）

```bash
sudo apt install -y git
```

4) 安装 Nginx（反向代理）

```bash
sudo apt install -y nginx
nginx -v
```

5) 安装 Supervisor（进程守护）

```bash
sudo apt install -y supervisor
supervisord -v
```

---

## 二、安装 PostgreSQL 并初始化数据库

1) 安装 PostgreSQL（示例 PostgreSQL 16）

```bash
sudo apt install -y postgresql postgresql-contrib
psql --version
```

2) 创建数据库用户与数据库

```bash
sudo -u postgres psql <<'SQL'
-- 创建应用角色（请替换强密码）
CREATE ROLE i_love_delay  WITH LOGIN PASSWORD 'REPLACE_STRONG_PASSWORD';
-- 生产库
CREATE DATABASE i_love_delay OWNER i_love_delay;
-- 开发库
CREATE DATABASE i_love_delay_dev OWNER i_love_delay;
SQL
```

3) 为两个数据库启用扩展 `pgcrypto`（用于 `gen_random_uuid()`）并导入表结构

将项目代码上传至服务器任意目录，例如 `/var/www/delay.bebackpacker.com/`。

```bash
cd /var/www/delay.bebackpacker.com/
# 对生产库执行迁移
sudo -u postgres psql -d i_love_delay -f db/migrations/0001_init.sql
# 对开发库执行迁移
sudo -u postgres psql -d i_love_delay_dev -f db/migrations/0001_init.sql
```

> 如需远程访问数据库，请在 `postgresql.conf` 和 `pg_hba.conf` 中按需放行；默认仅本机可访问更安全。

---

## 三、配置环境变量

在项目目录创建 `.env.production`（生产）与 `.env.local`（本地开发），关键变量如下：

```bash
# 通用
NEXT_PUBLIC_APP_NAME="i love delay"
NEXT_PUBLIC_DEFAULT_LOCALE=zh

# 生产环境（示例）
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.example.com
DATABASE_URL=postgres://i_love_delay:REPLACE_STRONG_PASSWORD@127.0.0.1:5432/i_love_delay
# 如需 SSL：
# PGSSLMODE=require

# 开发环境（示例，本地直连线上 dev 库）
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgres://i_love_delay:REPLACE_STRONG_PASSWORD@<your-server-ip>:5432/i_love_delay_dev
```

> 注意：`DATABASE_URL` 仅在服务器端使用，前端无法读取；`NEXT_PUBLIC_` 前缀的变量才会暴露给浏览器。

---

## 四、构建与运行（服务器）

在服务器项目目录执行：

```bash
# 安装依赖
npm ci
# 或 npm install

# 构建生产包
npm run build

# 以 3000 端口启动（测试用）
npm start
# 然后访问 http://SERVER_IP:3000/zh 验证页面
```

---

## 四点五、本地到服务器一键部署（推荐）

使用 `deploy.sh` 的“server 模式”，在本地完成 standalone 构建并仅上传产物，然后通过 Supervisor 重启服务。

1) 在项目根目录配置 `.env.local`：

```dotenv
# 远程服务器信息
SERVER=49.235.209.193
SSH_USER=deployer
# 可选：SSH 私钥（未使用 ssh-agent 时）
# SSH_KEY=/Users/you/.ssh/id_rsa

# 远端目录与进程名
REMOTE_DIR=/var/www/delay.bebackpacker.com
SUPERVISOR=delay.bebackpacker.com

# 端口（优先级：SERVER_PORT > PORT > DEPLOY_PORT）
DEPLOY_PORT=3002
```

2) 服务器侧准备（仅首次）：

- 创建 `REMOTE_DIR` 目录，并放置 `.env`（生产环境变量）。
- 允许 `deployer` 免密使用 `sudo supervisorctl`（否则脚本将无法重启）：

```bash
echo 'deployer ALL=(ALL) NOPASSWD: /usr/bin/supervisorctl' | sudo tee /etc/sudoers.d/deployer-supervisorctl
sudo visudo -cf /etc/sudoers.d/deployer-supervisorctl
```

- 按照模板创建 Supervisor program（见后文“使用 Supervisor 常驻运行”）。

3) 本地执行部署：

```bash
./deploy.sh
# 选择 2) server - 远程部署（本地构建 standalone，上传产物，Supervisor 重启）
```

流程说明：

- 本地使用 `.env.production` 进行 `next build` 并产出 `.next/standalone` 与 `.next/static`。
- 脚本仅上传构建产物（.next/standalone、.next/static、public、messages、package.json），不覆盖服务器 `.env`。
- 服务器端通过 `sudo -n supervisorctl` 停止 → 清理端口 → 启动，零停机/最小停机。

---

## 五、使用 Supervisor 常驻运行（standalone 推荐）

创建 `/etc/supervisor/conf.d/delay.bebackpacker.com.conf`：

```ini
[program:delay.bebackpacker.com]
directory=/var/www/delay.bebackpacker.com
command=/bin/bash -lc 'set -a && source .env && exec /usr/bin/node .next/standalone/server.js'
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true

# 将日志写入项目目录，避免 /var/log 权限问题
stderr_logfile=/var/www/delay.bebackpacker.com/logs/app.err.log
stdout_logfile=/var/www/delay.bebackpacker.com/logs/app.out.log

# 生产环境变量（如 .env 中已含 PORT，可移除此项）
environment=NODE_ENV="production",PORT="3002"

# 运行用户
user=deployer
```

应用配置并启动：

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status delay.bebackpacker.com
# 重启：
sudo supervisorctl restart delay.bebackpacker.com
```

注意：

- 确保 `/usr/bin/node` 为真实的 Node 绝对路径（`command -v node` 查询）。
- 确保 `${REMOTE_DIR}/logs` 目录存在且可写（`deploy.sh` 会自动创建）。

---

## 六、配置 Nginx 反向代理与 TLS

1) 新建站点配置 `/etc/nginx/sites-available/delay.bebackpacker.com.conf`

```nginx
upstream i_love_delay_upstream {
    server 127.0.0.1:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name delay.bebackpacker.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name delay.bebackpacker.com;

    # ssl_certificate     /etc/letsencrypt/live/delay.bebackpacker.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/delay.bebackpacker.com/privkey.pem;

    # 基础安全头
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Resource-Policy "same-site" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    client_max_body_size 10m;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 直接本地输出 Next 静态资源，避免经过 Node
    location /_next/static/ {
        alias /var/www/delay.bebackpacker.com/.next/static/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        access_log off;
    }

    # 其他静态路径仍可按需缓存后走上游
    location ~* ^/(?:static|assets)/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        proxy_pass http://i_love_delay_upstream;
    }

    location / {
        proxy_read_timeout 60s;
        send_timeout 60s;
        proxy_pass http://i_love_delay_upstream;
    }
}
```

2) 启用站点并重载 Nginx

```bash
sudo ln -s /etc/nginx/sites-available/delay.bebackpacker.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

3) 配置 HTTPS（推荐使用 Certbot）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d delay.bebackpacker.com
```

---

## 七、端到端验证（E2E）

- 访问主页 `https://your-domain.example.com/zh` 创建任务。
- 打开拖延页 `https://your-domain.example.com/zh/delayed` 添加借口并点击“分享到广场”。
- 打开广场页 `https://your-domain.example.com/zh/square` 校验分享是否展示。
- 可直接请求只读接口验证：

```bash
curl -s 'https://your-domain.example.com/api/square/share?limit=3' | jq
```

---

## 八、常见问题

- 无法连接数据库
  - 核对 `DATABASE_URL`、防火墙、`pg_hba.conf` 与 `postgresql.conf`。
  - 本机部署推荐使用 `127.0.0.1` 并仅本机监听。
- API 报错但页面仍显示数据
  - 开发模式下页面会回退到 mock 数据，这是预期行为。生产环境应确保接口可用。
- 端口被占用
  - 调整 `npm start` 端口：`next start -p 3001`，并同步修改 Nginx `proxy_pass`。

---

## 九、后续可选优化

- 使用系统用户专门运行服务，并最小化数据库权限。
- 为任务/借口等业务数据添加更多表与索引。
- 将部署流程容器化（Docker + docker-compose），便于一键部署与回滚。
- 使用 Prometheus + Grafana 监控运行状况。
