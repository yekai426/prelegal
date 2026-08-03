"use client";

import { useEffect, useRef, useState } from "react";
import { ChatApiError, fetchGreeting, sendChatMessage, type ChatMessage, type ChatTurnResponse } from "@/lib/chat";
import type { DocumentFields } from "@/lib/documentState";

const inputClasses =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 disabled:opacity-50";

interface Suggestion {
  type: string;
  label: string;
}

export function ChatPanel({
  documentType,
  fields,
  onTurnResult,
}: {
  documentType: string | null;
  fields: DocumentFields;
  onTurnResult: (result: ChatTurnResponse) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastForcedDocumentTypeRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchGreeting(null)
      .then(({ reply }) => {
        if (!cancelled) setMessages([{ role: "assistant", content: reply }]);
      })
      .catch(() => {
        if (!cancelled) {
          setMessages([
            { role: "assistant", content: "Hi! What kind of legal document would you like to create?" },
          ]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendAndHandle(history: ChatMessage[], forcedDocumentType?: string) {
    lastForcedDocumentTypeRef.current = forcedDocumentType;
    setError(null);
    setIsSending(true);
    try {
      const result = await sendChatMessage(history, fields, forcedDocumentType ?? documentType);
      setMessages([...history, { role: "assistant", content: result.reply }]);
      setSuggestion(
        result.suggestedDocumentType
          ? {
              type: result.suggestedDocumentType,
              label: result.suggestedDocumentTypeLabel ?? result.suggestedDocumentType,
            }
          : null,
      );
      onTurnResult(result);
    } catch (err) {
      setError(
        err instanceof ChatApiError
          ? err.message
          : "Something went wrong reaching the assistant. Please try again.",
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    await sendAndHandle(nextMessages);
  }

  async function handleRetry() {
    if (isSending) return;
    await sendAndHandle(messages, lastForcedDocumentTypeRef.current);
  }

  async function handleSuggestionClick() {
    if (!suggestion || isSending) return;
    await sendAndHandle(messages, suggestion.type);
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">Legal Document Assistant</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Chat with the assistant below. The document on the right updates live and can be
          downloaded as a PDF.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        {isSending && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Thinking…</p>
        )}
      </div>

      {suggestion && (
        <div className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
          <button
            type="button"
            onClick={handleSuggestionClick}
            disabled={isSending}
            className="font-medium underline disabled:opacity-50"
          >
            Did you mean {suggestion.label}?
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <p>{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={isSending}
            className="mt-1 font-medium underline disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
          placeholder="Type your message…"
          className={inputClasses}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          Send
        </button>
      </form>
    </div>
  );
}
