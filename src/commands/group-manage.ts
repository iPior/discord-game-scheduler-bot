import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import {
  deleteGroupById,
  findGroupByNameForGuildWithOwner,
  removeMembersFromGroup,
  renameGroupInGuild
} from "../db/queries";

function canManageGroup(interaction: ChatInputCommandInteraction, groupCreatedBy: string): boolean {
  if (interaction.user.id === groupCreatedBy) return true;
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}

export function addGroupDeleteSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("delete")
      .setDescription("Delete a group")
      .addStringOption((option) =>
        option
          .setName("group")
          .setDescription("Group name (autocomplete)")
          .setAutocomplete(true)
          .setRequired(true)
      )
  );
}

export function addGroupRenameSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("rename")
      .setDescription("Rename a group")
      .addStringOption((option) =>
        option
          .setName("group")
          .setDescription("Current group name (autocomplete)")
          .setAutocomplete(true)
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("new-name")
          .setDescription("New group name")
          .setRequired(true)
      )
  );
}

export function addGroupLeaveSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("leave")
      .setDescription("Leave a group you are in")
      .addStringOption((option) =>
        option
          .setName("group")
          .setDescription("Group name (autocomplete)")
          .setAutocomplete(true)
          .setRequired(true)
      )
  );
}

export async function handleGroupDelete(interaction: ChatInputCommandInteraction): Promise<void> {
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

  if (!canManageGroup(interaction, group.createdBy)) {
    await interaction.reply({
      content: "You don't have permission to delete this group.",
      ephemeral: true
    });
    return;
  }

  await deleteGroupById(group.id);

  await interaction.reply({
    content: `Deleted group **${group.name}**. Associated meetups and RSVPs were also removed.`,
    ephemeral: true
  });
}

export async function handleGroupRename(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used inside a server.",
      ephemeral: true
    });
    return;
  }

  const groupName = interaction.options.getString("group", true).trim();
  const newName = interaction.options.getString("new-name", true).trim();

  if (newName.length < 2 || newName.length > 64) {
    await interaction.reply({
      content: "Group name must be between 2 and 64 characters.",
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

  if (!canManageGroup(interaction, group.createdBy)) {
    await interaction.reply({
      content: "You don't have permission to rename this group.",
      ephemeral: true
    });
    return;
  }

  const result = await renameGroupInGuild({
    guildId: interaction.guildId,
    groupId: group.id,
    newName
  });

  if (!result.ok) {
    await interaction.reply({
      content: "A group with that name already exists in this server.",
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `Renamed group **${group.name}** to **${result.name}**.`,
    ephemeral: true
  });
}

export async function handleGroupLeave(interaction: ChatInputCommandInteraction): Promise<void> {
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

  const removed = await removeMembersFromGroup(group.id, [interaction.user.id]);
  if (removed === 0) {
    await interaction.reply({
      content: `You are not currently a member of **${group.name}**.`,
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `You left **${group.name}**.`,
    ephemeral: true
  });
}
