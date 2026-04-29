import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEmail = vi.fn();
const sendEmailWithTemplate = vi.fn();

vi.mock("postmark", () => ({
  ServerClient: vi.fn(function ServerClient() {
    return {
      sendEmail,
      sendEmailWithTemplate,
    };
  }),
  TemplatedMessage: vi.fn(function TemplatedMessage(
    from,
    templateAlias,
    templateModel,
    to,
  ) {
    return {
      from,
      templateAlias,
      templateModel,
      to,
    };
  }),
}));

describe("email delivery helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv("POSTMARK_SERVER_TOKEN", "test-token");
    vi.stubEnv("SENDER_EMAIL", "assistant@example.com");
  });

  it("adds reply threading headers when sending assistant replies", async () => {
    const { sendAssistantReplyEmail } = await import("@/lib/email");

    await sendAssistantReplyEmail({
      to: "sender@example.com",
      subject: "Re: Hello",
      textBody: "Thanks for writing.",
      messageId: "msg-123",
    });

    expect(sendEmail).toHaveBeenCalledWith({
      From: "assistant@example.com",
      To: "sender@example.com",
      Subject: "Re: Hello",
      TextBody: "Thanks for writing.",
      Headers: [
        { Name: "In-Reply-To", Value: "msg-123" },
        { Name: "References", Value: "msg-123" },
      ],
    });
  });

  it("uses a friendly fallback name in welcome emails", async () => {
    const { sendWelcomeEmail } = await import("@/lib/email");

    await sendWelcomeEmail("new@example.com", "   ");

    expect(sendEmailWithTemplate).toHaveBeenCalledWith({
      from: "assistant@example.com",
      templateAlias: "welcome",
      templateModel: {
        name: "there",
        product_name: "Email Assistant",
        support_email: "support@example.com",
      },
      to: "new@example.com",
    });
  });
});
