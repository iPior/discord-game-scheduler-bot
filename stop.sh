#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${1:-discord-bot}"

echo "Stopping service: $SERVICE_NAME"
sudo systemctl stop "$SERVICE_NAME"
sudo systemctl status "$SERVICE_NAME" --no-pager

echo "Service stopped."
