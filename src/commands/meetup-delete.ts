import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { deleteMeetupById, getMeetupByIdWithGroup } from "../db/queries";
import { logger } from "../lib/logger";

export function addMeetupDeleteSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("delete")
      .setDescription("Delete a meetup you proposed")
      .addStringOption((option) =>
        option.setName("meetup_id").setDescription("Meetup ID").setRequired(true)
      )
  );
}

export async function handleMeetupDelete(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const meetupIdRaw = interaction.options.getString("meetup_id", true).trim();
  const meetupId = Number.parseInt(meetupIdRaw, 10);

  if (!Number.isInteger(meetupId) || meetupId <= 0) {
    await interaction.reply({ content: "Invalid meetup_id. It should be a positive integer.", ephemeral: true });
    return;
  }

  const meetup = await getMeetupByIdWithGroup(meetupId);
  if (!meetup || meetup.guildId !== interaction.guildId) {
    await interaction.reply({ content: "Meetup not found in this server.", ephemeral: true });
    return;
  }

  if (meetup.proposedBy !== interaction.user.id) {
    await interaction.reply({ content: "Only the user who proposed this meetup can delete it.", ephemeral: true });
    return;
  }

  if (meetup.channelId && meetup.messageId) {
    try {
      const channel = await interaction.client.channels.fetch(meetup.channelId);
      if (channel?.isTextBased() && "messages" in channel) {
        const message = await channel.messages.fetch(meetup.messageId);
        await message.delete();
      }
    } catch (error) {
      logger.warn("Failed to delete meetup message", {
        meetupId: meetup.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  await deleteMeetupById(meetup.id);

  await interaction.reply({ content: "Meetup deleted.", ephemeral: true });
}
