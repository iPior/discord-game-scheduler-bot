import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import {
  getMeetupByIdWithGroup,
  listRsvpUserIdsByResponse,
  updateMeetupDetails
} from "../db/queries";
import { buildMeetupEmbed, buildMeetupRsvpRow } from "../utils/embeds";
import { logger } from "../lib/logger";

export function addMeetupEditSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("edit")
      .setDescription("Edit a meetup you proposed")
      .addStringOption((option) =>
        option.setName("meetup_id").setDescription("Meetup ID").setRequired(true)
      )
      .addStringOption((option) =>
        option.setName("title").setDescription("New title").setRequired(false)
      )
      .addStringOption((option) =>
        option.setName("time").setDescription("New time").setRequired(false)
      )
  );
}

export async function handleMeetupEdit(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const meetupIdRaw = interaction.options.getString("meetup_id", true).trim();
  const meetupId = Number.parseInt(meetupIdRaw, 10);
  const newTitle = interaction.options.getString("title")?.trim();
  const newTime = interaction.options.getString("time")?.trim();

  if (!Number.isInteger(meetupId) || meetupId <= 0) {
    await interaction.reply({ content: "Invalid meetup_id. It should be a positive integer.", ephemeral: true });
    return;
  }

  if (!newTitle && !newTime) {
    await interaction.reply({ content: "Provide at least one field to edit: title or time.", ephemeral: true });
    return;
  }

  const meetup = await getMeetupByIdWithGroup(meetupId);
  if (!meetup || meetup.guildId !== interaction.guildId) {
    await interaction.reply({ content: "Meetup not found in this server.", ephemeral: true });
    return;
  }

  if (meetup.proposedBy !== interaction.user.id) {
    await interaction.reply({ content: "Only the user who proposed this meetup can edit it.", ephemeral: true });
    return;
  }

  await updateMeetupDetails({
    meetupId: meetup.id,
    title: newTitle,
    timeText: newTime
  });

  const updatedMeetup = await getMeetupByIdWithGroup(meetup.id);
  if (!updatedMeetup) {
    await interaction.reply({ content: "Meetup no longer exists.", ephemeral: true });
    return;
  }

  const [joinUserIds, maybeUserIds, cantUserIds] = await Promise.all([
    listRsvpUserIdsByResponse(updatedMeetup.id, "join"),
    listRsvpUserIdsByResponse(updatedMeetup.id, "maybe"),
    listRsvpUserIdsByResponse(updatedMeetup.id, "cant")
  ]);

  const embed = buildMeetupEmbed({
    meetupId: updatedMeetup.id,
    title: updatedMeetup.title,
    groupName: updatedMeetup.groupName,
    proposedByUserId: updatedMeetup.proposedBy,
    timeText: updatedMeetup.timeText,
    rsvpUserIds: {
      join: joinUserIds,
      maybe: maybeUserIds,
      cant: cantUserIds
    }
  });

  if (updatedMeetup.channelId && updatedMeetup.messageId) {
    try {
      const channel = await interaction.client.channels.fetch(updatedMeetup.channelId);
      if (channel?.isTextBased() && "messages" in channel) {
        const message = await channel.messages.fetch(updatedMeetup.messageId);
        await message.edit({ embeds: [embed], components: [buildMeetupRsvpRow(updatedMeetup.id)] });
      }
    } catch (error) {
      logger.warn("Failed to update meetup message after edit", {
        meetupId: updatedMeetup.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  await interaction.reply({ content: "Meetup updated.", ephemeral: true });
}
