import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { listGroupsForGuild } from "../db/queries";

function renderMemberList(userIds: string[]): string {
  if (userIds.length === 0) return "(no members)";

  const maxShown = 20;
  const shown = userIds.slice(0, maxShown).map((id) => `<@${id}>`).join(", ");
  const remaining = userIds.length - Math.min(userIds.length, maxShown);

  if (remaining > 0) {
    return `${shown} ...and ${remaining} more`;
  }

  return shown;
}

export function addListGroupsSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("groups")
      .setDescription("List meetup groups in this server")
  );
}

export async function handleListGroups(interaction: ChatInputCommandInteraction): Promise<void> {
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
    (group) =>
      `- \`${group.id}\` **${group.name}** (${group.memberCount} member(s)): ${renderMemberList(group.memberUserIds)}`
  );

  await interaction.reply({
    content: `Groups in this server:\n${lines.join("\n")}`,
    ephemeral: true
  });
}
