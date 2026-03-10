import { env } from "../config/env";
import { nowIso } from "../utils/time";

type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const minimumLevel = (["debug", "info", "warn", "error"].includes(env.LOG_LEVEL)
  ? env.LOG_LEVEL
  : "info") as LogLevel;

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[minimumLevel];
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;

  const payload = {
    time: nowIso(),
    level,
    message,
    ...(meta ?? {})
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    write("debug", message, meta);
  },
  info(message: string, meta?: Record<string, unknown>) {
    write("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    write("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    write("error", message, meta);
  }
};
