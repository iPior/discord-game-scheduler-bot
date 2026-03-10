import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { env } from "../config/env";
import * as schema from "./schema";

export const sqlite = new Database(env.DATABASE_URL, { create: true });
export const db = drizzle(sqlite, { schema });
