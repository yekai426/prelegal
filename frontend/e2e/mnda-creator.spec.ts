import { expect, test } from "@playwright/test";

test.describe("Mutual NDA Creator", () => {
  test("loads the form and a live preview of the document", async ({
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

  test("updates the live preview as form fields are filled in", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Governing Law").fill("Delaware");
    await page
      .getByLabel("Jurisdiction")
      .fill("courts located in New Castle, DE");

    await expect(page.getByText("Governing Law: Delaware")).toBeVisible();
    await expect(
      page.getByText("Jurisdiction: courts located in New Castle, DE"),
    ).toBeVisible();
  });

  test("toggling MNDA Term to Continues disables duration and updates the document text", async ({
    page,
  }) => {
    await page.goto("/");
    const mndaTermGroup = page.getByRole("group", { name: /mnda term/i });

    await mndaTermGroup.getByRole("radio", { name: /continues/i }).check();

    await expect(mndaTermGroup.getByRole("spinbutton")).toBeDisabled();
    await expect(
      page.getByText(
        "This MNDA continues until terminated in accordance with the terms of the MNDA.",
      ),
    ).toBeVisible();
  });

  test("clamps a negative MNDA Term duration to 1 in both the input and the document", async ({
    page,
  }) => {
    await page.goto("/");
    const mndaTermGroup = page.getByRole("group", { name: /mnda term/i });
    const durationInput = mndaTermGroup.getByRole("spinbutton");

    await durationInput.fill("-5");

    await expect(durationInput).toHaveValue("1");
    await expect(
      page.getByText("This MNDA expires 1 year from the Effective Date."),
    ).toBeVisible();
  });

  test("does not render markdown-like syntax typed into Purpose as real markup", async ({
    page,
  }) => {
    await page.goto("/");
    const raw =
      "Evaluating a **strategic** deal for [our teams](https://example.com)";

    await page.getByLabel(/purpose/i).fill(raw);

    const preview = page.locator("article");
    await expect(preview.getByText(raw)).toBeVisible();
    await expect(preview.getByRole("link", { name: "our teams" })).toHaveCount(
      0,
    );
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
