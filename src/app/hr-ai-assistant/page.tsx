"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

const menu = [
  ["Dashboard", "/dashboard"],
  ["Employees", "/employees"],
  ["Messenger", "/messenger"],
  ["Leave Requests", "/leave-requests"],
  ["Document Expiry", "/document-expiry"],
  ["Reports", "/reports"],
  ["HR AI Assistant", "/hr-ai-assistant"],
] as const;

const MessageBubble = memo(
  function MessageBubble({
    message,
  }: {
    message: ChatMessage;
  }) {
    const [copied, setCopied] =
      useState(false);

    async function copyReply() {
      try {
        await navigator.clipboard.writeText(
          message.text
        );

        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 1800);
      } catch (error) {
        console.error(
          "Unable to copy reply:",
          error
        );
      }
    }

    if (message.role === "user") {
      return (
        <div className="flex justify-end">
          <div className="w-fit max-w-[75%] rounded-2xl bg-[#d2b241] px-4 py-3 text-sm leading-6 text-[#3f4447] shadow-sm">
            <span className="whitespace-pre-wrap">
              {message.text}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-start">
        <div className="w-full max-w-[82%] overflow-hidden rounded-2xl border border-gray-200 bg-[#f7f4ec] text-sm text-gray-700 shadow-sm">
          <div className="flex h-11 items-center justify-between border-b border-gray-200 bg-white/90 px-4">
            <span className="text-xs font-semibold text-[#3f4447]">
              Gemini Reply
            </span>

            <button
              type="button"
              onClick={copyReply}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-[#3f4447]"
              title="Copy reply"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="max-h-[520px] overflow-auto p-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-3 text-lg font-bold text-[#3f4447]">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-3 text-base font-bold text-[#3f4447]">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-2 text-sm font-bold text-[#3f4447]">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 whitespace-pre-wrap leading-6 last:mb-0">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 list-disc space-y-1 pl-5">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 list-decimal space-y-1 pl-5">
                    {children}
                  </ol>
                ),
                table: ({ children }) => (
                  <div className="my-3 overflow-x-auto rounded-xl border border-gray-300 bg-white">
                    <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-[#3f4447] text-white">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {children}
                  </tbody>
                ),
                th: ({ children }) => (
                  <th className="border-r border-white/20 px-3 py-2.5 font-semibold last:border-r-0">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-r border-gray-200 px-3 py-2.5 align-top last:border-r-0">
                    {children}
                  </td>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">
                    {children}
                  </code>
                ),
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }
);

export default function HRAIAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] =
    useState<ChatMessage[]>([]);
  const [thinking, setThinking] =
    useState(false);
  const [error, setError] =
    useState("");

  const [historyLoaded, setHistoryLoaded] =
    useState(false);

  const chatEndRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const savedHistory =
        window.localStorage.getItem(
          "icde_hr_ai_chat_history"
        );

      if (savedHistory) {
        const parsedHistory =
          JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory)) {
          const validMessages =
            parsedHistory
              .filter(
                (message) =>
                  message &&
                  typeof message.id ===
                    "number" &&
                  (
                    message.role ===
                      "user" ||
                    message.role ===
                      "assistant"
                  ) &&
                  typeof message.text ===
                    "string"
              )
              .slice(-100);

          setMessages(validMessages);
        }
      }
    } catch (error) {
      console.error(
        "Unable to load HR AI chat history:",
        error
      );
    } finally {
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!historyLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        "icde_hr_ai_chat_history",
        JSON.stringify(
          messages.slice(-100)
        )
      );
    } catch (error) {
      console.error(
        "Unable to save HR AI chat history:",
        error
      );
    }
  }, [messages, historyLoaded]);

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [messages, thinking]);

  async function sendMessage(
    suppliedText?: string
  ) {
    const question = (
      suppliedText ?? input
    ).trim();

    if (!question || thinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: question,
    };

    const recentHistory = messages
      .slice(-10)
      .map((message) => ({
        role: message.role,
        text: message.text,
      }));

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setInput("");
    setError("");
    setThinking(true);

    try {
      const response = await fetch(
        "/api/hr-ai",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: question,
            history: recentHistory,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to answer the HR question."
        );
      }

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            result.answer ||
            "No answer was returned.",
        },
      ]);
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Unable to answer the HR question.";

      setError(message);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: message,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f4ec]">
      <aside className="hidden h-screen w-72 shrink-0 flex-col justify-between bg-[#3f4447] p-6 text-white md:flex">
        <div>
          <div className="text-3xl font-bold tracking-[0.18em]">
            <span>IC</span>
            <span className="text-[#d2b241]">
              D
            </span>
            <span>E</span>
          </div>

          <p className="mt-3 text-sm text-white/90">
            HR Management Portal
          </p>

          <div className="mt-4 h-[3px] w-24 rounded-full bg-[#d2b241]" />

          <nav className="mt-10 space-y-2">
            {menu.map(([label, href]) => {
              const active =
                href ===
                "/hr-ai-assistant";

              return (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#d2b241] font-semibold text-[#3f4447]"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          href="/logout"
          className="rounded-2xl border border-white/30 px-4 py-4 text-center text-sm font-semibold transition hover:bg-white/10"
        >
          Sign Out
        </Link>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-gray-300 bg-white px-6 py-4 md:px-8">
          <h1 className="text-xl font-bold text-[#3f4447]">
            HR AI Assistant
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Ask questions about your HR Management System.
          </p>
        </header>

        <section className="min-h-0 flex-1 p-4 md:p-6">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 md:p-6">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-lg rounded-2xl bg-[#f7f4ec] p-7 text-center shadow-sm">
                    <h2 className="text-lg font-bold text-[#3f4447]">
                      HR AI Assistant
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Employees are connected. Ask about employee counts,
                      names, departments, positions, contact details or
                      salary information.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                  />
                ))
              )}

              {thinking ? (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-gray-200 bg-[#f7f4ec] px-4 py-3 text-sm text-gray-500 shadow-sm">
                    Thinking...
                  </div>
                </div>
              ) : null}

              <div ref={chatEndRef} />
            </div>

            {error ? (
              <div className="mx-5 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="shrink-0 border-t border-gray-200 bg-white p-4">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(event) =>
                    setInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={thinking}
                  placeholder="Ask anything about your HR system..."
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#d2b241] disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    sendMessage()
                  }
                  disabled={
                    !input.trim() ||
                    thinking
                  }
                  className="rounded-xl bg-[#d2b241] px-6 text-sm font-semibold text-[#3f4447] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
