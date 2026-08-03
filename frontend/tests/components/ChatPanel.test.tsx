import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatPanel } from "@/components/ChatPanel";
import { ChatApiError } from "@/lib/chat";

const { fetchGreeting, sendChatMessage } = vi.hoisted(() => ({
  fetchGreeting: vi.fn(),
  sendChatMessage: vi.fn(),
}));

vi.mock("@/lib/chat", async () => {
  const actual = await vi.importActual<typeof import("@/lib/chat")>("@/lib/chat");
  return { ...actual, fetchGreeting, sendChatMessage };
});

function baseTurnResponse(overrides: Partial<ReturnType<typeof makeTurn>> = {}) {
  return makeTurn(overrides);
}

function makeTurn(overrides: Record<string, unknown> = {}) {
  return {
    reply: "ok",
    fields: {},
    documentType: "mutual_nda",
    documentTypeLabel: "Mutual NDA",
    suggestedDocumentType: null,
    suggestedDocumentTypeLabel: null,
    ...overrides,
  };
}

beforeEach(() => {
  fetchGreeting.mockReset();
  sendChatMessage.mockReset();
});

describe("ChatPanel", () => {
  it("renders the greeting from the backend on mount", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi! Let's draft your NDA.", documentType: null });
    render(<ChatPanel documentType={null} fields={{}} onTurnResult={vi.fn()} />);

    expect(await screen.findByText("Hi! Let's draft your NDA.")).toBeInTheDocument();
  });

  it("fetches the greeting with no document_type on mount, regardless of the documentType prop", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    render(<ChatPanel documentType="mutual_nda" fields={{}} onTurnResult={vi.fn()} />);
    await screen.findByText("Hi!");
    expect(fetchGreeting).toHaveBeenCalledWith(null);
  });

  it("sends a message, shows both bubbles, and calls onTurnResult with the raw result", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    const turn = makeTurn({ reply: "Got it, thanks!", fields: { purpose: "Evaluating a deal" } });
    sendChatMessage.mockResolvedValue(turn);
    const onTurnResult = vi.fn();

    render(<ChatPanel documentType={null} fields={{}} onTurnResult={onTurnResult} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: "We want to evaluate a deal" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("We want to evaluate a deal")).toBeInTheDocument();
    expect(await screen.findByText("Got it, thanks!")).toBeInTheDocument();
    expect(onTurnResult).toHaveBeenCalledWith(turn);
  });

  it("shows an inline error and does not call onTurnResult on failure", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    sendChatMessage.mockRejectedValue(new ChatApiError(502, "The assistant returned garbage"));
    const onTurnResult = vi.fn();

    render(<ChatPanel documentType="mutual_nda" fields={{}} onTurnResult={onTurnResult} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("The assistant returned garbage")).toBeInTheDocument();
    expect(onTurnResult).not.toHaveBeenCalled();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("retries after a failure and succeeds", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    const turn = makeTurn({ reply: "All set now" });
    sendChatMessage
      .mockRejectedValueOnce(new ChatApiError(503, "temporarily unavailable"))
      .mockResolvedValueOnce(turn);
    const onTurnResult = vi.fn();

    render(<ChatPanel documentType="mutual_nda" fields={{}} onTurnResult={onTurnResult} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await screen.findByText("temporarily unavailable");

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("All set now")).toBeInTheDocument();
    expect(onTurnResult).toHaveBeenCalledWith(turn);
  });

  it("shows a clickable suggestion when the request is unsupported, and resends with the forced type on click", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    const unsupportedTurn = baseTurnResponse({
      reply: "I can't draft a will, but I can help with an NDA.",
      documentType: null,
      documentTypeLabel: null,
      suggestedDocumentType: "mutual_nda",
      suggestedDocumentTypeLabel: "Mutual NDA",
    });
    const followUpTurn = makeTurn({ reply: "Great, let's draft an NDA." });
    sendChatMessage.mockResolvedValueOnce(unsupportedTurn).mockResolvedValueOnce(followUpTurn);
    const onTurnResult = vi.fn();

    render(<ChatPanel documentType={null} fields={{}} onTurnResult={onTurnResult} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), { target: { value: "I need a will" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    const suggestionButton = await screen.findByRole("button", { name: /did you mean mutual nda/i });
    fireEvent.click(suggestionButton);

    expect(await screen.findByText("Great, let's draft an NDA.")).toBeInTheDocument();
    // The forced document type is passed as the 3rd sendChatMessage argument.
    expect(sendChatMessage.mock.calls[1][2]).toBe("mutual_nda");
    expect(onTurnResult).toHaveBeenLastCalledWith(followUpTurn);
  });

  it("shows a clickable suggestion mid-conversation, when documentType is already known", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    const midConversationSuggestion = makeTurn({
      reply: "I can't draft a will, but here's a suggestion.",
      documentType: "mutual_nda",
      suggestedDocumentType: "csa",
      suggestedDocumentTypeLabel: "Cloud Service Agreement",
    });
    sendChatMessage.mockResolvedValueOnce(midConversationSuggestion);
    const onTurnResult = vi.fn();

    render(<ChatPanel documentType="mutual_nda" fields={{}} onTurnResult={onTurnResult} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: "actually, draft me a will" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(
      await screen.findByRole("button", { name: /did you mean cloud service agreement/i }),
    ).toBeInTheDocument();
  });

  it("retries a failed suggestion click with the same forced document type, not the original one", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    const unsupportedTurn = baseTurnResponse({
      reply: "I can't draft a will, but I can help with an NDA.",
      documentType: null,
      documentTypeLabel: null,
      suggestedDocumentType: "mutual_nda",
      suggestedDocumentTypeLabel: "Mutual NDA",
    });
    const followUpTurn = makeTurn({ reply: "Great, let's draft an NDA." });
    sendChatMessage
      .mockResolvedValueOnce(unsupportedTurn)
      .mockRejectedValueOnce(new ChatApiError(503, "temporarily unavailable"))
      .mockResolvedValueOnce(followUpTurn);

    render(<ChatPanel documentType={null} fields={{}} onTurnResult={vi.fn()} />);
    await screen.findByText("Hi!");

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), { target: { value: "I need a will" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    const suggestionButton = await screen.findByRole("button", { name: /did you mean mutual nda/i });
    fireEvent.click(suggestionButton);
    await screen.findByText("temporarily unavailable");

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByText("Great, let's draft an NDA.")).toBeInTheDocument();
    // The retry must replay the forced type from the suggestion click, not fall back to null.
    expect(sendChatMessage.mock.calls[2][2]).toBe("mutual_nda");
  });

  it("disables the input while a message is in flight and re-enables it after", async () => {
    fetchGreeting.mockResolvedValue({ reply: "Hi!", documentType: null });
    let resolveSend: (value: ReturnType<typeof makeTurn>) => void;
    sendChatMessage.mockReturnValue(
      new Promise((resolve) => {
        resolveSend = resolve;
      }),
    );

    render(<ChatPanel documentType="mutual_nda" fields={{}} onTurnResult={vi.fn()} />);
    await screen.findByText("Hi!");

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    expect(input).toBeDisabled();

    resolveSend!(makeTurn());
    await waitFor(() => expect(input).not.toBeDisabled());

    // Button stays disabled with empty input (nothing to send), not because
    // a request is still in flight.
    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
    fireEvent.change(input, { target: { value: "another message" } });
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });
});
