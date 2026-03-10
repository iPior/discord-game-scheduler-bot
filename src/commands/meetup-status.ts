import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import {
  getMeetupByIdWithGroup,
  listRsvpUserIdsByResponse
} from "../db/queries";
import { buildMeetupStatusText } from "../utils/embeds";

export function addMeetupStatusSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("status")
      .setDescription("Get meetup RSVP status")
      .addStringOption((option) =>
        option
          .setName("meetup_id")
          .setDescription("Meetup ID")
          .setRequired(true)
      )
  );
}

export async function handleMeetupStatus(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true
    });
    return;
  }

  const meetupIdRaw = interaction.options.getString("meetup_id", true).trim();
  const meetupId = Number.parseInt(meetupIdRaw, 10);

  if (!Number.isInteger(meetupId) || meetupId <= 0) {
    await interaction.reply({
      content: "Invalid meetup_id. It should be a positive integer.",
      ephemeral: true
    });
    return;
  }

  const meetup = await getMeetupByIdWithGroup(meetupId);
  if (!meetup || meetup.guildId !== interaction.guildId) {
    await interaction.reply({
      content: "Meetup not found in this server.",
      ephemeral: true
    });
    return;
  }

  const [yesUserIds, maybeUserIds, noUserIds] = await Promise.all([
    listRsvpUserIdsByResponse(meetup.id, "join"),
    listRsvpUserIdsByResponse(meetup.id, "maybe"),
    listRsvpUserIdsByResponse(meetup.id, "cant")
  ]);

  const statusText = buildMeetupStatusText({
    meetupId: meetup.id,
    title: meetup.title,
    timeText: meetup.timeText,
    yesUserIds,
    maybeUserIds,
    noUserIds
  });

  await interaction.reply({
    content: statusText,
    ephemeral: true
  });
}
