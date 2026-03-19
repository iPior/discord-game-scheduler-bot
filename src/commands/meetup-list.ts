import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { listMeetupsForGuild } from "../db/queries";

function renderStatus(canceledAt: number | null): string {
  return typeof canceledAt === "number" ? "canceled" : "active";
}

export function addMeetupListSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("List recent meetups in this server")
  );
}

export async function handleMeetupList(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true
    });
    return;
  }

  const meetups = await listMeetupsForGuild(interaction.guildId);
  if (meetups.length === 0) {
    await interaction.reply({
      content: "No meetups found yet. Use `/meetup propose` first.",
      ephemeral: true
    });
    return;
  }

  const lines = meetups.map((meetup) => {
    const timePart = typeof meetup.startsAt === "number" ? `<t:${meetup.startsAt}:f>` : meetup.timeText;
    return `- \`${meetup.id}\` **${meetup.title}** [${renderStatus(meetup.canceledAt)}] • Group: **${meetup.groupName}** • Time: ${timePart} • By: <@${meetup.proposedBy}>`;
  });

  await interaction.reply({
    content: `Recent meetups (latest 20):\n${lines.join("\n")}`,
    ephemeral: true
  });
}
