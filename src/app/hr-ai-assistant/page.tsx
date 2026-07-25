"use client";

import { useState } from "react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function HRAIAssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);

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

  function sendMessage(messageText?: string) {
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

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: "I received your question. HR database connection will be added in the next step.",
      };

      setMessages((current) => [...current, assistantMessage]);
      setThinking(false);
    }, 900);
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

        <div className="flex-1 overflow-y-auto p-8 pb-0">

          <div className="mx-auto max-w-4xl">
                        <div className="flex h-[calc(100vh-150px)] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div className="flex items-center gap-3 border-b p-5">
                <div>
                  <div className="font-semibold text-[#3f4447]">
                    HR AI Assistant
                  </div>

                  <div className="text-xs text-green-600">
                    Ready
                  </div>
                </div>
              </div>

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
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-5 ${
                            message.role === "user"
                              ? "bg-[#d2b241] text-[#3f4447]"
                              : "border border-gray-200 bg-[#f7f4ec] text-gray-700"
                          }`}
                        >
                          {message.text}
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