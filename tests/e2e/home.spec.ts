import { expect, test } from "@playwright/test";

test("home page exposes the email assistant workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Email log" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Broadcast" })).toBeVisible();
  await expect(page.getByLabel("Subject")).toBeVisible();
  await expect(page.getByLabel("Body")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send Broadcast" })).toBeVisible();
});
