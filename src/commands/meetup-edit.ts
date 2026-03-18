import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import {
  getMeetupByIdWithGroup,
  getGuildDefaultTimeZone,
  listRsvpUserIdsByResponse,
  updateMeetupDetails
} from "../db/queries";
import { buildMeetupEmbed, buildMeetupRsvpRow } from "../utils/embeds";
import { logger } from "../lib/logger";
import { buildMeetupSchedule, calculateMeetupProposalExpiresAt, nowUnixSeconds } from "../utils/time";

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
        option
          .setName("date")
          .setDescription("New date in YYYY-MM-DD")
          .setRequired(false)
      )
      .addStringOption((option) =>
        option
          .setName("time")
          .setDescription("New time in HH:MM or h:MM AM/PM")
          .setRequired(false)
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
  const newDate = interaction.options.getString("date")?.trim();
  const newTimeInput = interaction.options.getString("time")?.trim();

  const hasAnyTimePart = Boolean(newDate || newTimeInput);
  const hasAllTimeParts = Boolean(newDate && newTimeInput);

  if (!Number.isInteger(meetupId) || meetupId <= 0) {
    await interaction.reply({ content: "Invalid meetup_id. It should be a positive integer.", ephemeral: true });
    return;
  }

  if (!newTitle && !hasAnyTimePart) {
    await interaction.reply({ content: "Provide at least one field to edit: title or date/time.", ephemeral: true });
    return;
  }

  if (hasAnyTimePart && !hasAllTimeParts) {
    await interaction.reply({ content: "To edit meetup time, provide both date and time.", ephemeral: true });
    return;
  }

  let newTimeText: string | undefined;
  let newStartsAt: number | undefined;
  let newExpiresAt: number | undefined;
  if (hasAllTimeParts) {
    const defaultTimeZone = await getGuildDefaultTimeZone(interaction.guildId);
    if (!defaultTimeZone) {
      await interaction.reply({
        content: "This server does not have a default meetup timezone yet. Ask an admin to run `/meetup timezone-set` and pick one from the list.",
        ephemeral: true
      });
      return;
    }

    const meetupSchedule = buildMeetupSchedule({
      dateInput: newDate!,
      timeInput: newTimeInput!,
      timeZoneInput: defaultTimeZone
    });

    if (!meetupSchedule.ok) {
      await interaction.reply({ content: meetupSchedule.error, ephemeral: true });
      return;
    }

    const nowUnix = nowUnixSeconds();
    if (meetupSchedule.startsAtUnix <= nowUnix) {
      await interaction.reply({
        content: "Meetup time must be in the future. Please choose a date/time after now.",
        ephemeral: true
      });
      return;
    }

    newTimeText = meetupSchedule.timeText;
    newStartsAt = meetupSchedule.startsAtUnix;
    newExpiresAt = calculateMeetupProposalExpiresAt({
      meetupStartsAtUnix: meetupSchedule.startsAtUnix,
      nowUnix
    });
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
    timeText: newTimeText,
    startsAt: newStartsAt,
    expiresAt: newExpiresAt
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
