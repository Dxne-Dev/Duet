import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export type SignalDescription = {
  type: "offer" | "answer";
  sdp: string;
};

export type Singer = "A" | "B" | "BOTH";

export type LyricLine = {
  at: number;
  end: number;
  singer: Singer;
  text: string;
};

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 6 }).notNull().unique(),
    trackId: varchar("track_id", { length: 64 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("WAITING"),
    playerAName: varchar("player_a_name", { length: 50 }).notNull(),
    playerBName: varchar("player_b_name", { length: 50 }),
    playerAToken: varchar("player_a_token", { length: 64 }).notNull(),
    playerBToken: varchar("player_b_token", { length: 64 }),
    playerAReady: boolean("player_a_ready").notNull().default(false),
    playerBReady: boolean("player_b_ready").notNull().default(false),
    startTimestamp: bigint("start_timestamp", { mode: "number" }),
    playerAScore: integer("player_a_score"),
    playerBScore: integer("player_b_score"),
    abandonedByName: varchar("abandoned_by_name", { length: 50 }),
    destroyAt: bigint("destroy_at", { mode: "number" }),
    offer: jsonb("offer").$type<SignalDescription>(),
    answer: jsonb("answer").$type<SignalDescription>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("rooms_code_idx").on(table.code)],
);

export type Room = typeof rooms.$inferSelect;

export const tracksTable = pgTable("tracks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 120 }).notNull(),
  artist: varchar("artist", { length: 120 }).notNull(),
  genre: varchar("genre", { length: 60 }).notNull().default("Pop"),
  duration: integer("duration").notNull(),
  durationLabel: varchar("duration_label", { length: 20 }).notNull(),
  bpm: integer("bpm").notNull().default(120),
  key: varchar("key", { length: 20 }).notNull().default("C"),
  coverUrl: varchar("cover_url", { length: 500 }).notNull(),
  audioUrl: varchar("audio_url", { length: 500 }).notNull().default(""),
  color: varchar("color", { length: 30 }).notNull().default("#f13d8f"),
  accent: varchar("accent", { length: 30 }).notNull().default("#ffbfdc"),
  lyrics: jsonb("lyrics").$type<LyricLine[]>().notNull().default([]),
  isPublished: boolean("is_published").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DbTrack = typeof tracksTable.$inferSelect;
export type NewDbTrack = typeof tracksTable.$inferInsert;

