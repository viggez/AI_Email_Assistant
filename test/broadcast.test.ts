import { beforeEach, describe, expect, it, vi } from "vitest";

const getAllContacts = vi.fn();
const sendBroadcastEmails = vi.fn();

vi.mock("@/lib/db", () => ({
  getAllContacts,
}));

vi.mock("@/lib/email", () => ({
  sendBroadcastEmails,
}));

describe("sendBroadcast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty subject or body before reading contacts", async () => {
    const { sendBroadcast } = await import("@/app/actions/broadcast");
    const formData = new FormData();
    formData.set("subject", "   ");
    formData.set("body", "Hello");

    await expect(sendBroadcast({}, formData)).resolves.toEqual({
      error: "Subject and body are required",
    });
    expect(getAllContacts).not.toHaveBeenCalled();
  });

  it("sends a broadcast to all stored contacts", async () => {
    const { sendBroadcast } = await import("@/app/actions/broadcast");
    getAllContacts.mockResolvedValue([
      {
        id: 1,
        email: "ada@example.com",
        displayName: "Ada",
        welcomeSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        email: "grace@example.com",
        displayName: null,
        welcomeSentAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    sendBroadcastEmails.mockResolvedValue(2);

    const formData = new FormData();
    formData.set("subject", " Product update ");
    formData.set("body", " New release today ");

    await expect(sendBroadcast({}, formData)).resolves.toEqual({
      success: "Broadcast sent to 2 contacts",
      sentCount: 2,
    });
    expect(sendBroadcastEmails).toHaveBeenCalledWith(
      [
        { email: "ada@example.com", displayName: "Ada" },
        { email: "grace@example.com", displayName: null },
      ],
      "Product update",
      "New release today",
    );
  });
});
