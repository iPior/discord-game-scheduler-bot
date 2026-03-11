import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { getGuildDefaultTimeZone, upsertGuildDefaultTimeZone } from "../db/queries";
import { validateIanaTimeZone } from "../utils/time";

function canManageTimezone(interaction: ChatInputCommandInteraction): boolean {
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}

export function addMeetupTimezoneSetSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("timezone-set")
      .setDescription("Set the default meetup timezone for this server")
      .addStringOption((option) =>
        option
          .setName("timezone")
          .setDescription("IANA timezone (example: America/New_York)")
          .setRequired(true)
      )
  );
}

export function addMeetupTimezoneShowSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("timezone-show")
      .setDescription("Show the default meetup timezone for this server")
  );
}

export async function handleMeetupTimezoneSet(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  if (!canManageTimezone(interaction)) {
    await interaction.reply({ content: "You need Manage Server permission to set the timezone.", ephemeral: true });
    return;
  }

  const timezoneInput = interaction.options.getString("timezone", true).trim();
  const validated = validateIanaTimeZone(timezoneInput);

  if (!validated.ok) {
    await interaction.reply({
      content: "Invalid timezone. Use an IANA value like `America/New_York`.",
      ephemeral: true
    });
    return;
  }

  await upsertGuildDefaultTimeZone({
    guildId: interaction.guildId,
    defaultTimeZone: validated.canonicalTimeZone
  });

  await interaction.reply({
    content: `Default meetup timezone set to \`${validated.canonicalTimeZone}\`.`,
    ephemeral: true
  });
}

export async function handleMeetupTimezoneShow(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const defaultTimeZone = await getGuildDefaultTimeZone(interaction.guildId);

  if (!defaultTimeZone) {
    await interaction.reply({
      content: "No default meetup timezone is set yet. Use `/meetup timezone-set timezone:<IANA>`.",
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `Default meetup timezone: \`${defaultTimeZone}\``,
    ephemeral: true
  });
}
