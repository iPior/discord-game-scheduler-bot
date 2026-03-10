import { REST, Routes } from "discord.js";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { getCommandPayloads } from "./lib/discord";

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
const payloads = getCommandPayloads();

logger.info("Deploying guild commands", {
  guildId: env.DISCORD_GUILD_ID,
  count: payloads.length
});

await rest.put(
  Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID),
  { body: payloads }
);

logger.info("Guild commands deployed successfully");
