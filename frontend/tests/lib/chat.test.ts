import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatApiError, fetchGreeting, mergeFields, sendChatMessage } from "@/lib/chat";
import { defaultFormData } from "@/lib/types";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchGreeting", () => {
  it("returns the reply on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ reply: "Hi there!" }),
      }),
    );
    await expect(fetchGreeting()).resolves.toBe("Hi there!");
  });

  it("throws ChatApiError with the parsed detail on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        json: async () => ({ detail: "temporarily unavailable" }),
      }),
    );
    await expect(fetchGreeting()).rejects.toMatchObject({
      status: 503,
      message: "temporarily unavailable",
    });
  });
});

describe("sendChatMessage", () => {
  it("posts the expected request body shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ reply: "ok", fields: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const fields = defaultFormData();
    await sendChatMessage([{ role: "user", content: "hi" }], fields);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat/message",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      document_type: "mutual_nda",
      messages: [{ role: "user", content: "hi" }],
      fields,
    });
  });

  it("throws ChatApiError on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad Gateway",
        json: async () => ({ detail: "assistant returned garbage" }),
      }),
    );
    await expect(sendChatMessage([], defaultFormData())).rejects.toBeInstanceOf(ChatApiError);
  });
});

describe("mergeFields", () => {
  it("uses server values when present and well-shaped", () => {
    const previous = defaultFormData();
    const merged = mergeFields(previous, { purpose: "New purpose" });
    expect(merged.purpose).toBe("New purpose");
  });

  it("falls back to the previous value for a missing key", () => {
    const previous = { ...defaultFormData(), governingLaw: "Delaware" };
    const merged = mergeFields(previous, { purpose: "x" });
    expect(merged.governingLaw).toBe("Delaware");
  });

  it("clamps an invalid duration from the server", () => {
    const previous = defaultFormData();
    const merged = mergeFields(previous, {
      mndaTermDuration: { duration: -3, unit: "month" },
    });
    expect(merged.mndaTermDuration).toEqual({ duration: 1, unit: "month" });
  });

  it("falls back to the previous enum value on an invalid choice", () => {
    const previous = defaultFormData();
    const merged = mergeFields(previous, { mndaTermChoice: "nope" });
    expect(merged.mndaTermChoice).toBe(previous.mndaTermChoice);
  });

  it("falls back to previous party fields when the server sends garbage", () => {
    const previous = { ...defaultFormData(), partyOne: { ...defaultFormData().partyOne, printName: "Alice" } };
    const merged = mergeFields(previous, { partyOne: "not-an-object" });
    expect(merged.partyOne.printName).toBe("Alice");
  });

  it("handles null/undefined raw input gracefully", () => {
    const previous = defaultFormData();
    expect(mergeFields(previous, null)).toEqual(previous);
    expect(mergeFields(previous, undefined)).toEqual(previous);
  });
});
