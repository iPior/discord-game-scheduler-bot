export const RSVP_CUSTOM_ID_PREFIX = "meetup_rsvp";

export type RsvpResponse = "join" | "maybe" | "cant";

export function createMeetupRsvpCustomId(meetupId: number, response: RsvpResponse): string {
  return `${RSVP_CUSTOM_ID_PREFIX}:${meetupId}:${response}`;
}

export function isMeetupRsvpCustomId(customId: string): boolean {
  return customId.startsWith(`${RSVP_CUSTOM_ID_PREFIX}:`);
}

export function parseMeetupRsvpCustomId(
  customId: string
): { meetupId: number; response: RsvpResponse } | null {
  const parts = customId.split(":");
  if (parts.length !== 3) return null;
  if (parts[0] !== RSVP_CUSTOM_ID_PREFIX) return null;

  const meetupId = Number.parseInt(parts[1], 10);
  if (!Number.isInteger(meetupId) || meetupId <= 0) return null;

  const response = parts[2];
  if (response !== "join" && response !== "maybe" && response !== "cant") {
    return null;
  }

  return { meetupId, response };
}
