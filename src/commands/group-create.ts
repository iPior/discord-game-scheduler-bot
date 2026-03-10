import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { createGroupWithMembers } from "../db/queries";

function parseMemberIds(rawMembers: string | null): string[] {
  if (!rawMembers) return [];

  const tokens = rawMembers
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const ids = new Set<string>();

  for (const token of tokens) {
    const mentionMatch = token.match(/^<@!?(\d{16,20})>$/);
    if (mentionMatch) {
      ids.add(mentionMatch[1]);
      continue;
    }

    const rawIdMatch = token.match(/^(\d{16,20})$/);
    if (rawIdMatch) {
      ids.add(rawIdMatch[1]);
    }
  }

  return [...ids];
}

export function addGroupCreateSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Create a group for meetup coordination")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("Unique group name in this server")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("members")
          .setDescription("Optional comma-separated user mentions or IDs")
          .setRequired(false)
      )
  );
}

export async function handleGroupCreate(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: "This command can only be used inside a server.",
      ephemeral: true
    });
    return;
  }

  const name = interaction.options.getString("name", true).trim();
  if (name.length < 2 || name.length > 64) {
    await interaction.reply({
      content: "Group name must be between 2 and 64 characters.",
      ephemeral: true
    });
    return;
  }

  const rawMembers = interaction.options.getString("members");
  const parsedMemberIds = parseMemberIds(rawMembers);

  const result = await createGroupWithMembers({
    guildId: interaction.guildId,
    name,
    createdByUserId: interaction.user.id,
    additionalMemberIds: parsedMemberIds
  });

  if (!result.ok) {
    await interaction.reply({
      content: "A group with that name already exists in this server.",
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `Created group **${name}** (id: \`${result.groupId}\`) with ${result.memberCount} member(s).`,
    ephemeral: true
  });
}
