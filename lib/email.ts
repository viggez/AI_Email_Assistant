import {ServerClient, TemplatedMessage} from "postmark";
import type { AssistantReplyEmailParams, BroadcastContact } from "@/lib/types";

let client: ServerClient | null = null;

export function getPostmark(): ServerClient {
    if (!client) {
        const token = process.env.POSTMARK_SERVER_TOKEN;
        if (!token) {
            throw new Error("POSTMARK_SERVER_TOKEN is not set");
        }
        client = new ServerClient(token);
    }
    return client;
}

function requireSender(): string {
    const from = process.env.SENDER_EMAIL;
    if (!from) {
        throw new Error("SENDER_EMAIL is not set");
    }
    return from;
}

export async function sendAssistantReplyEmail(args: AssistantReplyEmailParams) {
    const id = args.messageId;
    await getPostmark().sendEmail({
        From: requireSender(),
        To: args.to,
        Subject: args.subject,
        TextBody: args.textBody,
        Headers: [
            {Name: "In-Reply-To", Value: id},
            {Name: "References", Value: id}
        ]
    })
}

function welcomeTemplateRef(): string | number {
    const alias = process.env.POSTMARK_WELCOME_TEMPLATE_ASLIAS?.trim();
    if (alias) return alias;

    return "welcome"
}

export async function sendWelcomeEmail(to: string, displayName: string | null)  {
    const name = displayName?.trim() || "there";
    const productName = "Email Assistant";
    const supportEmail = "support@example.com";

    await getPostmark().sendEmailWithTemplate(
        new TemplatedMessage(
            requireSender(),
            welcomeTemplateRef(),
            {
                name,
                product_name: productName,
                support_email: supportEmail
            },
            to
        )
    )
}

const BROADCAST_STREAM = "broadcast"

export async function sendBroadcastEmails(
    contacts: BroadcastContact[],
    subject: string,
    body: string
): Promise<number> {
    const from = requireSender();
    let sentCount = 0;
    for (const c of contacts) {
        await getPostmark().sendEmail(
            {
                From: from,
                To: c.email,
                Subject: subject,
                TextBody: body,
                MessageStream: BROADCAST_STREAM,
            }
        )
        sentCount++;
    }
    return sentCount;
}