import { type AutocompleteInteraction } from "discord.js";
import { listGroupsForGuild } from "../db/queries";

const MAX_CHOICES = 25;

export async function handleGroupNameAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.respond([]);
    return;
  }

  const focused = interaction.options.getFocused(true);
  if (focused.name !== "group") {
    await interaction.respond([]);
    return;
  }

  const query = String(focused.value ?? "").trim().toLowerCase();
  const groups = await listGroupsForGuild(interaction.guildId);

  const startsWithMatches = groups.filter((group) => group.name.toLowerCase().startsWith(query));
  const includesMatches = groups.filter(
    (group) => !group.name.toLowerCase().startsWith(query) && group.name.toLowerCase().includes(query)
  );

  const choices = [...startsWithMatches, ...includesMatches]
    .slice(0, MAX_CHOICES)
    .map((group) => ({ name: group.name, value: group.name }));

  await interaction.respond(choices);
}
