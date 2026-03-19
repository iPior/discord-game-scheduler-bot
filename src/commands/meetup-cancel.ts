import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import {
  cancelMeetup,
  getMeetupByIdWithGroup,
  listRsvpUserIdsByResponse
} from "../db/queries";
import { logger } from "../lib/logger";
import { buildMeetupEmbed, buildMeetupRsvpRow } from "../utils/embeds";

function canCancelMeetup(interaction: ChatInputCommandInteraction, proposedByUserId: string): boolean {
  if (interaction.user.id === proposedByUserId) return true;
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}

export function addMeetupCancelSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("cancel")
      .setDescription("Cancel a meetup without deleting its history")
      .addStringOption((option) =>
        option.setName("meetup_id").setDescription("Meetup ID").setRequired(true)
      )
  );
}

export async function handleMeetupCancel(interaction: ChatInputCommandInteraction): Promise<void> {
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

  if (!canCancelMeetup(interaction, meetup.proposedBy)) {
    await interaction.reply({
      content: "Only the proposer or users with Manage Server can cancel this meetup.",
      ephemeral: true
    });
    return;
  }

  if (typeof meetup.canceledAt === "number") {
    await interaction.reply({ content: "This meetup is already canceled.", ephemeral: true });
    return;
  }

  await cancelMeetup({
    meetupId: meetup.id,
    canceledByUserId: interaction.user.id
  });

  const [joinUserIds, maybeUserIds, cantUserIds] = await Promise.all([
    listRsvpUserIdsByResponse(meetup.id, "join"),
    listRsvpUserIdsByResponse(meetup.id, "maybe"),
    listRsvpUserIdsByResponse(meetup.id, "cant")
  ]);

  const updatedMeetup = await getMeetupByIdWithGroup(meetup.id);
  if (updatedMeetup?.channelId && updatedMeetup.messageId) {
    try {
      const channel = await interaction.client.channels.fetch(updatedMeetup.channelId);
      if (channel?.isTextBased() && "messages" in channel) {
        const message = await channel.messages.fetch(updatedMeetup.messageId);
        const canceledEmbed = buildMeetupEmbed({
          meetupId: updatedMeetup.id,
          title: updatedMeetup.title,
          groupName: updatedMeetup.groupName,
          proposedByUserId: updatedMeetup.proposedBy,
          timeText: updatedMeetup.timeText,
          canceledAtUnix: updatedMeetup.canceledAt,
          canceledByUserId: updatedMeetup.canceledBy,
          rsvpUserIds: {
            join: joinUserIds,
            maybe: maybeUserIds,
            cant: cantUserIds
          }
        });

        await message.edit({
          embeds: [canceledEmbed],
          components: [buildMeetupRsvpRow(updatedMeetup.id, true)]
        });
      }
    } catch (error) {
      logger.warn("Failed to update meetup message after cancel", {
        meetupId: meetup.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  await interaction.reply({ content: "Meetup canceled.", ephemeral: true });
}
