export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function nowIso(): string {
  return new Date().toISOString();
}

type MeetupTimeFormatResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

type MeetupScheduleResult =
  | { ok: true; timeText: string; startsAtUnix: number }
  | { ok: false; error: string };

type IanaTimezoneValidationResult =
  | { ok: true; canonicalTimeZone: string }
  | { ok: false };

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function dayWithOrdinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${day}th`;
  }

  const mod10 = day % 10;
  if (mod10 === 1) return `${day}st`;
  if (mod10 === 2) return `${day}nd`;
  if (mod10 === 3) return `${day}rd`;
  return `${day}th`;
}

function parseDateInput(input: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function parseTimeInput(input: string): { hour24: number; minute: number } | null {
  const trimmed = input.trim();

  const twentyFourHour = /^(?:[01]?\d|2[0-3]):[0-5]\d$/.exec(trimmed);
  if (twentyFourHour) {
    const [hourPart, minutePart] = trimmed.split(":");
    return {
      hour24: Number.parseInt(hourPart, 10),
      minute: Number.parseInt(minutePart, 10)
    };
  }

  const twelveHour = /^([1-9]|1[0-2]):([0-5]\d)\s*([AaPp][Mm])$/.exec(trimmed);
  if (!twelveHour) return null;

  const hour12 = Number.parseInt(twelveHour[1], 10);
  const minute = Number.parseInt(twelveHour[2], 10);
  const period = twelveHour[3].toUpperCase();

  const hour24 =
    period === "AM"
      ? (hour12 === 12 ? 0 : hour12)
      : (hour12 === 12 ? 12 : hour12 + 12);

  return { hour24, minute };
}

function resolveTimeZoneLabel(
  year: number,
  month: number,
  day: number,
  hour24: number,
  minute: number,
  input: string
): string | null {
  const normalized = input.trim();
  const abbreviation = /^[A-Za-z]{2,5}$/;

  if (abbreviation.test(normalized)) {
    return normalized.toUpperCase();
  }

  try {
    const probe = new Date(Date.UTC(year, month - 1, day, hour24, minute));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: normalized,
      timeZoneName: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(probe);
    const timeZoneName = parts.find((part) => part.type === "timeZoneName")?.value;
    return timeZoneName ?? null;
  } catch {
    return null;
  }
}

export function validateIanaTimeZone(input: string): IanaTimezoneValidationResult {
  const normalized = input.trim();
  if (normalized.length === 0) {
    return { ok: false };
  }

  try {
    const canonicalTimeZone = new Intl.DateTimeFormat("en-US", {
      timeZone: normalized
    }).resolvedOptions().timeZone;
    return { ok: true, canonicalTimeZone };
  } catch {
    return { ok: false };
  }
}

function getTimeZoneLocalParts(unixSeconds: number, timeZone: string): {
  year: number;
  month: number;
  day: number;
  hour24: number;
  minute: number;
} | null {
  try {
    const date = new Date(unixSeconds * 1000);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date);

    const year = Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "", 10);
    const month = Number.parseInt(parts.find((part) => part.type === "month")?.value ?? "", 10);
    const day = Number.parseInt(parts.find((part) => part.type === "day")?.value ?? "", 10);
    const hour24 = Number.parseInt(parts.find((part) => part.type === "hour")?.value ?? "", 10);
    const minute = Number.parseInt(parts.find((part) => part.type === "minute")?.value ?? "", 10);

    if ([year, month, day, hour24, minute].some((value) => Number.isNaN(value))) {
      return null;
    }

    return { year, month, day, hour24, minute };
  } catch {
    return null;
  }
}

function resolveZonedDateTimeToUnixSeconds(input: {
  year: number;
  month: number;
  day: number;
  hour24: number;
  minute: number;
  timeZone: string;
}): number | null {
  const targetAsUtc = Date.UTC(input.year, input.month - 1, input.day, input.hour24, input.minute) / 1000;
  let candidate = targetAsUtc;

  for (let i = 0; i < 4; i += 1) {
    const parts = getTimeZoneLocalParts(candidate, input.timeZone);
    if (!parts) return null;

    const currentAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour24, parts.minute) / 1000;
    const delta = targetAsUtc - currentAsUtc;
    candidate += delta;

    if (delta === 0) {
      break;
    }
  }

  const verified = getTimeZoneLocalParts(candidate, input.timeZone);
  if (!verified) return null;

  const matchesTarget =
    verified.year === input.year &&
    verified.month === input.month &&
    verified.day === input.day &&
    verified.hour24 === input.hour24 &&
    verified.minute === input.minute;

  if (!matchesTarget) {
    return null;
  }

  return Math.floor(candidate);
}

export function buildMeetupSchedule(input: {
  dateInput: string;
  timeInput: string;
  timeZoneInput: string;
}): MeetupScheduleResult {
  const parsedDate = parseDateInput(input.dateInput);
  if (!parsedDate) {
    return { ok: false, error: "Invalid date. Use YYYY-MM-DD (example: 2026-03-13)." };
  }

  const parsedTime = parseTimeInput(input.timeInput);
  if (!parsedTime) {
    return { ok: false, error: "Invalid time. Use HH:MM (24h) or h:MM AM/PM (example: 7:00 PM)." };
  }

  const timeZoneLabel = resolveTimeZoneLabel(
    parsedDate.year,
    parsedDate.month,
    parsedDate.day,
    parsedTime.hour24,
    parsedTime.minute,
    input.timeZoneInput
  );

  if (!timeZoneLabel) {
    return {
      ok: false,
      error: "Invalid timezone. Use IANA (example: America/New_York) or abbreviation (example: EST)."
    };
  }

  const startsAtUnix = resolveZonedDateTimeToUnixSeconds({
    year: parsedDate.year,
    month: parsedDate.month,
    day: parsedDate.day,
    hour24: parsedTime.hour24,
    minute: parsedTime.minute,
    timeZone: input.timeZoneInput
  });

  if (startsAtUnix === null) {
    return { ok: false, error: "Could not resolve this date/time in the configured timezone." };
  }

  const hour12 = ((parsedTime.hour24 + 11) % 12) + 1;
  const minuteText = String(parsedTime.minute).padStart(2, "0");
  const dayPeriod = parsedTime.hour24 >= 12 ? "PM" : "AM";

  const weekdayIndex = new Date(Date.UTC(parsedDate.year, parsedDate.month - 1, parsedDate.day)).getUTCDay();
  const weekdayName = WEEKDAY_NAMES[weekdayIndex];
  const monthName = MONTH_NAMES[parsedDate.month - 1];
  const dayText = dayWithOrdinal(parsedDate.day);

  return {
    ok: true,
    timeText: `${hour12}:${minuteText} ${dayPeriod} [${timeZoneLabel}] ${weekdayName}, ${monthName} ${dayText} ${parsedDate.year}`,
    startsAtUnix
  };
}

export function formatOfficialMeetupTime(input: {
  dateInput: string;
  timeInput: string;
  timeZoneInput: string;
}): MeetupTimeFormatResult {
  const schedule = buildMeetupSchedule(input);
  if (!schedule.ok) {
    return schedule;
  }

  return {
    ok: true,
    value: schedule.timeText
  };
}

const ONE_HOUR_SECONDS = 60 * 60;
const ONE_DAY_SECONDS = 24 * ONE_HOUR_SECONDS;

export function calculateMeetupProposalExpiresAt(input: { meetupStartsAtUnix: number; nowUnix: number }): number {
  if (input.meetupStartsAtUnix - input.nowUnix > ONE_DAY_SECONDS) {
    return input.nowUnix + ONE_DAY_SECONDS;
  }

  return input.meetupStartsAtUnix - ONE_HOUR_SECONDS;
}
