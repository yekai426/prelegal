import { expect, test } from "@playwright/test";

test.describe("Mutual NDA Creator", () => {
  test("loads the chat and a live preview of the document", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Mutual NDA Creator" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeVisible();
  });

  test("downloads a PDF of the completed document", async ({ page }) => {
    await page.goto("/");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: /download pdf/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("mutual-nda.pdf");
  });
});
