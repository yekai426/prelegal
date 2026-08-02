import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatApiError } from "@/lib/chat";
import { defaultFormData } from "@/lib/types";

const { fetchGreeting, sendChatMessage } = vi.hoisted(() => ({
  fetchGreeting: vi.fn(),
  sendChatMessage: vi.fn(),
}));

vi.mock("@/lib/chat", async () => {
  const actual = await vi.importActual<typeof import("@/lib/chat")>("@/lib/chat");
  return { ...actual, fetchGreeting, sendChatMessage };
});

beforeEach(() => {
  fetchGreeting.mockReset();
  sendChatMessage.mockReset();
});

describe("ChatPanel", () => {
  it("renders the greeting from the backend on mount", async () => {
    fetchGreeting.mockResolvedValue("Hi! Let's draft your NDA.");
    render(<ChatPanel formData={defaultFormData()} onFieldsChange={vi.fn()} />);

    expect(await screen.findByText("Hi! Let's draft your NDA.")).toBeInTheDocument();
  });

  it("sends a message, shows both bubbles, and calls onFieldsChange", async () => {
    fetchGreeting.mockResolvedValue("Hi!");
    const nextFields = { ...defaultFormData(), purpose: "Evaluating a deal" };
    sendChatMessage.mockResolvedValue({ reply: "Got it, thanks!", fields: nextFields });
    const onFieldsChange = vi.fn();

    render(<ChatPanel formData={defaultFormData()} onFieldsChange={onFieldsChange} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: "We want to evaluate a deal" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("We want to evaluate a deal")).toBeInTheDocument();
    expect(await screen.findByText("Got it, thanks!")).toBeInTheDocument();
    expect(onFieldsChange).toHaveBeenCalledWith(nextFields);
  });

  it("shows an inline error and does not call onFieldsChange on failure", async () => {
    fetchGreeting.mockResolvedValue("Hi!");
    sendChatMessage.mockRejectedValue(new ChatApiError(502, "The assistant returned garbage"));
    const onFieldsChange = vi.fn();

    render(<ChatPanel formData={defaultFormData()} onFieldsChange={onFieldsChange} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("The assistant returned garbage")).toBeInTheDocument();
    expect(onFieldsChange).not.toHaveBeenCalled();
    // The user's message stays in history so a retry resends the same state.
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("retries after a failure and succeeds", async () => {
    fetchGreeting.mockResolvedValue("Hi!");
    sendChatMessage
      .mockRejectedValueOnce(new ChatApiError(503, "temporarily unavailable"))
      .mockResolvedValueOnce({ reply: "All set now", fields: defaultFormData() });
    const onFieldsChange = vi.fn();

    render(<ChatPanel formData={defaultFormData()} onFieldsChange={onFieldsChange} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await screen.findByText("temporarily unavailable");

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("All set now")).toBeInTheDocument();
    expect(onFieldsChange).toHaveBeenCalledWith(defaultFormData());
  });

  it("disables the input while a message is in flight and re-enables it after", async () => {
    fetchGreeting.mockResolvedValue("Hi!");
    let resolveSend: (value: { reply: string; fields: ReturnType<typeof defaultFormData> }) => void;
    sendChatMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
    );

    render(<ChatPanel formData={defaultFormData()} onFieldsChange={vi.fn()} />);
    await screen.findByText("Hi!");

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    expect(input).toBeDisabled();

    resolveSend!({ reply: "done", fields: defaultFormData() });
    await waitFor(() => expect(input).not.toBeDisabled());

    // Button stays disabled with empty input (nothing to send), not because
    // a request is still in flight.
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    fireEvent.change(input, { target: { value: "another message" } });
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });
});
