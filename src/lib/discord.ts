import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js";

import { pingCommand } from "../commands/ping";
import { addGroupCreateSubcommand, handleGroupCreate } from "../commands/group-create";
import { addGroupListSubcommand, handleGroupList } from "../commands/group-list";
import { addMeetupProposeSubcommand, handleMeetupPropose } from "../commands/meetup-propose";
import { addMeetupStatusSubcommand, handleMeetupStatus } from "../commands/meetup-status";

export interface CommandDefinition {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

function createGroupCommand(): CommandDefinition {
  const data = new SlashCommandBuilder()
    .setName("group")
    .setDescription("Create and manage meetup groups");

  addGroupCreateSubcommand(data);
  addGroupListSubcommand(data);

  return {
    data,
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "create") {
        await handleGroupCreate(interaction);
        return;
      }

      if (subcommand === "list") {
        await handleGroupList(interaction);
        return;
      }

      await interaction.reply({
        content: "Unknown group subcommand.",
        ephemeral: true
      });
    }
  };
}

function createMeetupCommand(): CommandDefinition {
  const data = new SlashCommandBuilder()
    .setName("meetup")
    .setDescription("Propose and track meetups");

  addMeetupProposeSubcommand(data);
  addMeetupStatusSubcommand(data);

  return {
    data,
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "propose") {
        await handleMeetupPropose(interaction);
        return;
      }

      if (subcommand === "status") {
        await handleMeetupStatus(interaction);
        return;
      }

      await interaction.reply({
        content: "Unknown meetup subcommand.",
        ephemeral: true
      });
    }
  };
}

export function getCommandDefinitions(): CommandDefinition[] {
  return [pingCommand, createGroupCommand(), createMeetupCommand()];
}

export function getCommandPayloads(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  return getCommandDefinitions().map((command) => command.data.toJSON());
}

export function createDiscordClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds]
  });
}
