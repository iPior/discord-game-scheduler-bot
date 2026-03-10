import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { createMeetupRsvpCustomId } from "./custom-ids";

export function buildMeetupEmbed(input: {
  meetupId: number;
  title: string;
  groupName: string;
  proposedByUserId: string;
  timeText: string;
  counts: { join: number; maybe: number; cant: number };
}): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(input.title)
    .setColor(0x1f8b4c)
    .addFields(
      { name: "Group", value: input.groupName, inline: true },
      { name: "Proposed by", value: `<@${input.proposedByUserId}>`, inline: true },
      { name: "Time", value: input.timeText, inline: true },
      {
        name: "RSVP",
        value: `Join: **${input.counts.join}**\nMaybe: **${input.counts.maybe}**\nCan't: **${input.counts.cant}**`
      }
    )
    .setFooter({ text: `Meetup ID: ${input.meetupId}` });
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

function renderMentionList(userIds: string[]): string {
  if (userIds.length === 0) return "None";
  return userIds.map((id) => `<@${id}>`).join(", ");
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
