import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { listMeetupsForUserInGuild } from "../db/queries";

function renderTime(startsAt: number | null, timeText: string): string {
  return typeof startsAt === "number" ? `<t:${startsAt}:f>` : timeText;
}

function renderStatus(canceledAt: number | null): string {
  return typeof canceledAt === "number" ? " [canceled]" : "";
}

export function addMeetupMineSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("mine")
      .setDescription("List meetups you proposed")
  );
}

export async function handleMeetupMine(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used in a server.",
      ephemeral: true
    });
    return;
  }

  const meetups = await listMeetupsForUserInGuild({
    guildId: interaction.guildId,
    userId: interaction.user.id
  });

  if (meetups.length === 0) {
    await interaction.reply({
      content: "You have not proposed any meetups in this server yet.",
      ephemeral: true
    });
    return;
  }

  const lines = meetups.map((meetup) =>
    `${meetup.id} - ${meetup.title} - ${renderTime(meetup.startsAt, meetup.timeText)}${renderStatus(meetup.canceledAt)}`
  );

  await interaction.reply({
    content: `Your meetups (latest 20):\n${lines.join("\n")}`,
    ephemeral: true
  });
}
