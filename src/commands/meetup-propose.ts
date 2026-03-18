import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import {
  createMeetup,
  findGroupByNameForGuild,
  getGuildDefaultTimeZone,
  listGroupMemberUserIds,
  listRsvpUserIdsByResponse,
  updateMeetupMessageLocation
} from "../db/queries";
import { buildMeetupEmbed, buildMeetupRsvpRow } from "../utils/embeds";
import { buildMeetupSchedule, calculateMeetupProposalExpiresAt, nowUnixSeconds } from "../utils/time";

function chunkUserIds(userIds: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += chunkSize) {
    chunks.push(userIds.slice(i, i + chunkSize));
  }
  return chunks;
}

export function addMeetupProposeSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("propose")
      .setDescription("Propose a meetup for a group")
      .addStringOption((option) =>
        option
          .setName("group")
          .setDescription("Group name (autocomplete)")
          .setAutocomplete(true)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("title")
          .setDescription("Meetup title")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("date")
          .setDescription("Date in YYYY-MM-DD (example: 2026-03-13)")
          .setAutocomplete(true)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("time")
          .setDescription("Time like 7pm or 7:15pm")
          .setRequired(true)
      )
  );
}

export async function handleMeetupPropose(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.channelId) {
    await interaction.reply({
      content: "This command can only be used inside a server text channel.",
      ephemeral: true
    });
    return;
  }

  const groupName = interaction.options.getString("group", true).trim();
  const title = interaction.options.getString("title", true).trim();
  const dateInput = interaction.options.getString("date", true).trim();
  const timeInput = interaction.options.getString("time", true).trim();
  const defaultTimeZone = await getGuildDefaultTimeZone(interaction.guildId);

  if (!defaultTimeZone) {
    await interaction.reply({
      content: "This server does not have a default meetup timezone yet. Ask an admin to run `/meetup timezone-set` and pick one from the list.",
      ephemeral: true
    });
    return;
  }

  const meetupSchedule = buildMeetupSchedule({
    dateInput,
    timeInput,
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

  const expiresAt = calculateMeetupProposalExpiresAt({
    meetupStartsAtUnix: meetupSchedule.startsAtUnix,
    nowUnix
  });

  const group = await findGroupByNameForGuild(interaction.guildId, groupName);
  if (!group) {
    await interaction.reply({
      content: `Group "${groupName}" was not found in this server.`,
      ephemeral: true
    });
    return;
  }

  const meetup = await createMeetup({
    guildId: interaction.guildId,
    groupId: group.id,
    title,
    timeText: meetupSchedule.timeText,
    startsAt: meetupSchedule.startsAtUnix,
    expiresAt,
    proposedByUserId: interaction.user.id
  });

  const groupMemberUserIds = await listGroupMemberUserIds(group.id);
  const mentionTargets = groupMemberUserIds.filter((userId) => userId !== interaction.user.id);

  const [joinUserIds, maybeUserIds, cantUserIds] = await Promise.all([
    listRsvpUserIdsByResponse(meetup.id, "join"),
    listRsvpUserIdsByResponse(meetup.id, "maybe"),
    listRsvpUserIdsByResponse(meetup.id, "cant")
  ]);
  const embed = buildMeetupEmbed({
    meetupId: meetup.id,
    title: meetup.title,
    groupName: group.name,
    proposedByUserId: meetup.proposedBy,
    timeText: meetup.timeText,
    rsvpUserIds: {
      join: joinUserIds,
      maybe: maybeUserIds,
      cant: cantUserIds
    }
  });

  const row = buildMeetupRsvpRow(meetup.id);

  const message = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  await updateMeetupMessageLocation({
    meetupId: meetup.id,
    channelId: message.channelId,
    messageId: message.id
  });

  // Keep the channel post clean; give the proposer the ID privately for /meetup status.
  await interaction.followUp({
    content: `Meetup created. Meetup ID: \`${meetup.id}\` (use with /meetup status).`,
    ephemeral: true
  });

  if (mentionTargets.length > 0) {
    const mentionChunks = chunkUserIds(mentionTargets, 40);
    for (const [index, mentionChunk] of mentionChunks.entries()) {
      const mentions = mentionChunk.map((userId) => `<@${userId}>`).join(" ");
      const prefix =
        index === 0
          ? `Group **${group.name}** has a new meetup proposal: **${meetup.title}**.`
          : `More members for **${group.name}** meetup:`;

      await interaction.followUp({
        content: `${prefix} ${mentions}`
      });
    }
  }
}
