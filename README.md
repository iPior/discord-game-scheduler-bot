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

## VPS Deploy Script

For VPS deployments with a `systemd` service called `discord-bot`, use:

```bash
./deploy.sh
```

What it does:

- Pulls latest code with `git pull --ff-only`
- Installs dependencies with Bun
- Runs DB migrations
- Restarts `discord-bot` service

To stop the running bot service:

```bash
./stop.sh
```

You can also pass a custom service name:

```bash
./stop.sh my-service-name
```

## Discord Slash Commands

### `/ping`

- `ping` - Replies with `Pong!`.

### `/group`

- `create name:<name> members:<optional csv mentions/ids>` - Create a new group.
- `members group:<group>` - Show members in a group.
- `add-members group:<group> members:<csv mentions/ids>` - Add members to a group.
- `remove-members group:<group> members:<csv mentions/ids>` - Remove members from a group.
- `delete group:<group>` - Delete a group.
- `rename group:<group> new-name:<name>` - Rename a group.
- `leave group:<group>` - Leave a group you are currently in.
- `help` - Show in-Discord help.

### `/list`

- `groups` - List groups in the current server (with members).

Permissions:

- `add-members` / `remove-members` can be used by the group creator or users with **Manage Server**.
- `delete` / `rename` can be used by the group creator or users with **Manage Server**.

### `/meetup`

- `propose group:<group> title:<title> date:<YYYY-MM-DD> time:<7pm or 7:15pm>` - Post meetup with RSVP buttons.
- `status meetup_id:<id>` - Show RSVP status for a meetup.
- `list` - List recent meetups in the server (includes meetup IDs and status).
- `edit meetup_id:<id> title:<optional> date:<optional> time:<optional>` - Edit your meetup.
- `cancel meetup_id:<id>` - Cancel a meetup without deleting its history.
- `delete meetup_id:<id>` - Delete your meetup.
- `timezone-set timezone:<region/city>` - Set default server timezone (with common choices in the command picker).
- `timezone-show` - Show current default server timezone.
- `setup` - Show setup guide embed.

Permissions:

- `timezone-set` requires **Manage Server**.
- `cancel` can be used by the proposer or users with **Manage Server**.
- `edit` and `delete` can only be used by the user who proposed the meetup.

## RSVP Buttons

Meetup posts include three RSVP buttons:

- `Join`
- `Maybe`
- `Can't`

Only members of the meetup's group can RSVP.

## Notifications

- When a meetup is proposed, group members are @-mentioned in the channel.
- Users who RSVP `Join` are @-mentioned 1 hour before meetup start.
