import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { listGroupsForGuild } from "../db/queries";

export function addGroupListSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("list")
      .setDescription("List meetup groups in this server")
  );
}

export async function handleGroupList(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used inside a server.",
      ephemeral: true
    });
    return;
  }

  const groups = await listGroupsForGuild(interaction.guildId);
  if (groups.length === 0) {
    await interaction.reply({
      content: "No groups found yet. Use `/group create` first.",
      ephemeral: true
    });
    return;
  }

  const lines = groups.map(
    (group) => `- \`${group.id}\` **${group.name}** (${group.memberCount} member(s))`
  );

  await interaction.reply({
    content: `Groups in this server:\n${lines.join("\n")}`,
    ephemeral: true
  });
}
