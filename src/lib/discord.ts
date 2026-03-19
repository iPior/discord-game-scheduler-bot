import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js";

import { addGroupHelpSubcommand, handleGroupHelp } from "../commands/help";
import { pingCommand } from "../commands/ping";
import { addGroupCreateSubcommand, handleGroupCreate } from "../commands/group-create";
import { addListGroupsSubcommand, handleListGroups } from "../commands/group-list";
import { addGroupMembersSubcommand, handleGroupMembers } from "../commands/group-members";
import {
  addGroupAddMembersSubcommand,
  addGroupRemoveMembersSubcommand,
  handleGroupAddMembers,
  handleGroupRemoveMembers
} from "../commands/group-edit-members";
import {
  addGroupDeleteSubcommand,
  addGroupLeaveSubcommand,
  addGroupRenameSubcommand,
  handleGroupDelete,
  handleGroupLeave,
  handleGroupRename
} from "../commands/group-manage";
import { handleGroupNameAutocomplete } from "../commands/group-autocomplete";
import { handleMeetupDateTimeAutocomplete } from "../commands/meetup-datetime-autocomplete";
import { addMeetupProposeSubcommand, handleMeetupPropose } from "../commands/meetup-propose";
import { addMeetupStatusSubcommand, handleMeetupStatus } from "../commands/meetup-status";
import { addMeetupEditSubcommand, handleMeetupEdit } from "../commands/meetup-edit";
import { addMeetupDeleteSubcommand, handleMeetupDelete } from "../commands/meetup-delete";
import {
  addMeetupTimezoneSetSubcommand,
  addMeetupTimezoneShowSubcommand,
  handleMeetupTimezoneSet,
  handleMeetupTimezoneShow
} from "../commands/meetup-timezone";
import { addMeetupSetupSubcommand, handleMeetupSetup } from "../commands/meetup-setup";

export interface CommandDefinition {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

function createGroupCommand(): CommandDefinition {
  const data = new SlashCommandBuilder()
    .setName("group")
    .setDescription("Create and manage meetup groups");

  addGroupCreateSubcommand(data);
  addGroupMembersSubcommand(data);
  addGroupAddMembersSubcommand(data);
  addGroupRemoveMembersSubcommand(data);
  addGroupDeleteSubcommand(data);
  addGroupRenameSubcommand(data);
  addGroupLeaveSubcommand(data);
  addGroupHelpSubcommand(data);

  return {
    data,
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "create") {
        await handleGroupCreate(interaction);
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

      if (subcommand === "delete") {
        await handleGroupDelete(interaction);
        return;
      }

      if (subcommand === "rename") {
        await handleGroupRename(interaction);
        return;
      }

      if (subcommand === "leave") {
        await handleGroupLeave(interaction);
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
    },
    async autocomplete(interaction) {
      const subcommand = interaction.options.getSubcommand();

      if (
        subcommand === "members" ||
        subcommand === "add-members" ||
        subcommand === "remove-members" ||
        subcommand === "delete" ||
        subcommand === "rename" ||
        subcommand === "leave"
      ) {
        await handleGroupNameAutocomplete(interaction);
        return;
      }

      await interaction.respond([]);
    }
  };
}

function createListCommand(): CommandDefinition {
  const data = new SlashCommandBuilder()
    .setName("list")
    .setDescription("List meetup data");

  addListGroupsSubcommand(data);

  return {
    data,
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "groups") {
        await handleListGroups(interaction);
        return;
      }

      await interaction.reply({
        content: "Unknown list subcommand.",
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
  addMeetupTimezoneSetSubcommand(data);
  addMeetupTimezoneShowSubcommand(data);
  addMeetupSetupSubcommand(data);

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

      if (subcommand === "timezone-set") {
        await handleMeetupTimezoneSet(interaction);
        return;
      }

      if (subcommand === "timezone-show") {
        await handleMeetupTimezoneShow(interaction);
        return;
      }

      if (subcommand === "setup") {
        await handleMeetupSetup(interaction);
        return;
      }

      await interaction.reply({
        content: "Unknown meetup subcommand.",
        ephemeral: true
      });
    },
    async autocomplete(interaction) {
      const subcommand = interaction.options.getSubcommand();
      const focused = interaction.options.getFocused(true);

      if (subcommand === "propose" && focused.name === "group") {
        await handleGroupNameAutocomplete(interaction);
        return;
      }

      if ((subcommand === "propose" || subcommand === "edit") && focused.name === "date") {
        await handleMeetupDateTimeAutocomplete(interaction);
        return;
      }

      await interaction.respond([]);
    }
  };
}

export function getCommandDefinitions(): CommandDefinition[] {
  return [pingCommand, createGroupCommand(), createListCommand(), createMeetupCommand()];
}

export function getCommandPayloads(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  return getCommandDefinitions().map((command) => command.data.toJSON());
}

export function createDiscordClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds]
  });
}
