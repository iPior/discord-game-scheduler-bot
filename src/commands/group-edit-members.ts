import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import {
  addMembersToGroup,
  findGroupByNameForGuildWithOwner,
  removeMembersFromGroup
} from "../db/queries";
import { parseUserIdsCsv } from "../utils/user-ids";

function canEditGroup(interaction: ChatInputCommandInteraction, groupCreatedBy: string): boolean {
  // Allow the group creator to manage membership.
  if (interaction.user.id === groupCreatedBy) return true;

  // Also allow server managers.
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}

export function addGroupAddMembersSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("add-members")
      .setDescription("Add members to a group")
      .addStringOption((option) =>
        option.setName("group").setDescription("Group name").setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("members")
          .setDescription("Comma-separated user mentions or IDs")
          .setRequired(true)
      )
  );
}

export function addGroupRemoveMembersSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("remove-members")
      .setDescription("Remove members from a group")
      .addStringOption((option) =>
        option.setName("group").setDescription("Group name").setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("members")
          .setDescription("Comma-separated user mentions or IDs")
          .setRequired(true)
      )
  );
}

export async function handleGroupAddMembers(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used inside a server.",
      ephemeral: true
    });
    return;
  }

  const groupName = interaction.options.getString("group", true).trim();
  const raw = interaction.options.getString("members", true);
  const userIds = parseUserIdsCsv(raw);

  if (userIds.length === 0) {
    await interaction.reply({
      content: "No valid user IDs/mentions found. Use comma-separated IDs or mentions like <@123>.",
      ephemeral: true
    });
    return;
  }

  const group = await findGroupByNameForGuildWithOwner(interaction.guildId, groupName);
  if (!group) {
    await interaction.reply({
      content: `Group "${groupName}" was not found in this server.`,
      ephemeral: true
    });
    return;
  }

  if (!canEditGroup(interaction, group.createdBy)) {
    await interaction.reply({
      content: "You don't have permission to edit members of this group.",
      ephemeral: true
    });
    return;
  }

  const added = await addMembersToGroup(group.id, userIds);

  await interaction.reply({
    content: `Added ${added} member(s) to **${group.name}**.`,
    ephemeral: true
  });
}

export async function handleGroupRemoveMembers(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used inside a server.",
      ephemeral: true
    });
    return;
  }

  const groupName = interaction.options.getString("group", true).trim();
  const raw = interaction.options.getString("members", true);
  const userIds = parseUserIdsCsv(raw);

  if (userIds.length === 0) {
    await interaction.reply({
      content: "No valid user IDs/mentions found. Use comma-separated IDs or mentions like <@123>.",
      ephemeral: true
    });
    return;
  }

  const group = await findGroupByNameForGuildWithOwner(interaction.guildId, groupName);
  if (!group) {
    await interaction.reply({
      content: `Group "${groupName}" was not found in this server.`,
      ephemeral: true
    });
    return;
  }

  if (!canEditGroup(interaction, group.createdBy)) {
    await interaction.reply({
      content: "You don't have permission to edit members of this group.",
      ephemeral: true
    });
    return;
  }

  // Safety: prevent removing the creator by accident.
  const filtered = userIds.filter((id) => id !== group.createdBy);
  const removed = await removeMembersFromGroup(group.id, filtered);

  await interaction.reply({
    content: `Removed ${removed} member(s) from **${group.name}**.`,
    ephemeral: true
  });
}
