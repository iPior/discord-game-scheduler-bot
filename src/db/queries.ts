import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "./client";
import { groupMembers, groups, guildSettings, meetups, rsvps } from "./schema";
import { nowUnixSeconds } from "../utils/time";
import type { RsvpResponse } from "../utils/custom-ids";

type CreateGroupInput = {
  guildId: string;
  name: string;
  createdByUserId: string;
  additionalMemberIds: string[];
};

export async function createGroupWithMembers(input: CreateGroupInput): Promise<
  | { ok: true; groupId: number; memberCount: number }
  | { ok: false; reason: "duplicate_name" }
> {
  const normalized = input.name.trim();
  const existing = await db
    .select({ id: groups.id })
    .from(groups)
    .where(
      and(
        eq(groups.guildId, input.guildId),
        sql`lower(${groups.name}) = ${normalized.toLowerCase()}`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, reason: "duplicate_name" };
  }

  const [inserted] = await db
    .insert(groups)
    .values({
      guildId: input.guildId,
      name: normalized,
      createdBy: input.createdByUserId
    })
    .returning({ id: groups.id });

  const memberSet = new Set<string>([input.createdByUserId, ...input.additionalMemberIds]);
  const memberRows = [...memberSet].map((userId) => ({
    groupId: inserted.id,
    userId
  }));

  if (memberRows.length > 0) {
    await db.insert(groupMembers).values(memberRows).onConflictDoNothing();
  }

  return { ok: true, groupId: inserted.id, memberCount: memberSet.size };
}

export async function listGroupsForGuild(guildId: string): Promise<Array<{ id: number; name: string; memberCount: number }>> {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      memberCount: sql<number>`count(${groupMembers.id})`
    })
    .from(groups)
    .leftJoin(groupMembers, eq(groupMembers.groupId, groups.id))
    .where(eq(groups.guildId, guildId))
    .groupBy(groups.id)
    .orderBy(asc(groups.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    memberCount: Number(row.memberCount)
  }));
}

export async function findGroupByNameForGuild(guildId: string, name: string): Promise<{ id: number; name: string } | null> {
  const normalized = name.trim();

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name
    })
    .from(groups)
    .where(
      and(
        eq(groups.guildId, guildId),
        sql`lower(${groups.name}) = ${normalized.toLowerCase()}`
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function findGroupByNameForGuildWithOwner(
  guildId: string,
  name: string
): Promise<{ id: number; name: string; createdBy: string } | null> {
  const normalized = name.trim();

  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      createdBy: groups.createdBy
    })
    .from(groups)
    .where(
      and(
        eq(groups.guildId, guildId),
        sql`lower(${groups.name}) = ${normalized.toLowerCase()}`
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getGuildDefaultTimeZone(guildId: string): Promise<string | null> {
  const rows = await db
    .select({ defaultTimeZone: guildSettings.defaultTimeZone })
    .from(guildSettings)
    .where(eq(guildSettings.guildId, guildId))
    .limit(1);

  return rows[0]?.defaultTimeZone ?? null;
}

export async function upsertGuildDefaultTimeZone(input: {
  guildId: string;
  defaultTimeZone: string;
}): Promise<void> {
  const updatedAt = nowUnixSeconds();

  await db
    .insert(guildSettings)
    .values({
      guildId: input.guildId,
      defaultTimeZone: input.defaultTimeZone,
      updatedAt
    })
    .onConflictDoUpdate({
      target: guildSettings.guildId,
      set: {
        defaultTimeZone: input.defaultTimeZone,
        updatedAt
      }
    });
}

export async function listGroupMemberUserIds(groupId: number): Promise<string[]> {
  const rows = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(asc(groupMembers.userId));

  return rows.map((row) => row.userId);
}

export async function addMembersToGroup(groupId: number, userIds: string[]): Promise<number> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return 0;

  const before = await db
    .select({ count: sql<number>`count(*)` })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  await db
    .insert(groupMembers)
    .values(unique.map((userId) => ({ groupId, userId })))
    .onConflictDoNothing();

  const after = await db
    .select({ count: sql<number>`count(*)` })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));

  return Number(after[0]?.count ?? 0) - Number(before[0]?.count ?? 0);
}

export async function removeMembersFromGroup(groupId: number, userIds: string[]): Promise<number> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return 0;

  const existing = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), inArray(groupMembers.userId, unique)));

  if (existing.length === 0) return 0;

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), inArray(groupMembers.userId, unique)));

  return existing.length;
}

