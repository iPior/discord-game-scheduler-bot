#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/discord-game-scheduler-bot"
SERVICE_NAME="discord-bot"
BUN_BIN="${BUN_BIN:-/home/${USER}/.bun/bin/bun}"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "Error: $APP_DIR is not a git repository"
  exit 1
fi

if [ ! -x "$BUN_BIN" ]; then
  echo "Error: bun not found at $BUN_BIN"
  echo "Set BUN_BIN env var if your bun path is different."
  exit 1
fi

echo "Deploying latest changes in $APP_DIR"
cd "$APP_DIR"

git pull --ff-only
"$BUN_BIN" install --frozen-lockfile
"$BUN_BIN" run db:migrate
sudo systemctl restart "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager

echo "Deploy complete."
