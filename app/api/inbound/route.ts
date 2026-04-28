import {NextResponse} from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {saveMessage, upsertContactFromInbound, shouldSendWelcome, markWelcomeSent} from "@/lib/db"
import {sendWelcomeEmail, sendAssistantReplyEmail} from "@/lib/email"
import type {InboundPayload} from "@/lib/types";
import {inboundAssistantSystemPrompt} from "@/lib/prompts/inbound-assistant";

const anthropic = new Anthropic() 

export async function POST(request: Request) {
    const payload: InboundPayload = await request.json();

    const senderEmail = payload.FromFull.Email;
    const displayName = payload.FromFull?.Name?.trim() || null;
    const subject = payload.Subject || "(no subject)";
    const userMessage = (payload.TextBody || "").trim();
    const messageId = payload.MessageID;

    if (!userMessage) {
        return NextResponse.json({status: "empty message, skipped"})
    }

    const conversationKey = messageId;

    await upsertContactFromInbound(senderEmail, displayName);

    if (await shouldSendWelcome(senderEmail)) {
        try {
            // send email
            await sendWelcomeEmail(senderEmail, displayName);
            await markWelcomeSent(senderEmail)
        } catch (err) {
            console.error("[inbound] welcome failed", err)
        }
    }

    await saveMessage(conversationKey, "user", userMessage);

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: inboundAssistantSystemPrompt,
        messages: [{role: "user", content: userMessage}]
    })

    const reply = response.content[0].type === "text" ?
        response.content[0].text : "Sorry I cant generate a response right now";

    await sendAssistantReplyEmail({
        to: senderEmail,
        subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
        textBody: reply,
        messageId: messageId
    })

    await saveMessage(conversationKey, "assistant", reply);

    console.log(`[inbound] replied to ${senderEmail} | inbound: ${messageId}`)
    console.log(`[outbound] replied with: ${reply}`)


    return NextResponse.json({status: "ok"})
}