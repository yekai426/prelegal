import { expect, test } from "@playwright/test";

// The Playwright webServer here serves the static export with no FastAPI
// backend running behind it (see playwright.config.ts) — every /api/* call
// must be mocked via page.route, or it 404s against the static file server.

test.describe("Legal Document Assistant", () => {
  test("shows the header nav and a placeholder preview before a document type is known", async ({ page }) => {
    await page.route("**/api/chat/greeting*", (route) =>
      route.fulfill({ json: { reply: "Hi! What would you like to draft?", document_type: null } }),
    );

    await page.goto("/");

    await expect(page.getByRole("link", { name: "Create" })).toBeVisible();
    await expect(page.getByRole("link", { name: "My Documents" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Legal Document Assistant" })).toBeVisible();
    await expect(page.getByText(/once we know what document you need/i)).toBeVisible();
  });

  test("renders the classified document's preview and downloads a PDF", async ({ page }) => {
    await page.route("**/api/chat/greeting*", (route) =>
      route.fulfill({ json: { reply: "Hi! What would you like to draft?", document_type: null } }),
    );
    await page.route("**/api/chat/message", (route) =>
      route.fulfill({
        json: {
          reply: "Got it, drafting a Mutual NDA.",
          fields: {},
          document_type: "mutual_nda",
          document_type_label: "Mutual NDA",
          suggested_document_type: null,
          suggested_document_type_label: null,
        },
      }),
    );

    await page.goto("/");
    await page.getByPlaceholder(/type your message/i).fill("I need an NDA");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" })).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: /download pdf/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("mutual-nda.pdf");
  });
});
