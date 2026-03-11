import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const groups = sqliteTable(
  "groups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    guildId: text("guild_id").notNull(),
    name: text("name").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => ({
    guildNameUnique: uniqueIndex("groups_guild_name_unique").on(table.guildId, table.name)
  })
);

export const guildSettings = sqliteTable(
  "guild_settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    guildId: text("guild_id").notNull(),
    defaultTimeZone: text("default_time_zone").notNull(),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => ({
    guildUnique: uniqueIndex("guild_settings_guild_unique").on(table.guildId)
  })
);

export const groupMembers = sqliteTable(
  "group_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    addedAt: integer("added_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => ({
    groupUserUnique: uniqueIndex("group_members_group_user_unique").on(table.groupId, table.userId)
  })
);

export const meetups = sqliteTable("meetups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  guildId: text("guild_id").notNull(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  timeText: text("time_text").notNull(),
  proposedBy: text("proposed_by").notNull(),
  expiresAt: integer("expires_at").notNull(),
  channelId: text("channel_id"),
  messageId: text("message_id"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`)
});

export const rsvps = sqliteTable(
  "rsvps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    meetupId: integer("meetup_id")
      .notNull()
      .references(() => meetups.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    response: text("response").notNull(),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`)
  },
  (table) => ({
    meetupUserUnique: uniqueIndex("rsvps_meetup_user_unique").on(table.meetupId, table.userId)
  })
);
