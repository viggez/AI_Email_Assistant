export type InboundPayload = {
    From: string;
    FromFull: {Email: string; Name: string};
    To: string;
    Subject: string;
    TextBody: string;
    HtmlBody: string;
    MessageID: string;
    Headers: {Name: string; Value: string}[]
}

export type MessageLogRow = {
    id: number;
    threadId: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
}

export type ContactRow = {
    id: number;
    email: string;
    displayName: string | null;
    welcomeSentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type BroadcastContact = {
    email: string;
    displayName: string | null;
}

export type BroadcastState = {
    error?: string;
    success?: string;
    sentCount?: number;
}

export type AssistantReplyEmailParams = {
    to: string;
    subject: string;
    textBody: string;
    messageId: string;
}