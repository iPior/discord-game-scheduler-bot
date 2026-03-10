# Discord Meetup Coordination Bot

A local-first Discord bot for coordinating meetup groups in a server.

## What it does

- `/ping` -> health check (`Pong!`)
- `/group create` -> create a named group in a guild and add members
- `/group list` -> show all groups in the guild
- `/meetup propose` -> propose a meetup for a group and post RSVP buttons
- `/meetup status` -> show meetup status with yes/maybe/no user lists
- RSVP buttons (`Join`, `Maybe`, `Can't`) persist in SQLite and update live counts

## Tech stack

- TypeScript
- Bun
- discord.js v14
- SQLite
- Drizzle ORM
- dotenv

## Prerequisites

- [Bun](https://bun.sh/) installed
- A Discord account
- A Discord server where you can install/test the bot

## Setup

1. Clone the project.
2. Create env file:
   - Copy `.env.example` to `.env`
   - Fill in the values

3. Install dependencies:
   ```bash
   bun install
   ```

## Discord Developer Portal setup

1. Go to https://discord.com/developers/applications
2. Click **New Application**
3. Name it and create it
4. In **General Information**, copy **Application ID** -> set as `DISCORD_CLIENT_ID`
5. Go to **Bot** tab:
   - Click **Add Bot**
   - Copy **Token** -> set as `DISCORD_TOKEN`
6. Enable required bot scopes/intents:
   - This MVP uses slash commands and button interactions in guilds
   - `Guilds` intent is enough for this scaffold

## Get your test guild/server ID

1. In Discord, enable **Developer Mode** (User Settings -> Advanced)
2. Right-click your server and click **Copy Server ID**
3. Set that as `DISCORD_GUILD_ID`

## Invite the bot to your server

Use this URL (replace `CLIENT_ID`):

```text
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot%20applications.commands&permissions=274877910016
```

Permissions value above includes common basics for this bot (send messages, embeds, use slash commands).

## Database migration / setup

Generate migration files:

```bash
bun run db:generate
```

Apply migrations:

```bash
bun run db:migrate
```

## Deploy slash commands (to your test guild)

```bash
bun run deploy:commands
```

## Start bot locally

Dev mode (auto-reload):

```bash
bun run dev
```

Or normal run:

```bash
bun run start
```

## Notes

- Group `members` input accepts comma-separated user IDs or mentions (`<@123...>` / `<@!123...>`).
- Group names are unique per guild (case-insensitive check in command flow).
- Group creator is automatically included as a member.
- Meetups store message/channel IDs so button interactions can update the original embed.
