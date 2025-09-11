#!/usr/bin/env bash
# 交互式部署与本地开发脚本
# 使用方式：
#   1) 交互式：  ./deploy.sh
#   2) 本地开发：./deploy.sh local
#   3) 远程部署：./deploy.sh server
# 
# 说明：
# - 优先在本地（macOS）执行 rsync，将代码推送至远程服务器。
# - 从 .env.local 读取连接与部署配置：SERVER, SSH_USER, SSH_KEY(可选), REMOTE_DIR,
#   DEPLOY_PORT/SERVER_PORT/PORT, SUPERVISOR/DEPLOY_SUPERVISOR。
# - 远程步骤：npm ci -> npm run build -> (可选) npm prune --omit=dev -> supervisor 重启。
# - 本地步骤：根据 NEXT_PUBLIC_APP_URL 自动识别端口，先杀端口再启动 next dev。

set -Eeuo pipefail

# 全局默认
ENV_FILE=".env.local"
DEFAULT_LOCAL_PORT=3000
DEFAULT_DEPLOY_PORT=3002
SSH_PORT_DEFAULT=22

# 颜色输出（可选）
C_BLUE='\033[0;34m'
C_GREEN='\033[0;32m'
C_YELLOW='\033[0;33m'
C_RED='\033[0;31m'
C_RESET='\033[0m'

log()  { echo -e "${C_BLUE}[INFO]${C_RESET} $*"; }
ok()   { echo -e "${C_GREEN}[OK]  ${C_RESET} $*"; }
warn() { echo -e "${C_YELLOW}[WARN]${C_RESET} $*"; }
err()  { echo -e "${C_RED}[ERR] ${C_RESET} $*"; }

die() { err "$*"; exit 1; }

command_exists() { command -v "$1" >/dev/null 2>&1; }

load_env() {
  if [[ -f "$ENV_FILE" ]]; then
    log "加载环境文件: $ENV_FILE"
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
  else
    warn "未找到 $ENV_FILE，部分功能需要该文件中的 SERVER/SSH_USER/REMOTE_DIR 等变量"
  fi
}

parse_port_from_url() {
  # 从 URL 中提取端口号，若未匹配则返回默认值
  local url="$1"; shift || true
  local fallback="${1:-$DEFAULT_LOCAL_PORT}"
  if [[ "$url" =~ :([0-9]{2,5}) ]]; then
    echo "${BASH_REMATCH[1]}"
  else
    echo "$fallback"
  fi
}

get_local_port() {
  local port="$DEFAULT_LOCAL_PORT"
  if [[ -n "${NEXT_PUBLIC_APP_URL:-}" ]]; then
    port=$(parse_port_from_url "$NEXT_PUBLIC_APP_URL" "$DEFAULT_LOCAL_PORT")
  fi
  echo "$port"
}

get_deploy_port() {
  # 优先级：SERVER_PORT > PORT > DEPLOY_PORT > 默认
  local port="${SERVER_PORT:-${PORT:-${DEPLOY_PORT:-}}}"
  if [[ -z "$port" ]]; then
    port="$DEFAULT_DEPLOY_PORT"
  fi
  echo "$port"
}

get_supervisor_name() {
  # 优先级：SUPERVISOR > DEPLOY_SUPERVISOR
  local name="${SUPERVISOR:-${DEPLOY_SUPERVISOR:-}}"
  echo "$name"
}

kill_port() {
  local port="$1"
  if [[ -z "$port" ]]; then
    return 0
  fi
  log "尝试清理端口 $port ..."
  if command_exists lsof; then
    local pids
    if pids=$(lsof -ti:"$port" || true); then
      if [[ -n "$pids" ]]; then
        kill -9 $pids || true
        ok "已终止占用端口 $port 的进程"
      else
        ok "端口 $port 未被占用"
      fi
    else
      ok "端口 $port 未被占用"
    fi
  elif command_exists fuser; then
    fuser -k "$port"/tcp || true
    ok "尝试通过 fuser 清理端口 $port"
  else
    warn "未找到 lsof/fuser，跳过端口清理"
  fi
}

ssh_key_opt() {
  if [[ -n "${SSH_KEY:-}" ]]; then
    echo "-i $SSH_KEY"
  else
    echo ""
  fi
}

ssh_port_opt() {
  local port="${SSH_PORT:-$SSH_PORT_DEFAULT}"
  echo "-p $port"
}

ssh_exec() {
  # 在远端以 bash -lc 执行传入的单行命令
  local remote_cmd="$1"
  local key_opt; key_opt=$(ssh_key_opt)
  local port_opt; port_opt=$(ssh_port_opt)
  [[ -n "${SSH_USER:-}" ]] || die "SSH_USER 未设置（请在 $ENV_FILE 中配置）"
  [[ -n "${SERVER:-}" ]]   || die "SERVER 未设置（请在 $ENV_FILE 中配置）"
  ssh -o StrictHostKeyChecking=no $port_opt $key_opt "${SSH_USER}@${SERVER}" /bin/bash -lc "$remote_cmd"
}

