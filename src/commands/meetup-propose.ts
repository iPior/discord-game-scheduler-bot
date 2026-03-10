import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { createMeetup, findGroupByNameForGuild, updateMeetupMessageLocation, getRsvpCounts } from "../db/queries";
import { buildMeetupEmbed, buildMeetupRsvpRow } from "../utils/embeds";

export function addMeetupProposeSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("propose")
      .setDescription("Propose a meetup for a group")
      .addStringOption((option) =>
        option
          .setName("group")
          .setDescription("Group name")
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
          .setName("time")
          .setDescription("Proposed time (raw text for MVP)")
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
  const timeText = interaction.options.getString("time", true).trim();

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
    timeText,
    proposedByUserId: interaction.user.id
  });

  const counts = await getRsvpCounts(meetup.id);
  const embed = buildMeetupEmbed({
    meetupId: meetup.id,
    title: meetup.title,
    groupName: group.name,
    proposedByUserId: meetup.proposedBy,
    timeText: meetup.timeText,
    counts
  });

  const row = buildMeetupRsvpRow(meetup.id);

  const message = await interaction.reply({
    content: `Meetup proposed (id: \`${meetup.id}\`)`,
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  await updateMeetupMessageLocation({
    meetupId: meetup.id,
    channelId: message.channelId,
    messageId: message.id
  });
}
