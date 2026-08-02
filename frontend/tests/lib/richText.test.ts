import { describe, expect, it } from "vitest";
import { parseRichText } from "@/lib/richText";

describe("parseRichText", () => {
  it("returns a single text segment for plain text", () => {
    expect(parseRichText("hello world")).toEqual([
      { type: "text", value: "hello world" },
    ]);
  });

  it("parses a bold segment", () => {
    expect(parseRichText("say **hello** now")).toEqual([
      { type: "text", value: "say " },
      { type: "bold", value: "hello" },
      { type: "text", value: " now" },
    ]);
  });

  it("parses a link segment", () => {
    expect(parseRichText("see [here](https://example.com) now")).toEqual([
      { type: "text", value: "see " },
      { type: "link", text: "here", href: "https://example.com" },
      { type: "text", value: " now" },
    ]);
  });

  it("parses multiple bold and link segments in one string", () => {
    expect(
      parseRichText("**A** and [B](https://b.com) and **C**"),
    ).toEqual([
      { type: "bold", value: "A" },
      { type: "text", value: " and " },
      { type: "link", text: "B", href: "https://b.com" },
      { type: "text", value: " and " },
      { type: "bold", value: "C" },
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseRichText("")).toEqual([]);
  });

  it("treats an unterminated ** as plain text", () => {
    expect(parseRichText("this is **not closed")).toEqual([
      { type: "text", value: "this is **not closed" },
    ]);
  });

  it("treats malformed link syntax as plain text", () => {
    expect(parseRichText("this [is not a link")).toEqual([
      { type: "text", value: "this [is not a link" },
    ]);
  });
});
