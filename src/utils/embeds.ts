import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { createMeetupRsvpCustomId } from "./custom-ids";

function renderMentionList(userIds: string[], maxShown = 15): string {
  if (userIds.length === 0) return "None";

  const shown = userIds.slice(0, maxShown).map((id) => `<@${id}>`).join(", ");
  const remaining = userIds.length - Math.min(userIds.length, maxShown);

  if (remaining > 0) {
    return `${shown} …and ${remaining} more`;
  }

  return shown;
}

export function buildMeetupEmbed(input: {
  meetupId: number;
  title: string;
  groupName: string;
  proposedByUserId: string;
  timeText: string;
  rsvpUserIds: { join: string[]; maybe: string[]; cant: string[] };
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(input.title)
    .setColor(0x1f8b4c)
    .addFields(
      { name: "Group", value: input.groupName, inline: false },
      { name: "Proposed by", value: `<@${input.proposedByUserId}>`, inline: false },
      { name: "Time", value: input.timeText, inline: false },
      {
        name: "Join",
        value: renderMentionList(input.rsvpUserIds.join),
        inline: false
      },
      {
        name: "Maybe",
        value: renderMentionList(input.rsvpUserIds.maybe),
        inline: false
      },
      {
        name: "Can't",
        value: renderMentionList(input.rsvpUserIds.cant),
        inline: false
      }
    );
}

export function buildMeetupRsvpRow(meetupId: number): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(createMeetupRsvpCustomId(meetupId, "join"))
      .setLabel("Join")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(createMeetupRsvpCustomId(meetupId, "maybe"))
      .setLabel("Maybe")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(createMeetupRsvpCustomId(meetupId, "cant"))
      .setLabel("Can't")
      .setStyle(ButtonStyle.Danger)
  );
}

export function buildMeetupStatusText(input: {
  meetupId: number;
  title: string;
  timeText: string;
  yesUserIds: string[];
  maybeUserIds: string[];
  noUserIds: string[];
}): string {
  return [
    `**Meetup #${input.meetupId}: ${input.title}**`,
    `Time: ${input.timeText}`,
    `Yes: ${renderMentionList(input.yesUserIds)}`,
    `Maybe: ${renderMentionList(input.maybeUserIds)}`,
    `No: ${renderMentionList(input.noUserIds)}`
  ].join("\n");
}
