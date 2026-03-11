// Utilities for working with user IDs provided via slash command string options.
// For MVP we accept comma-separated raw IDs or mention forms like <@123> / <@!123>.

export function parseUserIdsCsv(raw: string | null): string[] {
  if (!raw) return [];

  const tokens = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const ids = new Set<string>();

  for (const token of tokens) {
    const mentionMatch = token.match(/^<@!?(\d{16,20})>$/);
    if (mentionMatch) {
      ids.add(mentionMatch[1]);
      continue;
    }

    const rawIdMatch = token.match(/^(\d{16,20})$/);
    if (rawIdMatch) {
      ids.add(rawIdMatch[1]);
    }
  }

  return [...ids];
}
