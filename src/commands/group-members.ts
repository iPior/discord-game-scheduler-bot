import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { findGroupByNameForGuildWithOwner, listGroupMemberUserIds } from "../db/queries";

function renderMemberList(userIds: string[]): string {
  if (userIds.length === 0) return "(no members)";

  // Keep output readable and within Discord message limits.
  const maxShown = 40;
  const shown = userIds.slice(0, maxShown).map((id) => `<@${id}>`).join(", ");
  const remaining = userIds.length - Math.min(userIds.length, maxShown);

  if (remaining > 0) {
    return `${shown} …and ${remaining} more`;
  }

  return shown;
}

export function addGroupMembersSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("members")
      .setDescription("List members of a group")
      .addStringOption((option) =>
        option
          .setName("group")
          .setDescription("Group name (autocomplete)")
          .setAutocomplete(true)
          .setRequired(true)
      )
  );
}

export async function handleGroupMembers(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used inside a server.",
      ephemeral: true
    });
    return;
  }

  const groupName = interaction.options.getString("group", true).trim();
  const group = await findGroupByNameForGuildWithOwner(interaction.guildId, groupName);

  if (!group) {
    await interaction.reply({
      content: `Group "${groupName}" was not found in this server.`,
      ephemeral: true
    });
    return;
  }

  const userIds = await listGroupMemberUserIds(group.id);
  await interaction.reply({
    content: `**${group.name}** members (${userIds.length}):\n${renderMemberList(userIds)}`,
    ephemeral: true
  });
}
