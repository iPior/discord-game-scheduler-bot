import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { listUpcomingMeetupsForGuild } from "../db/queries";

export function addMeetupUpcomingSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("upcoming")
      .setDescription("List the next upcoming meetups")
  );
}

export async function handleMeetupUpcoming(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true
    });
    return;
  }

  const meetups = await listUpcomingMeetupsForGuild(interaction.guildId);

  if (meetups.length === 0) {
    await interaction.reply({
      content: "No upcoming meetups found.",
      ephemeral: true
    });
    return;
  }

  const lines = meetups.map((meetup) => `${meetup.id} - ${meetup.title} - <t:${meetup.startsAt}:f>`);

  await interaction.reply({
    content: `Upcoming meetups (next ${meetups.length}):\n${lines.join("\n")}`,
    ephemeral: true
  });
}
