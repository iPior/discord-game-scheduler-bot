# Discord Meetup Coordination Bot

A local-first Discord bot for coordinating meetup groups in a server.

## Setup

1. Install dependencies:

```bash
bun install
```

2. Copy `.env.example` to `.env` and fill values.

Required env vars:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`

Optional env vars:

- `DATABASE_URL` (default: `./sqlite.db`)
- `LOG_LEVEL` (default: `info`)

3. Generate and run DB migrations:

```bash
bun run db:generate
bun run db:migrate
```

4. Deploy slash commands to your test guild:

```bash
bun run deploy:commands
```

5. Start the bot:

```bash
bun run dev
```

## Project Commands (CLI)

- `bun run dev` - Run bot in watch mode.
- `bun run start` - Run bot once.
- `bun run deploy:commands` - Register slash commands to `DISCORD_GUILD_ID`.
- `bun run db:generate` - Generate Drizzle migration files.
- `bun run db:migrate` - Apply migrations.

## Discord Slash Commands

### `/ping`

- `ping` - Replies with `Pong!`.

### `/group`

- `create name:<name> members:<optional csv mentions/ids>` - Create a new group.
- `list` - List groups in the current server.
- `members group:<group>` - Show members in a group.
- `add-members group:<group> members:<csv mentions/ids>` - Add members to a group.
- `remove-members group:<group> members:<csv mentions/ids>` - Remove members from a group.
- `help` - Show in-Discord help.

Permissions:

- `add-members` / `remove-members` can be used by the group creator or users with **Manage Server**.

### `/meetup`

- `propose group:<group> title:<title> date:<YYYY-MM-DD> time:<HH:MM or h:MM AM/PM>` - Post meetup with RSVP buttons.
- `status meetup_id:<id>` - Show RSVP status for a meetup.
- `edit meetup_id:<id> title:<optional> date:<optional> time:<optional>` - Edit your meetup.
- `delete meetup_id:<id>` - Delete your meetup.
- `timezone-set timezone:<IANA>` - Set default server timezone.
- `timezone-show` - Show current default server timezone.
- `setup` - Show setup guide embed.

Permissions:

- `timezone-set` requires **Manage Server**.
- `edit` and `delete` can only be used by the user who proposed the meetup.

## RSVP Buttons

Meetup posts include three RSVP buttons:

- `Join`
- `Maybe`
- `Can't`

Only members of the meetup's group can RSVP.