export async function isUserMemberOfGroup(groupId: number, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);

  return rows.length > 0;
}

export async function createMeetup(input: {
  guildId: string;
  groupId: number;
  title: string;
  timeText: string;
  expiresAt: number;
  proposedByUserId: string;
}): Promise<{ id: number; title: string; timeText: string; proposedBy: string }> {
  const [inserted] = await db
    .insert(meetups)
    .values({
      guildId: input.guildId,
      groupId: input.groupId,
      title: input.title.trim(),
      timeText: input.timeText.trim(),
      expiresAt: input.expiresAt,
      proposedBy: input.proposedByUserId
    })
    .returning({
      id: meetups.id,
      title: meetups.title,
      timeText: meetups.timeText,
      proposedBy: meetups.proposedBy
    });

  return inserted;
}

export async function updateMeetupMessageLocation(input: {
  meetupId: number;
  channelId: string;
  messageId: string;
}): Promise<void> {
  await db
    .update(meetups)
    .set({
      channelId: input.channelId,
      messageId: input.messageId
    })
    .where(eq(meetups.id, input.meetupId));
}

export async function updateMeetupDetails(input: {
  meetupId: number;
  title?: string;
  timeText?: string;
  expiresAt?: number;
}): Promise<void> {
  const updatePayload: { title?: string; timeText?: string; expiresAt?: number } = {};

  if (typeof input.title === "string") {
    updatePayload.title = input.title.trim();
  }

  if (typeof input.timeText === "string") {
    updatePayload.timeText = input.timeText.trim();
  }

  if (typeof input.expiresAt === "number") {
    updatePayload.expiresAt = input.expiresAt;
  }

  if (Object.keys(updatePayload).length === 0) {
    return;
  }

  await db
    .update(meetups)
    .set(updatePayload)
    .where(eq(meetups.id, input.meetupId));
}

export async function deleteMeetupById(meetupId: number): Promise<void> {
  await db.delete(meetups).where(eq(meetups.id, meetupId));
}

export async function getMeetupByIdWithGroup(meetupId: number): Promise<{
  id: number;
  guildId: string;
  groupId: number;
  groupName: string;
  title: string;
  timeText: string;
  proposedBy: string;
  expiresAt: number;
  channelId: string | null;
  messageId: string | null;
} | null> {
  const rows = await db
    .select({
      id: meetups.id,
      guildId: meetups.guildId,
      groupId: meetups.groupId,
      groupName: groups.name,
      title: meetups.title,
      timeText: meetups.timeText,
      proposedBy: meetups.proposedBy,
      expiresAt: meetups.expiresAt,
      channelId: meetups.channelId,
      messageId: meetups.messageId
    })
    .from(meetups)
    .innerJoin(groups, eq(groups.id, meetups.groupId))
    .where(eq(meetups.id, meetupId))
    .limit(1);

  return rows[0] ?? null;
}

export async function upsertRsvp(input: {
  meetupId: number;
  userId: string;
  response: RsvpResponse;
}): Promise<void> {
  const updatedAt = nowUnixSeconds();

  await db
    .insert(rsvps)
    .values({
      meetupId: input.meetupId,
      userId: input.userId,
      response: input.response,
      updatedAt
    })
    .onConflictDoUpdate({
      target: [rsvps.meetupId, rsvps.userId],
      set: {
        response: input.response,
        updatedAt
      }
    });
}

export async function getRsvpCounts(meetupId: number): Promise<{ join: number; maybe: number; cant: number }> {
  const rows = await db
    .select({
      response: rsvps.response,
      count: sql<number>`count(*)`
    })
    .from(rsvps)
    .where(eq(rsvps.meetupId, meetupId))
    .groupBy(rsvps.response);

  const counts = { join: 0, maybe: 0, cant: 0 };
  for (const row of rows) {
    if (row.response === "join" || row.response === "maybe" || row.response === "cant") {
      counts[row.response] = Number(row.count);
    }
  }

  return counts;
}

export async function listRsvpUserIdsByResponse(
  meetupId: number,
  response: RsvpResponse
): Promise<string[]> {
  const rows = await db
    .select({ userId: rsvps.userId })
    .from(rsvps)
    .where(and(eq(rsvps.meetupId, meetupId), eq(rsvps.response, response)))
    .orderBy(asc(rsvps.userId));

  return rows.map((row) => row.userId);
}
