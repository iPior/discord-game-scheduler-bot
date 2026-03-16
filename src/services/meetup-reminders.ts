import type { Client } from "discord.js";
import {
  listMeetupsDueForOneHourReminder,
  listRsvpUserIdsByResponse,
  markMeetupOneHourReminderSent
} from "../db/queries";
import { logger } from "../lib/logger";
import { nowUnixSeconds } from "../utils/time";

const ONE_MINUTE_MS = 60_000;

function chunkUserIds(userIds: string[], chunkSize: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += chunkSize) {
    chunks.push(userIds.slice(i, i + chunkSize));
  }
  return chunks;
}

function buildReminderMessage(input: {
  groupName: string;
  title: string;
  startsAt: number;
  userIds: string[];
  isFirstChunk: boolean;
}): string {
  const mentions = input.userIds.map((userId) => `<@${userId}>`).join(" ");
  const prefix = input.isFirstChunk
    ? `Reminder: **${input.title}** for group **${input.groupName}** starts in 1 hour (<t:${input.startsAt}:R>).`
    : `Reminder (continued): **${input.title}** starts in 1 hour (<t:${input.startsAt}:R>).`;
  return `${prefix}\n${mentions}`;
}

export function startMeetupReminderLoop(client: Client): void {
  let isRunning = false;

  const runOnce = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const nowUnix = nowUnixSeconds();
      const dueMeetups = await listMeetupsDueForOneHourReminder(nowUnix);

      for (const meetup of dueMeetups) {
        const joinUserIds = await listRsvpUserIdsByResponse(meetup.id, "join");
        if (joinUserIds.length === 0) {
          await markMeetupOneHourReminderSent(meetup.id, nowUnixSeconds());
          continue;
        }

        try {
          const channel = await client.channels.fetch(meetup.channelId);
          if (!channel?.isTextBased() || !("send" in channel)) {
            logger.warn("Could not send meetup reminder: channel is not text-based", {
              meetupId: meetup.id,
              channelId: meetup.channelId
            });
            continue;
          }

          const mentionChunks = chunkUserIds(joinUserIds, 40);
          for (const [index, mentionChunk] of mentionChunks.entries()) {
            await channel.send({
              content: buildReminderMessage({
                groupName: meetup.groupName,
                title: meetup.title,
                startsAt: meetup.startsAt,
                userIds: mentionChunk,
                isFirstChunk: index === 0
              })
            });
          }

          await markMeetupOneHourReminderSent(meetup.id, nowUnixSeconds());
        } catch (error) {
          logger.warn("Failed to send meetup reminder", {
            meetupId: meetup.id,
            channelId: meetup.channelId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } catch (error) {
      logger.error("Meetup reminder loop failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      isRunning = false;
    }
  };

  void runOnce();
  setInterval(() => {
    void runOnce();
  }, ONE_MINUTE_MS);
}
