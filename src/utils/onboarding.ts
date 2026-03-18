import { EmbedBuilder } from "discord.js";

export function buildOnboardingEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("Thanks for adding Meetup Bot")
    .setColor(0x2b6cb0)
    .setDescription(
      [
        "Meetup Bot helps your server plan events with group-based RSVPs.",
        "",
        "**Quick setup**",
        "1) Set your server timezone: `/meetup timezone-set timezone:<region/city>` (or pick from common choices)",
        "2) Create a group: `/group create name:<name> members:<optional>`",
        "3) Propose a meetup: `/meetup propose group:<group> title:<title> date:<YYYY-MM-DD> time:<HH:MM or h:MM AM/PM>`",
        "",
        "**Useful commands**",
        "- `/meetup timezone-show` - View server default timezone",
        "- `/meetup status meetup_id:<id>` - Check RSVP status",
        "- `/meetup edit meetup_id:<id> ...` - Update your meetup",
        "- `/group help` - Full command reference"
      ].join("\n")
    );
}
