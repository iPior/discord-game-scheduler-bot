import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js";

import { addGroupHelpSubcommand, handleGroupHelp } from "../commands/help";
import { pingCommand } from "../commands/ping";
import { addGroupCreateSubcommand, handleGroupCreate } from "../commands/group-create";
import { addGroupListSubcommand, handleGroupList } from "../commands/group-list";
import { addGroupMembersSubcommand, handleGroupMembers } from "../commands/group-members";
import {
  addGroupAddMembersSubcommand,
  addGroupRemoveMembersSubcommand,
  handleGroupAddMembers,
  handleGroupRemoveMembers
} from "../commands/group-edit-members";
import { addMeetupProposeSubcommand, handleMeetupPropose } from "../commands/meetup-propose";
import { addMeetupStatusSubcommand, handleMeetupStatus } from "../commands/meetup-status";
import { addMeetupEditSubcommand, handleMeetupEdit } from "../commands/meetup-edit";
import { addMeetupDeleteSubcommand, handleMeetupDelete } from "../commands/meetup-delete";

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
  addGroupMembersSubcommand(data);
  addGroupAddMembersSubcommand(data);
  addGroupRemoveMembersSubcommand(data);
  addGroupHelpSubcommand(data);

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

      if (subcommand === "members") {
        await handleGroupMembers(interaction);
        return;
      }

      if (subcommand === "add-members") {
        await handleGroupAddMembers(interaction);
        return;
      }

      if (subcommand === "remove-members") {
        await handleGroupRemoveMembers(interaction);
        return;
      }

      if (subcommand === "help") {
        await handleGroupHelp(interaction);
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
  addMeetupEditSubcommand(data);
  addMeetupDeleteSubcommand(data);

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

      if (subcommand === "edit") {
        await handleMeetupEdit(interaction);
        return;
      }

      if (subcommand === "delete") {
        await handleMeetupDelete(interaction);
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
