import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import { expect, test } from "@playwright/test";

// The PDF renderer (components/pdf/MndaPdfDocument.tsx) is a separate render
// path from the on-screen preview and once actually parsed user-typed free
// text as markdown when the preview did not (see PR #4's review fixes). The
// other E2E test only checks the download's filename, not its content, so
// this test inspects the real generated PDF bytes to guard against that
// specific class of regression recurring.
test("downloaded PDF does not parse markdown-like syntax typed into Purpose", async ({
  page,
}) => {
  await page.goto("/");
  const raw =
    "Evaluating a **strategic** deal for [our teams](https://example.com)";
  await page.getByLabel(/purpose/i).fill(raw);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: /download pdf/i }).click(),
  ]);

  const downloadPath = path.join(os.tmpdir(), `mnda-e2e-${Date.now()}.pdf`);
  await download.saveAs(downloadPath);
  const buffer = fs.readFileSync(downloadPath);
  fs.unlinkSync(downloadPath);

  const parser = new PDFParse({ data: buffer });
  const { text } = await parser.getText();
  await parser.destroy();

  // The raw markdown-like syntax (including ** and [](...)) must survive
  // verbatim in the extracted PDF text. If it had been run through the
  // markdown parser instead, the extracted text would read "strategic" and
  // "our teams" as plain/linked text with the markdown syntax stripped out.
  expect(text).toContain(raw);
});
