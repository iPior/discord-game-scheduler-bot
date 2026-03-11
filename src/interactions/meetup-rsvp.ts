import { type ButtonInteraction } from "discord.js";
import {
  getMeetupByIdWithGroup,
  isUserMemberOfGroup,
  listRsvpUserIdsByResponse,
  upsertRsvp
} from "../db/queries";
import { logger } from "../lib/logger";
import { buildMeetupEmbed, buildMeetupRsvpRow } from "../utils/embeds";
import { parseMeetupRsvpCustomId } from "../utils/custom-ids";

export async function handleMeetupRsvpInteraction(interaction: ButtonInteraction): Promise<void> {
  const parsed = parseMeetupRsvpCustomId(interaction.customId);
  if (!parsed) {
    await interaction.reply({
      content: "Invalid RSVP action.",
      ephemeral: true
    });
    return;
  }

  const meetup = await getMeetupByIdWithGroup(parsed.meetupId);
  if (!meetup) {
    await interaction.reply({
      content: "This meetup no longer exists.",
      ephemeral: true
    });
    return;
  }

  if (interaction.guildId !== meetup.guildId) {
    await interaction.reply({
      content: "This RSVP belongs to a different server.",
      ephemeral: true
    });
    return;
  }

  const isMember = await isUserMemberOfGroup(meetup.groupId, interaction.user.id);
  if (!isMember) {
    await interaction.reply({
      content: "You are not part of this group.",
      ephemeral: true
    });
    return;
  }

  await upsertRsvp({
    meetupId: meetup.id,
    userId: interaction.user.id,
    response: parsed.response
  });

  const [joinUserIds, maybeUserIds, cantUserIds] = await Promise.all([
    listRsvpUserIdsByResponse(meetup.id, "join"),
    listRsvpUserIdsByResponse(meetup.id, "maybe"),
    listRsvpUserIdsByResponse(meetup.id, "cant")
  ]);
  const embed = buildMeetupEmbed({
    meetupId: meetup.id,
    title: meetup.title,
    groupName: meetup.groupName,
    proposedByUserId: meetup.proposedBy,
    timeText: meetup.timeText,
    rsvpUserIds: {
      join: joinUserIds,
      maybe: maybeUserIds,
      cant: cantUserIds
    }
  });

  await interaction.update({
    embeds: [embed],
    components: [buildMeetupRsvpRow(meetup.id)]
  });

  logger.info("RSVP updated", {
    meetupId: meetup.id,
    userId: interaction.user.id,
    response: parsed.response
  });
}
