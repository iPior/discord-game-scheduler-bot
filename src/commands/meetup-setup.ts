import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import { buildOnboardingEmbed } from "../utils/onboarding";

export function addMeetupSetupSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("setup")
      .setDescription("Show setup guide and key meetup commands")
  );
}

export async function handleMeetupSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({
    embeds: [buildOnboardingEmbed()],
    ephemeral: true
  });
}
