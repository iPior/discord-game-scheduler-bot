import { Events } from "discord.js";
import { env } from "./config/env";
import { createDiscordClient, getCommandDefinitions } from "./lib/discord";
import { logger } from "./lib/logger";
import { isMeetupRsvpCustomId } from "./utils/custom-ids";
import { handleMeetupRsvpInteraction } from "./interactions/meetup-rsvp";

const client = createDiscordClient();
const commands = getCommandDefinitions();
const commandMap = new Map(commands.map((command) => [command.data.name, command]));

client.once(Events.ClientReady, (readyClient) => {
  logger.info("Bot connected", { user: readyClient.user.tag });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commandMap.get(interaction.commandName);
      if (!command) {
        await interaction.reply({
          content: "Unknown command.",
          ephemeral: true
        });
        return;
      }

      await command.execute(interaction);
      return;
    }

    if (interaction.isButton() && isMeetupRsvpCustomId(interaction.customId)) {
      await handleMeetupRsvpInteraction(interaction);
    }
  } catch (error) {
    logger.error("Interaction handler failed", {
      error: error instanceof Error ? error.message : String(error)
    });

    if (interaction.isRepliable()) {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "Something went wrong while handling that interaction.",
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: "Something went wrong while handling that interaction.",
          ephemeral: true
        });
      }
    }
  }
});

await client.login(env.DISCORD_TOKEN);