ensure_remote_dir() {
  [[ -n "${REMOTE_DIR:-}" ]] || die "REMOTE_DIR 未设置（请在 $ENV_FILE 中配置）"
  log "确保远端目录存在：${REMOTE_DIR}"
  local cmd
  cmd=$(printf "set -euo pipefail; mkdir -p %q" "$REMOTE_DIR")
  ssh_exec "$cmd"
}

rsync_push() {
  # 将当前项目目录推送到远程 REMOTE_DIR
  ensure_remote_dir
  [[ -n "${SSH_USER:-}" ]] || die "SSH_USER 未设置"
  [[ -n "${SERVER:-}" ]]   || die "SERVER 未设置"
  [[ -n "${REMOTE_DIR:-}" ]] || die "REMOTE_DIR 未设置"

  if ! command_exists rsync; then
    die "本机未安装 rsync，请先安装（macOS 可使用: brew install rsync）"
  fi

  local ssh_cmd="ssh -o StrictHostKeyChecking=no $(ssh_port_opt) $(ssh_key_opt)"
  log "开始 rsync 推送到 ${SSH_USER}@${SERVER}:${REMOTE_DIR}"
  rsync -azP --delete \
    --filter=':- .gitignore' \
    --filter='P .env' \
    --filter='P .env*' \
    --exclude ".git" \
    --exclude "node_modules" \
    --exclude ".next" \
    --exclude ".env" \
    --exclude ".env*" \
    --exclude ".vercel" \
    --exclude ".DS_Store" \
    -e "$ssh_cmd" \
    ./ "${SSH_USER}@${SERVER}:${REMOTE_DIR}/"
  ok "rsync 推送完成"
}

# 本地构建（standalone）并产出可直接运行的 server.js
local_build_artifacts() {
  log "开始本地构建（standalone 模式）..."
  if ! command_exists npm; then
    die "未找到 npm，请先安装 Node.js/npm"
  fi
  npm ci
  # 使用生产环境变量进行构建，避免 .env.local 污染
  if [[ -f ".env.production" ]]; then
    log "加载 .env.production 用于本地生产构建环境"
    # shellcheck disable=SC1090
    set -a; source ".env.production"; set +a
  else
    warn ".env.production 未找到，将使用当前环境变量进行构建"
  fi
  NODE_ENV=production npm run build
  # 校验产物
  if [[ ! -f ".next/standalone/server.js" ]]; then
    die "未发现 .next/standalone/server.js，请确认 next.config.ts 已设置 output: 'standalone' 并构建成功"
  fi
  ok "本地构建完成"
}

# 确保远端产物目录存在
ensure_remote_artifact_dirs() {
  [[ -n "${REMOTE_DIR:-}" ]] || die "REMOTE_DIR 未设置"
  local r_root; r_root=$(printf %q "${REMOTE_DIR}")
  local r_standalone; r_standalone=$(printf %q "${REMOTE_DIR}/.next/standalone")
  local r_static; r_static=$(printf %q "${REMOTE_DIR}/.next/static")
  local r_public; r_public=$(printf %q "${REMOTE_DIR}/public")
  local r_logs; r_logs=$(printf %q "${REMOTE_DIR}/logs")
  ssh_exec "set -euo pipefail; mkdir -p $r_root $r_standalone $r_static $r_public $r_logs"
}

# 上传构建产物到远端（只同步必要文件/目录）
rsync_push_artifacts() {
  ensure_remote_artifact_dirs
  [[ -n "${SSH_USER:-}" ]] || die "SSH_USER 未设置"
  [[ -n "${SERVER:-}" ]]   || die "SERVER 未设置"
  [[ -n "${REMOTE_DIR:-}" ]] || die "REMOTE_DIR 未设置"

  if ! command_exists rsync; then
    die "本机未安装 rsync，请先安装（macOS 可使用: brew install rsync）"
  fi

  local ssh_cmd="ssh -o StrictHostKeyChecking=no $(ssh_port_opt) $(ssh_key_opt)"
  log "上传产物到 ${SSH_USER}@${SERVER}:${REMOTE_DIR} (standalone)"

  # 1) .next/standalone -> 远端 .next/standalone（删除远端多余文件）
  rsync -azP --delete \
    -e "$ssh_cmd" \
    .next/standalone/ "${SSH_USER}@${SERVER}:${REMOTE_DIR}/.next/standalone/"

  # 2) .next/static -> 远端 .next/static（删除远端多余文件）
  rsync -azP --delete \
    -e "$ssh_cmd" \
    .next/static/ "${SSH_USER}@${SERVER}:${REMOTE_DIR}/.next/static/"

  # 3) public -> 远端 public（删除远端多余文件）
  if [[ -d public ]]; then
    rsync -azP --delete \
      -e "$ssh_cmd" \
      public/ "${SSH_USER}@${SERVER}:${REMOTE_DIR}/public/"
  fi

  # 4) 其他运行期需要的文件（可选）：messages 等
  if [[ -d messages ]]; then
    rsync -azP --delete \
      -e "$ssh_cmd" \
      messages/ "${SSH_USER}@${SERVER}:${REMOTE_DIR}/messages/"
  fi

  # 5) package.json（可选，便于记录版本信息；不会触发远端安装）
  if [[ -f package.json ]]; then
    rsync -azP -e "$ssh_cmd" package.json "${SSH_USER}@${SERVER}:${REMOTE_DIR}/package.json"
  fi

  ok "产物上传完成"
}

