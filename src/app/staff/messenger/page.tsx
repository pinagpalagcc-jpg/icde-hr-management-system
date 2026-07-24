"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import StaffSidebar from "@/components/StaffSidebar";

type Message = {
  id: string;
  sender_id: string;
  sender_role: "Admin" | "Staff";
  message_text: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  reply_to_message_id: string | null;
  forwarded_from_message_id: string | null;
  hidden_by_admin: boolean;
  hidden_by_employee: boolean;
  seen_by_admin: boolean;
  seen_by_employee: boolean;
  created_at: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function StaffMessengerPage() {
  const [employeeId, setEmployeeId] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [messageText, setMessageText] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [replyingTo, setReplyingTo] =
    useState<Message | null>(null);

  const [
    openMessageMenuId,
    setOpenMessageMenuId,
  ] = useState("");

  const [
    deletingMessageId,
    setDeletingMessageId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const bottomRef =
    useRef<HTMLDivElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  async function initializeMessenger() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/auth/session",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const session =
        await response.json();

      if (
        !response.ok ||
        session.role !== "Staff" ||
        !session.userId
      ) {
        window.location.href = "/logout";
        return;
      }

      setEmployeeId(
        String(session.userId)
      );

      await loadMessages();
    } catch {
      window.location.href = "/logout";
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    try {
      setError("");

      const response = await fetch(
        "/api/internal-chat",
        {
          cache: "no-store",
          credentials: "include",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load conversation."
        );
      }

      const nextMessages =
        Array.isArray(result.messages)
          ? result.messages
          : [];

      setMessages((currentMessages) =>
        JSON.stringify(currentMessages) ===
        JSON.stringify(nextMessages)
          ? currentMessages
          : nextMessages
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load conversation."
      );
    }
  }

  async function sendMessage() {
    if (
      !messageText.trim() &&
      !selectedFile
    ) {
      return;
    }

    try {
      setSending(true);
      setError("");

      let attachmentName = "";
      let attachmentUrl = "";
      let attachmentType = "";

      if (selectedFile) {
        const formData =
          new FormData();

        formData.append(
          "file",
          selectedFile
        );

        const uploadResponse =
          await fetch(
            "/api/internal-chat/upload",
            {
              method: "POST",
              body: formData,
              credentials: "include",
            }
          );

        const uploadResult =
          await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(
            uploadResult.error ||
              "Unable to upload attachment."
          );
        }

        attachmentName =
          uploadResult.attachment_name ||
          "";

        attachmentUrl =
          uploadResult.attachment_url ||
          "";

        attachmentType =
          uploadResult.attachment_type ||
          "";
      }

      const response = await fetch(
        "/api/internal-chat",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message_text:
              messageText.trim(),
            attachment_name:
              attachmentName,
            attachment_url:
              attachmentUrl,
            attachment_type:
              attachmentType,
            reply_to_message_id:
              replyingTo?.id || "",
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to send message."
        );
      }

      setMessageText("");
      setSelectedFile(null);
      setReplyingTo(null);

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }

      await loadMessages();
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Unable to send message."
      );
    } finally {
      setSending(false);
    }
  }

  async function copyMessage(
    message: Message
  ) {
    const text =
      message.message_text ||
      message.attachment_name ||
      "";

    if (!text) {
      setError(
        "There is nothing to copy."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        text
      );

      setOpenMessageMenuId("");
      setError("");
    } catch {
      setError(
        "Unable to copy the message."
      );
    }
  }

  async function deleteForMe(
    message: Message
  ) {
    const confirmed = window.confirm(
      "Delete this message only from your view?"
    );

    if (!confirmed) return;

    try {
      setDeletingMessageId(
        message.id
      );

      setOpenMessageMenuId("");
      setError("");

      const response = await fetch(
        "/api/internal-chat",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message_id: message.id,
            action: "delete_for_me",
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete message from your view."
        );
      }

      setMessages((current) =>
        current.filter(
          (item) =>
            item.id !== message.id
        )
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete message."
      );
    } finally {
      setDeletingMessageId("");
    }
  }

  async function deleteForEveryone(
    message: Message
  ) {
    if (
      message.sender_role !== "Staff"
    ) {
      setError(
        "You can permanently delete only messages you sent."
      );
      return;
    }

    const confirmed = window.confirm(
      "Delete this message for everyone? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingMessageId(
        message.id
      );

      setOpenMessageMenuId("");
      setError("");

      const response = await fetch(
        `/api/internal-chat?message_id=${encodeURIComponent(
          message.id
        )}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to delete message."
        );
      }

      setMessages((current) =>
        current.filter(
          (item) =>
            item.id !== message.id
        )
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete message."
      );
    } finally {
      setDeletingMessageId("");
    }
  }

  useEffect(() => {
    initializeMessenger();
  }, []);

  useEffect(() => {
    if (!employeeId) {
      return;
    }

    const refreshConversation = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadMessages();
      }
    };

    const intervalId =
      window.setInterval(
        refreshConversation,
        3000
      );

    document.addEventListener(
      "visibilitychange",
      refreshConversation
    );

    return () => {
      window.clearInterval(intervalId);

      document.removeEventListener(
        "visibilitychange",
        refreshConversation
      );
    };
  }, [employeeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex min-h-screen bg-[#f7f4ec]">
      <StaffSidebar
        active="Messenger"
        employeeId={employeeId}
      />

      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="mx-auto flex h-[calc(100vh-48px)] max-w-[1100px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#efeae2] shadow-sm">
          <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3f4447] text-lg font-bold text-white">
              AD
            </div>

            <div>
              <h1 className="font-bold text-[#3f4447]">
                Admin
              </h1>

              <p className="text-sm text-gray-500">
                ICDE HR Administration
              </p>
            </div>
          </header>

          <section className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
            {loading ? (
              <p className="text-center text-gray-500">
                Loading conversation...
              </p>
            ) : messages.length ? (
              <div className="space-y-3">
                {messages.map(
                  (message, index) => {
                    const previous =
                      messages[index - 1];

                    const showDate =
                      !previous ||
                      formatDay(
                        previous.created_at
                      ) !==
                        formatDay(
                          message.created_at
                        );

                    const mine =
                      message.sender_role ===
                      "Staff";

                    const originalMessage =
                      message.reply_to_message_id
                        ? messages.find(
                            (item) =>
                              item.id ===
                              message.reply_to_message_id
                          )
                        : null;

                    return (
                      <div key={message.id}>
                        {showDate ? (
                          <div className="my-5 text-center">
                            <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-gray-500 shadow-sm">
                              {formatDay(
                                message.created_at
                              )}
                            </span>
                          </div>
                        ) : null}

                        <div
                          className={`flex ${
                            mine
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`group relative max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                              mine
                                ? "rounded-br-md bg-[#dcf8c6]"
                                : "rounded-bl-md bg-white"
                            }`}
                          >
                            {message.forwarded_from_message_id ? (
                              <div className="mb-2 text-[11px] italic text-gray-500">
                                ↪ Forwarded
                              </div>
                            ) : null}

                            {message.reply_to_message_id ? (
                              <div className="mb-2 rounded-lg border-l-4 border-[#d2b241] bg-black/5 px-3 py-2">
                                <p className="text-[11px] font-bold text-[#8f7415]">
                                  {originalMessage?.sender_role ===
                                  "Staff"
                                    ? "You"
                                    : "Admin"}
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                  {originalMessage
                                    ? originalMessage.message_text ||
                                      originalMessage.attachment_name ||
                                      "Attachment"
                                    : "Original message unavailable"}
                                </p>
                              </div>
                            ) : null}

                            {message.message_text ? (
                              <p className="whitespace-pre-wrap text-sm text-gray-800">
                                {message.message_text}
                              </p>
                            ) : null}

                            {message.attachment_url ? (
                              message.attachment_type?.startsWith(
                                "image/"
                              ) ? (
                                <div className="mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white/70">
                                  <a
                                    href={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                      message.id
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                        message.id
                                      )}`}
                                      alt={
                                        message.attachment_name ||
                                        "Image attachment"
                                      }
                                      className="max-h-72 w-full object-contain"
                                    />
                                  </a>

                                  <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-2">
                                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">
                                      🖼{" "}
                                      {message.attachment_name ||
                                        "Image attachment"}
                                    </p>

                                    <a
                                      href={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                        message.id
                                      )}&download=1`}
                                      className="text-xs font-bold text-blue-700"
                                    >
                                      Download
                                    </a>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-2 rounded-xl border border-gray-200 bg-white/70 p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xl">
                                      📄
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-gray-800">
                                        {message.attachment_name ||
                                          "Document attachment"}
                                      </p>

                                      <p className="mt-1 text-xs text-gray-500">
                                        {message.attachment_type ||
                                          "File attachment"}
                                      </p>

                                      <div className="mt-2 flex gap-2">
                                        <a
                                          href={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                            message.id
                                          )}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold text-blue-700"
                                        >
                                          Open
                                        </a>

                                        <a
                                          href={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                            message.id
                                          )}&download=1`}
                                          className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-bold text-white"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            ) : null}

                            <div className="absolute -right-2 -top-2 z-20">
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMessageMenuId(
                                    openMessageMenuId ===
                                      message.id
                                      ? ""
                                      : message.id
                                  )
                                }
                                disabled={
                                  deletingMessageId ===
                                  message.id
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-lg font-bold text-gray-600 shadow-sm"
                              >
                                ⋮
                              </button>

                              {openMessageMenuId ===
                              message.id ? (
                                <div className="absolute right-0 top-8 z-30 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo(
                                        message
                                      );
                                      setOpenMessageMenuId(
                                        ""
                                      );
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    ↩ Reply
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyMessage(
                                        message
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    📋 Copy
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteForMe(
                                        message
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    🗑 Delete for Me
                                  </button>

                                  {mine ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        deleteForEveryone(
                                          message
                                        )
                                      }
                                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                      🗑 Delete for Everyone
                                    </button>
                                  ) : null}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenMessageMenuId(
                                        ""
                                      )
                                    }
                                    className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-500 hover:bg-gray-50"
                                  >
                                    ✕ Cancel
                                  </button>
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-gray-500">
                              <span>
                                {formatTime(
                                  message.created_at
                                )}
                              </span>

                              {mine ? (
                                <span
                                  className={
                                    message.seen_by_admin
                                      ? "text-blue-600"
                                      : ""
                                  }
                                >
                                  ✓✓
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}

                <div ref={bottomRef} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-2xl bg-white/90 p-6 text-center shadow-sm">
                  <h2 className="text-xl font-bold text-[#3f4447]">
                    Start a conversation
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Send a private message to Admin.
                  </p>
                </div>
              </div>
            )}
          </section>

          {error ? (
            <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <footer className="border-t border-gray-200 bg-white p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(event) => {
                const file =
                  event.target.files?.[0] ||
                  null;

                if (
                  file &&
                  file.size >
                    20 * 1024 * 1024
                ) {
                  setError(
                    "The attachment must not exceed 20 MB."
                  );
                  event.target.value = "";
                  setSelectedFile(null);
                  return;
                }

                setError("");
                setSelectedFile(file);
              }}
            />

            {replyingTo ? (
              <div className="mb-3 flex items-center justify-between rounded-xl border-l-4 border-[#d2b241] bg-[#fff9df] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#8f7415]">
                    Replying to{" "}
                    {replyingTo.sender_role ===
                    "Staff"
                      ? "your message"
                      : "Admin"}
                  </p>

                  <p className="mt-1 truncate text-sm text-gray-600">
                    {replyingTo.message_text ||
                      replyingTo.attachment_name ||
                      "Attachment"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setReplyingTo(null)
                  }
                  className="ml-3 text-xl font-bold text-gray-500"
                >
                  ×
                </button>
              </div>
            ) : null}

            {selectedFile ? (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-[#eadb9f] bg-[#fff9df] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-700">
                    📎 {selectedFile.name}
                  </p>

                  <p className="text-xs text-gray-500">
                    {(
                      selectedFile.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);

                    if (
                      fileInputRef.current
                    ) {
                      fileInputRef.current.value =
                        "";
                    }
                  }}
                  className="ml-3 font-bold text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : null}

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={sending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-50 text-xl text-gray-600 disabled:opacity-50"
              >
                📎
              </button>

              <textarea
                value={messageText}
                onChange={(event) =>
                  setMessageText(
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
                rows={1}
                placeholder="Type a message"
                className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-[#d2b241]"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={
                  sending ||
                  (!messageText.trim() &&
                    !selectedFile)
                }
                className="h-12 rounded-full bg-[#d2b241] px-6 font-bold text-white disabled:opacity-50"
              >
                {sending
                  ? "Sending..."
                  : "Send"}
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
