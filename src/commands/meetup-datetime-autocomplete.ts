import { type AutocompleteInteraction } from "discord.js";
import { getGuildDefaultTimeZone } from "../db/queries";

const MAX_CHOICES = 25;
const MAX_DAYS_AHEAD = 10;

type Choice = { name: string; value: string };

function formatDateParts(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "", 10);
  const month = Number.parseInt(parts.find((part) => part.type === "month")?.value ?? "", 10);
  const day = Number.parseInt(parts.find((part) => part.type === "day")?.value ?? "", 10);

  return { year, month, day };
}

function toDateValue(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function toDateLabel(dateValue: string, timeZone: string): string {
  const [yearText, monthText, dayText] = dateValue.split("-");
  const year = Number.parseInt(yearText, 10);
  const month = Number.parseInt(monthText, 10);
  const day = Number.parseInt(dayText, 10);

  const display = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));

  return `${display} (${dateValue})`;
}

function getDateChoices(query: string, timeZone: string): Choice[] {
  const now = new Date();
  const generated: Choice[] = [];
  const seen = new Set<string>();

  for (let i = 0; i <= MAX_DAYS_AHEAD; i += 1) {
    const probe = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const value = toDateValue(formatDateParts(probe, timeZone));
    if (seen.has(value)) continue;
    seen.add(value);
    generated.push({
      name: toDateLabel(value, timeZone),
      value
    });
  }

  const todayValue = generated[0]?.value;
  const todayAlias = todayValue
    ? { name: `Today (${toDateLabel(todayValue, timeZone)})`, value: "today" }
    : null;

  const allChoices = todayAlias ? [todayAlias, ...generated] : generated;

  if (query.length === 0) {
    return allChoices.slice(0, MAX_CHOICES);
  }

  if ("today".startsWith(query.toLowerCase())) {
    return allChoices.slice(0, MAX_CHOICES);
  }

  const startsWith = allChoices.filter((choice) => choice.value.startsWith(query));
  const includes = allChoices.filter(
    (choice) => !choice.value.startsWith(query) && choice.value.includes(query)
  );

  return [...startsWith, ...includes].slice(0, MAX_CHOICES);
}

function toTwelveHour(hour24: number, minute: number): string {
  const hour12 = ((hour24 + 11) % 12) + 1;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function toNaturalTime(hour24: number, minute: number): string {
  const hour12 = ((hour24 + 11) % 12) + 1;
  const suffix = hour24 >= 12 ? "pm" : "am";

  if (minute === 0) {
    return `${hour12}${suffix}`;
  }

  return `${hour12}:${String(minute).padStart(2, "0")}${suffix}`;
}

function getTimeChoices(query: string): Choice[] {
  const normalizedQuery = query.toLowerCase();
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const generated: Choice[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      const twentyFour = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const twelve = toTwelveHour(hour, minute);
      const natural = toNaturalTime(hour, minute);

      generated.push({ name: `${natural} (${twelve}, ${twentyFour})`, value: natural });
    }
  }

  if (normalizedQuery.length === 0) {
    const preferred = [
      "7pm",
      "7:15pm",
      "8pm",
      "6pm",
      "9pm",
      "12pm",
      "10am",
      "3pm",
      "6:30pm",
      "7:30pm"
    ];

    const picked = preferred
      .map((value) => generated.find((choice) => choice.value === value))
      .filter((choice): choice is Choice => Boolean(choice));

    return picked.slice(0, MAX_CHOICES);
  }

  const startsWith = generated.filter(
    (choice) =>
      choice.value.toLowerCase().startsWith(compactQuery) ||
      choice.name.toLowerCase().replace(/\s+/g, "").startsWith(compactQuery)
  );
  const includes = generated.filter(
    (choice) =>
      !choice.value.toLowerCase().startsWith(compactQuery) &&
      !choice.name.toLowerCase().replace(/\s+/g, "").startsWith(compactQuery) &&
      (choice.value.toLowerCase().includes(compactQuery) ||
        choice.name.toLowerCase().replace(/\s+/g, "").includes(compactQuery))
  );

  return [...startsWith, ...includes].slice(0, MAX_CHOICES);
}

export async function handleMeetupDateTimeAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused(true);

  if (focused.name === "date") {
    let timeZone = "UTC";

    if (interaction.guildId) {
      const guildTimeZone = await getGuildDefaultTimeZone(interaction.guildId);
      if (guildTimeZone) {
        timeZone = guildTimeZone;
      }
    }

    const choices = getDateChoices(String(focused.value ?? "").trim(), timeZone);
    await interaction.respond(choices);
    return;
  }

  if (focused.name === "time") {
    const choices = getTimeChoices(String(focused.value ?? "").trim());
    await interaction.respond(choices);
    return;
  }

  await interaction.respond([]);
}
