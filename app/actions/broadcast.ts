"use server"

import { getAllContacts } from "@/lib/db"
import { sendBroadcastEmails } from "@/lib/email"
import type { BroadcastState } from "@/lib/types"

export async function sendBroadcast(
    _prevState: BroadcastState,
    formData: FormData
): Promise<BroadcastState> {
    const subject = String(formData.get("subject") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    if (!subject || !body) { 
        return {error: "Subject and body are required"}
    }

    const rows = await getAllContacts();
    if (rows.length === 0) {
        return {error: "No contacts found"}
    }

    const contacts = rows.map((r) => ({
        email: r.email,
        displayName: r.displayName,
    }))

    const sentCount = await sendBroadcastEmails(contacts, subject, body);

    return {success: `Broadcast sent to ${sentCount} contacts`, sentCount}
}