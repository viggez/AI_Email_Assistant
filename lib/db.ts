import {drizzle} from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {sqliteTable, text, integer} from "drizzle-orm/sqlite-core";
import {eq, asc, desc} from "drizzle-orm";
import type {ContactRow, MessageLogRow} from "@/lib/types";


export const messages = sqliteTable("messages", {
    id: integer("id").primaryKey({autoIncrement: true}),
    threadId: text("thread_id").notNull(),
    role: text("role", {enum: ["user", "assistant"]}).notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at", {mode: "timestamp"}).notNull().$defaultFn(() => new Date()),
});


export const contacts = sqliteTable("contacts", {
    id: integer("id").primaryKey({autoIncrement: true}),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    welcomeSentAt: integer("welcome_sent_at", {mode: "timestamp"}),
    createdAt: integer("created_at", {mode: "timestamp"}).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", {mode: "timestamp"}).notNull().$defaultFn(() => new Date()),
});

const sqlite = new Database("emails.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, {schema: {messages, contacts}});

export async function saveMessage(
    threadId: string,
    role: "user" | "assistant",
    content: string
) {
    await db.insert(messages).values({threadId, role, content})
}

export async function getRecentMessageLog(limit: number = 200): Promise<MessageLogRow[]> {
    const rows = await db.select(
        {
            id: messages.id, 
            threadId: messages.threadId,
            role: messages.role,
            content: messages.content,
            createdAt: messages.createdAt,
        }
    )
    .from(messages)
    .orderBy(desc(messages.createdAt))
    .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        threadId: row.threadId,
        role: row.role,
        content: row.content,
        createdAt: new Date(row.createdAt),
    }));
}

export async function upsertContactFromInbound(
    email: string,
    displayName: string | null,
) {
    const now = new Date();
    await db
        .insert(contacts)
        .values({
            email,
            displayName,
            welcomeSentAt: null,
            createdAt: now,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: contacts.email,
            set: {
                displayName,
                updatedAt: now,
            },
        });
}

export async function markWelcomeSent(email: string) {
    await db
        .update(contacts)
        .set({welcomeSentAt: new Date(), updatedAt: new Date()})
        .where(eq(contacts.email, email))
}

export async function shouldSendWelcome(email: string): Promise<boolean> {
    const rows = await db
        .select({welcomeSentAt: contacts.welcomeSentAt})
        .from(contacts)
        .where(eq(contacts.email, email))
        .limit(1)

    return rows[0]?.welcomeSentAt == null;
}

export async function getAllContacts(): Promise<ContactRow[]> {
    const rows = await db
        .select()
        .from(contacts)
        .orderBy(asc(contacts.email))

    return rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.displayName,
        welcomeSentAt: row.welcomeSentAt ?? null,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
    }));
}