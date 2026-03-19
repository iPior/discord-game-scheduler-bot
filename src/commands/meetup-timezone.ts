import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction
} from "discord.js";
import { getGuildDefaultTimeZone, upsertGuildDefaultTimeZone } from "../db/queries";
import { validateIanaTimeZone } from "../utils/time";

const COMMON_TIMEZONE_CHOICES = [
  { name: "US Eastern (New York)", value: "America/New_York" },
  { name: "US Central (Chicago)", value: "America/Chicago" },
  { name: "US Mountain (Denver)", value: "America/Denver" },
  { name: "US Pacific (Los Angeles)", value: "America/Los_Angeles" },
  { name: "US Alaska (Anchorage)", value: "America/Anchorage" },
  { name: "US Hawaii (Honolulu)", value: "Pacific/Honolulu" },
  { name: "Canada Atlantic (Halifax)", value: "America/Halifax" },
  { name: "Brazil (Sao Paulo)", value: "America/Sao_Paulo" },
  { name: "UK (London)", value: "Europe/London" },
  { name: "Central Europe (Berlin)", value: "Europe/Berlin" },
  { name: "Poland (Warsaw)", value: "Europe/Warsaw" },
  { name: "Turkey (Istanbul)", value: "Europe/Istanbul" },
  { name: "South Africa (Johannesburg)", value: "Africa/Johannesburg" },
  { name: "India (Kolkata)", value: "Asia/Kolkata" },
  { name: "Singapore", value: "Asia/Singapore" },
  { name: "Japan (Tokyo)", value: "Asia/Tokyo" },
  { name: "South Korea (Seoul)", value: "Asia/Seoul" },
  { name: "Australia East (Sydney)", value: "Australia/Sydney" },
  { name: "New Zealand (Auckland)", value: "Pacific/Auckland" },
  { name: "UTC", value: "UTC" }
] as const;

function canManageTimezone(interaction: ChatInputCommandInteraction): boolean {
  return Boolean(interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild));
}

export function addSettingsTimezoneSubcommandGroup(builder: SlashCommandBuilder): void {
  builder.addSubcommandGroup((group) =>
    group
      .setName("timezone")
      .setDescription("Manage server default timezone")
      .addSubcommand((sub) =>
        sub
          .setName("set")
          .setDescription("Set the default meetup timezone for this server")
          .addStringOption((option) =>
            option
              .setName("timezone")
              .setDescription("Pick from list or type a region/city timezone")
              .addChoices(...COMMON_TIMEZONE_CHOICES)
              .setRequired(true)
          )
      )
      .addSubcommand((sub) =>
        sub
          .setName("show")
          .setDescription("Show the default meetup timezone for this server")
      )
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
      content: "Invalid timezone. Pick from the command list or use a region/city value like `America/New_York`.",
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
      content: "No default meetup timezone is set yet. Use `/settings timezone set` and pick one from the list.",
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: `Default meetup timezone: \`${defaultTimeZone}\``,
    ephemeral: true
  });
}
