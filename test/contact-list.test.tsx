import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactList } from "@/components/ContactList";

describe("ContactList", () => {
  it("shows contact names and welcome status", () => {
    render(
      <ContactList
        contacts={[
          {
            id: 1,
            email: "ada@example.com",
            displayName: "Ada Lovelace",
            welcomeSentAt: null,
            createdAt: new Date("2026-01-01T10:00:00Z"),
            updatedAt: new Date("2026-01-01T10:00:00Z"),
          },
        ]}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("Welcome email")).toBeTruthy();
    expect(screen.getByText("Not sent yet")).toBeTruthy();
  });
});
