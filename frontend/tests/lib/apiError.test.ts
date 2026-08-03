import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, parseErrorDetail } from "@/lib/apiError";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiError", () => {
  it("carries the status code and message", () => {
    const error = new ApiError(404, "Not found");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not found");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("parseErrorDetail", () => {
  it("returns the detail field from a JSON error body", async () => {
    const res = { json: async () => ({ detail: "something broke" }), statusText: "Bad Request" } as Response;
    await expect(parseErrorDetail(res)).resolves.toBe("something broke");
  });

  it("falls back to statusText when the body has no string detail", async () => {
    const res = { json: async () => ({}), statusText: "Bad Request" } as Response;
    await expect(parseErrorDetail(res)).resolves.toBe("Bad Request");
  });

  it("falls back to statusText when the body is not valid JSON", async () => {
    const res = {
      json: async () => {
        throw new Error("not json");
      },
      statusText: "Internal Server Error",
    } as Response;
    await expect(parseErrorDetail(res)).resolves.toBe("Internal Server Error");
  });
});
