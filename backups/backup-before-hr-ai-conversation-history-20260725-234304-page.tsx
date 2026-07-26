"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function HRAIAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [copiedMessageId, setCopiedMessageId] =
    useState<number | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const savedHistory = window.localStorage.getItem(
        "icde_hr_ai_chat_history"
      );

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);

        if (Array.isArray(parsedHistory)) {
          setMessages(parsedHistory);
        }
      }
    } catch (error) {
      console.error("Unable to restore HR AI history:", error);
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
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error("Unable to save HR AI history:", error);
    }
  }, [messages, historyLoaded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, thinking]);

  const menu = [
    ["Dashboard", "/dashboard"],
    ["Employees", "/employees"],
    ["Messenger", "/messenger"],
    ["Leave Requests", "/leave-requests"],
    ["Document Expiry", "/document-expiry"],
    ["Reports", "/reports"],
    ["HR AI Assistant", "/hr-ai-assistant"],
  ];

  const examples = [
    "Employees on leave this month",
    "Documents expiring in 30 days",
    "Total active employees",
  ];

  async function copyMessage(
    messageId: number,
    messageText: string
  ) {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopiedMessageId(messageId);

      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === messageId ? null : current
        );
      }, 2000);
    } catch (error) {
      console.error(
        "Unable to copy Gemini reply:",
        error
      );
    }
  }

  async function sendMessage(messageText?: string) {
    const finalText = (messageText ?? input).trim();

    if (!finalText || thinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: finalText,
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setThinking(true);

    try {
      const response = await fetch("/api/hr-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: finalText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to answer the HR question."
        );
      }

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text:
          result.answer ||
          "No answer was returned.",
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text:
          error instanceof Error
            ? error.message
            : "Unable to answer the HR question.",
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#f7f4ec]">

      <aside className="hidden w-72 shrink-0 bg-[#3f4447] p-6 text-white md:flex md:flex-col md:justify-between">

        <div>

          <div className="mb-10">
            <div className="text-4xl font-black tracking-widest">
              <span className="text-white">IC</span>
              <span className="text-[#d2b241]">D</span>
              <span className="text-white">E</span>
            </div>

            <div className="mt-3 text-sm text-white/90">
              HR Management Portal
            </div>

            <div className="mt-3 h-[3px] w-24 rounded-full bg-[#d2b241]" />
          </div>

          <nav className="space-y-3">
            {menu.map(([name, href]) => (
              <a
                key={name}
                href={href}
                className={`block rounded-xl px-4 py-3 ${
                  name === "HR AI Assistant"
                    ? "bg-[#d2b241] font-semibold text-[#3f4447]"
                    : "hover:bg-white/10"
                }`}
              >
                {name}
              </a>
            ))}
          </nav>

        </div>

        <a
          href="/logout"
          className="block w-full rounded-2xl border border-white/25 py-4 text-center font-semibold hover:bg-white/10"
        >
          Sign Out
        </a>

      </aside>

      <main className="flex flex-1 flex-col">

        <div className="border-b bg-white px-6 py-4">
          <h1 className="text-xl font-semibold text-[#3f4447]">
            HR AI Assistant
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Ask questions about your HR Management System.
          </p>
        </div>

        <div className="flex-1 overflow-hidden p-4 pb-0">

          <div className="h-full w-full">
            <div className="flex h-[calc(100vh-105px)] w-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {messages.length === 0 ? (
                    <>
                      <div className="rounded-xl bg-[#f7f4ec] px-4 py-3">
                        <div className="text-sm font-semibold text-[#3f4447]">
                          Welcome
                        </div>

                        <p className="mt-1 text-xs leading-5 text-gray-600">
                          Ask questions about employees, leave, documents,
                          reports and other HR information.
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2">
                        {examples.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => sendMessage(item)}
                            disabled={thinking}
                            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-xs text-[#3f4447] shadow-sm hover:border-[#d2b241] hover:bg-[#fff9df] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl text-sm leading-5 ${
                            message.role === "user"
                              ? "w-fit max-w-[40%] bg-[#d2b241] px-4 py-2.5 text-[#3f4447]"
                              : "w-full max-w-[75%] overflow-hidden border border-gray-200 bg-[#f7f4ec] text-gray-700"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <div className="min-w-0">
                              <div className="flex h-11 items-center justify-between border-b border-gray-200 bg-white/80 px-4">
                                <span className="text-xs font-semibold text-[#3f4447]">
                                  Gemini Reply
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyMessage(
                                      message.id,
                                      message.text
                                    )
                                  }
                                  aria-label="Copy Gemini reply"
                                  title={
                                    copiedMessageId === message.id
                                      ? "Copied"
                                      : "Copy"
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-[#3f4447]"
                                >
                                {copiedMessageId === message.id ? (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-4 w-4"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="m5 12 4 4L19 6"
                                    />
                                  </svg>
                                ) : (
                                  <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    className="h-4 w-4"
                                  >
                                    <rect
                                      x="8"
                                      y="8"
                                      width="11"
                                      height="11"
                                      rx="2"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
                                    />
                                  </svg>
                                )}
                                </button>
                              </div>

                              <div className="max-h-[520px] overflow-y-auto p-4">
                                <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({ children }) => (
                                  <h1 className="mb-3 mt-1 text-lg font-bold text-[#3f4447]">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="mb-2 mt-4 text-base font-bold text-[#3f4447]">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="mb-2 mt-3 text-sm font-semibold text-[#3f4447]">
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
                                li: ({ children }) => (
                                  <li className="leading-6">
                                    {children}
                                  </li>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold text-[#3f4447]">
                                    {children}
                                  </strong>
                                ),
                                table: ({ children }) => (
                                  <div className="my-4 overflow-x-auto rounded-xl border border-gray-300">
                                    <table className="w-full min-w-[520px] border-collapse text-left text-xs">
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
                                tr: ({ children }) => (
                                  <tr>{children}</tr>
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
                                blockquote: ({ children }) => (
                                  <blockquote className="my-3 border-l-4 border-[#d2b241] bg-white px-4 py-2 italic">
                                    {children}
                                  </blockquote>
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
                          ) : (
                            <span className="whitespace-pre-wrap">
                              {message.text}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {thinking ? (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-gray-200 bg-[#f7f4ec] px-4 py-2.5 text-xs text-gray-500">
                        Thinking...
                      </div>
                    </div>
                  ) : null}

                  <div ref={chatEndRef} />
                </div>

                <div className="mt-auto border-t bg-white p-4">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={thinking}
                      className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#d2b241] disabled:bg-gray-100"
                      placeholder="Ask anything about your HR system..."
                    />

                    <button
                      type="button"
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || thinking}
                      className="rounded-xl bg-[#d2b241] px-5 text-sm font-semibold text-[#3f4447] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}