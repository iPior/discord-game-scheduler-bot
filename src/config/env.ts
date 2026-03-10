import { config } from "dotenv";

config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  DISCORD_TOKEN: requireEnv("DISCORD_TOKEN"),
  DISCORD_CLIENT_ID: requireEnv("DISCORD_CLIENT_ID"),
  DISCORD_GUILD_ID: requireEnv("DISCORD_GUILD_ID"),
  DATABASE_URL: process.env.DATABASE_URL?.trim() || "./sqlite.db",
  LOG_LEVEL: process.env.LOG_LEVEL?.trim().toLowerCase() || "info"
} as const;