remote_install_build() {
  [[ -n "${REMOTE_DIR:-}" ]] || die "REMOTE_DIR 未设置"
  log "在远端安装依赖并构建 (npm ci && npm run build) ..."
  local rdq; rdq=$(printf %q "$REMOTE_DIR")
  ssh_exec "set -euo pipefail; cd $rdq; npm ci; npm run build; npm prune --omit=dev || true"
  ok "远端构建完成"
}

remote_restart() {
  local program=""; program=$(get_supervisor_name)
  local port=""; port=$(get_deploy_port)
  [[ -n "$program" ]] || die "SUPERVISOR/DEPLOY_SUPERVISOR 未设置（program 名）"
  log "通过 Supervisor 重启程序: ${program}（先停再启，清理端口 ${port}）"
  local rdq; rdq=$(printf %q "$REMOTE_DIR")
  local progq; progq=$(printf %q "$program")
  ssh_exec "set -euo pipefail; cd $rdq; \
    CTL=supervisorctl; \
    \$CTL status >/dev/null 2>&1 || CTL='sudo -n supervisorctl'; \
    \$CTL stop $progq >/dev/null 2>&1 || true; \
    if command -v lsof >/dev/null 2>&1; then \
      PIDS=\$(lsof -ti:$port || true); \
      if [ -n \"\$PIDS\" ]; then kill -9 \$PIDS || true; fi; \
    fi; \
    \$CTL start $progq"
  ok "Supervisor 重启完成"
}

run_server_deploy() {
  load_env
  [[ -n "${SSH_USER:-}" ]]   || die "请在 $ENV_FILE 中设置 SSH_USER"
  [[ -n "${SERVER:-}" ]]     || die "请在 $ENV_FILE 中设置 SERVER"
  [[ -n "${REMOTE_DIR:-}" ]] || die "请在 $ENV_FILE 中设置 REMOTE_DIR"

  # 输出关键变量，便于诊断
  log "部署信息（本地构建 + 上传产物）："
  log "  SSH_USER     = ${SSH_USER}"
  log "  SERVER       = ${SERVER}"
  log "  SSH_PORT     = ${SSH_PORT:-$SSH_PORT_DEFAULT}"
  log "  SSH_KEY      = ${SSH_KEY:-<agent_or_config>}"
  log "  REMOTE_DIR   = ${REMOTE_DIR}"
  log "  SUPERVISOR   = $(get_supervisor_name)"
  log "  DEPLOY_PORT  = $(get_deploy_port)"

  local_build_artifacts
  rsync_push_artifacts
  remote_restart
}

run_local_dev() {
  load_env
  local port; port=$(get_local_port)
  log "本地开发模式：准备启动 next dev，端口：$port（先清理端口）"
  kill_port "$port"
  # 使用 npm 启动（package.json 已有 dev 脚本，但其中仅清理 3000 端口，此处再按实际端口清理一次）
  ok "开始启动开发服务..."
  exec npm run dev -- -p "$port"
}

prompt_mode() {
  echo "请选择运行模式："
  echo "  1) local  - 本地开发调试（macOS）"
  echo "  2) server - 远程部署（本地构建 standalone，上传产物，Supervisor 重启）"
  echo "  3) 退出"
  read -rp "输入选项序号 [1/2/3]: " choice
  case "$choice" in
    1) run_local_dev ;;
    2) run_server_deploy ;;
    3) exit 0 ;;
    *) warn "无效输入"; prompt_mode ;;
  esac
}

main() {
  local mode="${1:-}"
  case "$mode" in
    local)  run_local_dev ;;
    server) run_server_deploy ;;
    "")    prompt_mode ;;
    *)      warn "未知模式: $mode"; prompt_mode ;;
  esac
}

main "$@"
