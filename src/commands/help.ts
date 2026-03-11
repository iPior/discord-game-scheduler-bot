import { EmbedBuilder, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";

const helpEmbed = new EmbedBuilder()
  .setTitle("Meetup Bot Help")
  .setColor(0x2b6cb0)
  .setDescription(
    [
      "Create groups, propose meetups, and RSVP with buttons.",
      "",
      "**Commands**",
      "- `/ping` - Check if the bot is alive.",
      "- `/group create name:<name> members:<optional>` - Create a group.",
      "- `/group list` - List groups in this server.",
      "- `/group members group:<group>` - List members in a group.",
      "- `/group add-members group:<group> members:<csv>` - Add users to a group.",
      "- `/group remove-members group:<group> members:<csv>` - Remove users from a group.",
      "- `/meetup propose group:<group> title:<title> date:<YYYY-MM-DD> time:<HH:MM or h:MM AM/PM>` - Post a meetup with RSVP buttons.",
      "- `/meetup status meetup_id:<id>` - Show RSVP lists for a meetup.",
      "- `/meetup edit meetup_id:<id> title:<optional> date:<optional> time:<optional>` - Edit your meetup.",
      "- `/meetup delete meetup_id:<id>` - Delete your meetup.",
      "- `/meetup timezone-set timezone:<IANA>` - Set server default meetup timezone (Manage Server).",
      "- `/meetup timezone-show` - Show server default meetup timezone.",
      "- `/meetup setup` - Show setup guide for new servers.",
      "",
      "**Members format (for `/group create`)**",
      "Provide a comma-separated list of user mentions or IDs.",
      "Examples:",
      "- `<@123456789012345678>, <@!234567890123456789>`",
      "- `123456789012345678, 234567890123456789`",
      "",
      "**RSVP rules**",
      "Only members of the meetup's group can RSVP.",
      "",
      "**Meetup IDs**",
      "After proposing, the bot sends the proposer the meetup ID in an ephemeral message.",
      "Use it with `/meetup status`."
    ].join("\n")
  );

export function addGroupHelpSubcommand(builder: SlashCommandBuilder): void {
  builder.addSubcommand((sub) =>
    sub
      .setName("help")
      .setDescription("Learn how to use the meetup bot")
  );
}

export async function handleGroupHelp(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.reply({
    embeds: [helpEmbed],
    ephemeral: true
  });
}
