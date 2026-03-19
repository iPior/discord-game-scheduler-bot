# Repository Guidelines

## Project Structure & Module Organization
- `src/index.ts` is the runtime entrypoint and wires Discord events to command/interaction handlers.
- `src/commands/` contains slash command modules (group and meetup flows).
- `src/interactions/` handles component interactions (for example RSVP buttons).
- `src/services/` contains background loops (for example meetup reminders).
- `src/db/` contains Drizzle client, schema, and query helpers.
- `src/utils/` and `src/lib/` hold reusable helpers and shared integrations (Discord client, logging).
- `drizzle/` stores generated SQL migrations and Drizzle metadata snapshots.

## Build, Test, and Development Commands
- `bun install`: install dependencies.
- `bun run dev`: run bot in watch mode for local development.
- `bun run start`: run once without watch mode.
- `bun run deploy:commands`: register slash commands to `DISCORD_GUILD_ID`.
- `bun run db:generate`: generate migrations from `src/db/schema.ts`.
- `bun run db:migrate`: apply migrations to `DATABASE_URL` (defaults to `./sqlite.db`).
- `./deploy.sh`: VPS deploy helper (pull, install, migrate, restart service).

## Coding Style & Naming Conventions
- Language: TypeScript (ES modules, strict mode).
- Formatting: follow existing style (2-space indent, semicolons, double quotes).
- Naming:
  - Files: kebab-case (for example `meetup-propose.ts`).
  - Functions/variables: camelCase.
  - Types/interfaces/classes: PascalCase.
  - DB columns: snake_case in schema mappings.
- Keep command handlers focused; move shared logic into `src/utils/`, `src/services/`, or `src/db/queries.ts`.

## Testing Guidelines
- There is currently no automated test suite in `package.json`.
- Before opening a PR, validate changes by:
  - running `bun run dev` and exercising affected slash commands in a test guild,
  - running `bun run db:migrate` when schema/query changes are included,
  - confirming logs are clean and error paths return ephemeral messages where expected.
- If you add tests, place them under `src/**/__tests__/` or `src/**/*.test.ts` and add a runnable script.

## Commit & Pull Request Guidelines
- Commit style in this repo uses concise, imperative summaries (for example `Add group-name autocomplete for command inputs`).
- Keep commits scoped to one change.
- PRs should include:
  - a short problem/solution description,
  - linked issue (if available),
  - migration notes (`drizzle/*` changes),
  - screenshots or copied Discord responses for UX-visible command changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; never commit secrets.
- Required vars: `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`.
- Use a dedicated test guild for command deployment and behavior validation.
