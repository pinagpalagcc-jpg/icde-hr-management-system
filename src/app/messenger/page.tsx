"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Employee = {
  id: string;
  employee_id?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  profile_photo?: string | null;
  status?: string;
  position?: string | null;
  designation?: string | null;
  department?: string | null;
};

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

function employeeName(employee: Employee) {
  return [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() || "Employee";
}

function employeeDesignation(
  employee: Employee
) {
  return (
    employee.position?.trim() ||
    employee.designation?.trim() ||
    employee.department?.trim() ||
    "Employee"
  );
}

function initials(employee: Employee) {
  const name = employeeName(employee);

  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();
}

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

export default function MessengerPage() {
  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [
    unreadCounts,
    setUnreadCounts,
  ] = useState<Record<string, number>>(
    {}
  );

  const [search, setSearch] =
    useState("");

  const [messageText, setMessageText] =
    useState("");

  const [loadingEmployees, setLoadingEmployees] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [replyingTo, setReplyingTo] =
    useState<Message | null>(null);

  const [
    forwardingMessage,
    setForwardingMessage,
  ] = useState<Message | null>(null);

  const [
    selectedForwardEmployeeIds,
    setSelectedForwardEmployeeIds,
  ] = useState<string[]>([]);

  const [
    forwardSearch,
    setForwardSearch,
  ] = useState("");

  const [
    forwarding,
    setForwarding,
  ] = useState(false);

  const [
    forwardSuccess,
    setForwardSuccess,
  ] = useState("");

  const [
    openMessageMenuId,
    setOpenMessageMenuId,
  ] = useState("");

  const [
    deletingMessageId,
    setDeletingMessageId,
  ] = useState("");

  const [error, setError] =
    useState("");

  const bottomRef =
    useRef<HTMLDivElement>(null);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const selectedEmployee = useMemo(
    () =>
      employees.find(
        (employee) =>
          employee.id === selectedEmployeeId
      ) || null,
    [employees, selectedEmployeeId]
  );

  const forwardEmployees = useMemo(() => {
    const term =
      forwardSearch.trim().toLowerCase();

    if (!term) {
      return employees;
    }

    return employees.filter(
      (employee) => {
        const name =
          employeeName(
            employee
          ).toLowerCase();

        const employeeId = String(
          employee.employee_id || ""
        ).toLowerCase();

        return (
          name.includes(term) ||
          employeeId.includes(term)
        );
      }
    );
  }, [employees, forwardSearch]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return employees;

    return employees.filter((employee) => {
      const name =
        employeeName(employee).toLowerCase();

      const employeeId = String(
        employee.employee_id || ""
      ).toLowerCase();

      return (
        name.includes(term) ||
        employeeId.includes(term)
      );
    });
  }, [employees, search]);

  async function loadUnreadCounts() {
    try {
      const response = await fetch(
        "/api/internal-chat?summary=unread",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load unread messages."
        );
      }

      const nextCounts =
        result.unread_counts &&
        typeof result.unread_counts ===
          "object"
          ? result.unread_counts
          : {};

      setUnreadCounts(
        (currentCounts) =>
          JSON.stringify(
            currentCounts
          ) ===
          JSON.stringify(nextCounts)
            ? currentCounts
            : nextCounts
      );
    } catch (unreadError) {
      console.error(
        "Unable to refresh unread messages:",
        unreadError
      );
    }
  }

  async function loadEmployees() {
    try {
      setLoadingEmployees(true);
      setError("");

      const response = await fetch(
        "/api/employees",
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to load employees."
        );
      }

      const activeEmployees = (
        Array.isArray(result) ? result : []
      ).filter(
        (employee: Employee) =>
          employee.status !== "Inactive"
      );

      setEmployees(activeEmployees);

      if (
        !selectedEmployeeId &&
        activeEmployees.length
      ) {
        setSelectedEmployeeId(
          activeEmployees[0].id
        );
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load employees."
      );
    } finally {
      setLoadingEmployees(false);
    }
  }

  async function loadMessages(
    employeeId: string,
    options?: {
      silent?: boolean;
    }
  ) {
    if (!employeeId) return;

    try {
      if (!options?.silent) {
        setLoadingMessages(true);
      }

      setError("");

      const response = await fetch(
        `/api/internal-chat?employee_id=${encodeURIComponent(
          employeeId
        )}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

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

      await loadUnreadCounts();
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load conversation."
      );
    } finally {
      if (!options?.silent) {
        setLoadingMessages(false);
      }
    }
  }

  async function sendMessage() {
    if (
      !selectedEmployeeId ||
      (!messageText.trim() && !selectedFile)
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
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadResponse = await fetch(
          "/api/internal-chat/upload",
          {
            method: "POST",
            body: uploadData,
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
          uploadResult.attachment_name || "";
        attachmentUrl =
          uploadResult.attachment_url || "";
        attachmentType =
          uploadResult.attachment_type || "";
      }

      const response = await fetch(
        "/api/internal-chat",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            employee_id:
              selectedEmployeeId,
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

      const result = await response.json();

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
        fileInputRef.current.value = "";
      }

      await loadMessages(
        selectedEmployeeId
      );
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

  function openForwardPopup(
    message: Message
  ) {
    setForwardingMessage(message);
    setSelectedForwardEmployeeIds([]);
    setForwardSearch("");
    setForwardSuccess("");
    setOpenMessageMenuId("");
    setError("");
  }

  function toggleForwardEmployee(
    employeeId: string
  ) {
    setSelectedForwardEmployeeIds(
      (current) =>
        current.includes(employeeId)
          ? current.filter(
              (id) => id !== employeeId
            )
          : [...current, employeeId]
    );
  }

  async function forwardSelectedMessage() {
    if (
      !forwardingMessage ||
      !selectedForwardEmployeeIds.length
    ) {
      setError(
        "Select at least one employee."
      );
      return;
    }

    try {
      setForwarding(true);
      setError("");
      setForwardSuccess("");

      const response = await fetch(
        "/api/internal-chat/forward",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            source_message_id:
              forwardingMessage.id,
            employee_ids:
              selectedForwardEmployeeIds,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to forward message."
        );
      }

      const forwardedCount =
        Number(
          result.forwarded_count || 0
        );

      setForwardSuccess(
        `Message forwarded to ${forwardedCount} ${
          forwardedCount === 1
            ? "employee"
            : "employees"
        }.`
      );

      setTimeout(() => {
        setForwardingMessage(null);
        setSelectedForwardEmployeeIds([]);
        setForwardSearch("");
        setForwardSuccess("");
      }, 900);
    } catch (forwardError) {
      setError(
        forwardError instanceof Error
          ? forwardError.message
          : "Unable to forward message."
      );
    } finally {
      setForwarding(false);
    }
  }

  async function copyMessage(
    message: Message
  ) {
    const textToCopy =
      message.message_text ||
      message.attachment_name ||
      "";

    if (!textToCopy) {
      setError(
        "There is no message text to copy."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        textToCopy
      );

      setOpenMessageMenuId("");
      setError("");
    } catch {
      setError(
        "Unable to copy the message."
      );
    }
  }

  async function deleteMessageForMe(
    message: Message
  ) {
    const confirmed = window.confirm(
      "Delete this message only from your view?"
    );

    if (!confirmed) {
      return;
    }

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

      setMessages(
        (currentMessages) =>
          currentMessages.filter(
            (currentMessage) =>
              currentMessage.id !==
              message.id
          )
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete message from your view."
      );
    } finally {
      setDeletingMessageId("");
    }
  }

  async function deleteMessageForEveryone(
    message: Message
  ) {
    const confirmed = window.confirm(
      "Delete this message for everyone? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

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

      setMessages((currentMessages) =>
        currentMessages.filter(
          (currentMessage) =>
            currentMessage.id !==
            message.id
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
    loadEmployees();
    loadUnreadCounts();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      loadMessages(selectedEmployeeId);
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    const refreshUnreadCounts = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadUnreadCounts();
      }
    };

    const unreadIntervalId =
      window.setInterval(
        refreshUnreadCounts,
        3000
      );

    document.addEventListener(
      "visibilitychange",
      refreshUnreadCounts
    );

    return () => {
      window.clearInterval(
        unreadIntervalId
      );

      document.removeEventListener(
        "visibilitychange",
        refreshUnreadCounts
      );
    };
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      return;
    }

    const refreshConversation = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadMessages(
          selectedEmployeeId,
          {
            silent: true,
          }
        );
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
  }, [selectedEmployeeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar />

      {forwardingMessage ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-bold text-[#3f4447]">
                  Forward Message
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Select one or more employees.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!forwarding) {
                    setForwardingMessage(null);
                    setSelectedForwardEmployeeIds(
                      []
                    );
                    setForwardSearch("");
                    setForwardSuccess("");
                    setError("");
                  }
                }}
                disabled={forwarding}
                className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                title="Close"
              >
                ×
              </button>
            </div>

            <div className="border-b border-gray-200 px-4 py-3">
              <div className="rounded-xl border-l-4 border-[#d2b241] bg-[#fff9df] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#8f7415]">
                  Message preview
                </p>

                <p className="mt-1 line-clamp-3 text-sm text-gray-700">
                  {forwardingMessage.message_text ||
                    forwardingMessage.attachment_name ||
                    "Attachment"}
                </p>
              </div>

              <input
                value={forwardSearch}
                onChange={(event) =>
                  setForwardSearch(
                    event.target.value
                  )
                }
                placeholder="Search employee..."
                className="mt-3 h-10 w-full rounded-full border border-gray-300 bg-[#f5f6f6] px-4 text-sm outline-none transition focus:border-[#d2b241] focus:bg-white"
              />

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-600">
                  {
                    selectedForwardEmployeeIds.length
                  }{" "}
                  selected
                </span>

                {employees.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedForwardEmployeeIds(
                        selectedForwardEmployeeIds.length ===
                          employees.length
                          ? []
                          : employees.map(
                              (employee) =>
                                employee.id
                            )
                      )
                    }
                    className="font-bold text-[#9a7900] hover:underline"
                  >
                    {selectedForwardEmployeeIds.length ===
                    employees.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {forwardEmployees.length ? (
                forwardEmployees.map(
                  (employee) => {
                    const checked =
                      selectedForwardEmployeeIds.includes(
                        employee.id
                      );

                    return (
                      <button
                        key={employee.id}
                        type="button"
                        onClick={() =>
                          toggleForwardEmployee(
                            employee.id
                          )
                        }
                        className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-4 text-left hover:bg-gray-50 ${
                          checked
                            ? "bg-[#fff8d8]"
                            : ""
                        }`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3f4447] font-bold text-white">
                          {employee.profile_photo ? (
                            <img
                              src={
                                employee.profile_photo
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials(employee)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-[#3f4447]">
                            {employeeName(
                              employee
                            )}
                          </p>

                          <p className="truncate text-[12px] leading-4 text-gray-500">
                            {employeeDesignation(
                              employee
                            )}
                          </p>
                        </div>

                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
                            checked
                              ? "border-[#d2b241] bg-[#d2b241] text-white"
                              : "border-gray-300 bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </button>
                    );
                  }
                )
              ) : (
                <p className="p-8 text-center text-gray-500">
                  No employees found.
                </p>
              )}
            </div>

            {forwardSuccess ? (
              <div className="border-t border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700">
                {forwardSuccess}
              </div>
            ) : null}

            {error ? (
              <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setForwardingMessage(null);
                  setSelectedForwardEmployeeIds(
                    []
                  );
                  setForwardSearch("");
                  setForwardSuccess("");
                  setError("");
                }}
                disabled={forwarding}
                className="rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  forwardSelectedMessage
                }
                disabled={
                  forwarding ||
                  !selectedForwardEmployeeIds.length
                }
                className="rounded-xl bg-[#d2b241] px-6 py-3 font-bold text-white disabled:opacity-50"
              >
                {forwarding
                  ? "Forwarding..."
                  : `Forward${
                      selectedForwardEmployeeIds.length
                        ? ` (${selectedForwardEmployeeIds.length})`
                        : ""
                    }`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <div className="mx-auto flex h-[calc(100vh-48px)] max-w-[1450px] overflow-hidden rounded-[18px] border border-gray-200 bg-white shadow-md">
          <section className="flex w-full max-w-[340px] flex-col border-r border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h1 className="text-xl font-bold tracking-tight text-[#303538]">
                Messenger
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Private Admin and Employee Chat
              </p>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search employee..."
                className="mt-4 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 outline-none focus:border-[#d2b241]"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingEmployees ? (
                <p className="p-5 text-gray-500">
                  Loading employees...
                </p>
              ) : filteredEmployees.length ? (
                filteredEmployees.map(
                  (employee) => {
                    const active =
                      employee.id ===
                      selectedEmployeeId;

                    return (
                      <button
                        key={employee.id}
                        onClick={() =>
                          setSelectedEmployeeId(
                            employee.id
                          )
                        }
                        className={`flex w-full items-center gap-3 border-b border-gray-100 px-3.5 py-3 text-left transition ${
                          active
                            ? "bg-[#fff7d9]"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3f4447] text-sm font-bold text-white">
                          {employee.profile_photo ? (
                            <img
                              src={
                                employee.profile_photo
                              }
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials(employee)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold leading-5 text-[#303538]">
                            {employeeName(
                              employee
                            )}
                          </p>

                          <p className="truncate text-sm text-gray-500">
                            {employeeDesignation(
                              employee
                            )}
                          </p>
                        </div>

                        {Number(
                          unreadCounts[
                            employee.id
                          ] || 0
                        ) > 0 ? (
                          <span className="flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#d2b241] px-1.5 text-[10px] font-bold text-white shadow-sm">
                            {Number(
                              unreadCounts[
                                employee.id
                              ] || 0
                            ) > 99
                              ? "99+"
                              : unreadCounts[
                                  employee.id
                                ]}
                          </span>
                        ) : null}
                      </button>
                    );
                  }
                )
              ) : (
                <p className="p-5 text-gray-500">
                  No employees found.
                </p>
              )}
            </div>
          </section>

          <section
            className="flex min-w-0 flex-1 flex-col bg-[#efeae2]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20px 20px, rgba(63,68,71,0.035) 1.5px, transparent 1.5px)",
              backgroundSize: "38px 38px",
            }}
          >
            {selectedEmployee ? (
              <>
                <div className="flex min-h-[66px] items-center gap-3 border-b border-gray-200 bg-[#fafafa] px-5 py-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#3f4447] text-sm font-bold text-white">
                    {selectedEmployee.profile_photo ? (
                      <img
                        src={
                          selectedEmployee.profile_photo
                        }
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials(selectedEmployee)
                    )}
                  </div>

                  <div>
                    <h2 className="text-[14px] font-semibold leading-5 text-[#303538]">
                      {employeeName(
                        selectedEmployee
                      )}
                    </h2>

                    <p className="text-[12px] leading-4 text-gray-500">
                      {employeeDesignation(
                        selectedEmployee
                      )}
                      {" · "}
                      {selectedEmployee.status ||
                        "Available"}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
                  {loadingMessages ? (
                    <p className="text-center text-gray-500">
                      Loading conversation...
                    </p>
                  ) : messages.length ? (
                    <div className="space-y-1.5">
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
                            "Admin";

                          return (
                            <div
                              key={message.id}
                            >
                              {showDate ? (
                                <div className="my-4 text-center">
                                  <span className="rounded-lg bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 shadow-sm">
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
                                  className={`group relative max-w-[66%] rounded-xl px-3 py-2 shadow-sm ${
                                    mine
                                      ? "rounded-br-sm bg-[#d9fdd3]"
                                      : "rounded-bl-sm bg-white"
                                  }`}
                                >
                                  {message.forwarded_from_message_id ? (
                                    <div className="mb-2 flex items-center gap-1 text-[11px] italic text-gray-500">
                                      <span>↪</span>
                                      <span>
                                        Forwarded
                                      </span>
                                    </div>
                                  ) : null}

                                  {message.reply_to_message_id ? (() => {
                                    const originalMessage =
                                      messages.find(
                                        (candidate) =>
                                          candidate.id ===
                                          message.reply_to_message_id
                                      );

                                    return (
                                      <div className="mb-1.5 rounded-md border-l-[3px] border-[#d2b241] bg-black/[0.045] px-2.5 py-1.5">
                                        <p className="text-[11px] font-bold text-[#8f7415]">
                                          {originalMessage?.sender_role ===
                                          "Admin"
                                            ? "Admin"
                                            : "Employee"}
                                        </p>

                                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-4 text-gray-600">
                                          {originalMessage
                                            ? originalMessage.message_text ||
                                              originalMessage.attachment_name ||
                                              "Attachment"
                                            : "Original message unavailable"}
                                        </p>
                                      </div>
                                    );
                                  })() : null}

                                  {message.message_text ? (
                                    <p className="whitespace-pre-wrap text-[13px] leading-[1.4] text-[#202124]">
                                      {
                                        message.message_text
                                      }
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
                                          title="Open full-size image"
                                          className="block"
                                        >
                                          <img
                                            src={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                              message.id
                                            )}`}
                                            alt={
                                              message.attachment_name ||
                                              "Chat attachment"
                                            }
                                            className="max-h-60 w-full object-contain"
                                          />
                                        </a>

                                        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-3 py-2">
                                          <p
                                            className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700"
                                            title={
                                              message.attachment_name ||
                                              "Image attachment"
                                            }
                                          >
                                            🖼{" "}
                                            {message.attachment_name ||
                                              "Image attachment"}
                                          </p>

                                          <a
                                            href={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                              message.id
                                            )}&download=1`}
                                            className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                          >
                                            Download
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-1.5 rounded-lg border border-gray-200 bg-white/75 p-2.5">
                                        <div className="flex items-start gap-3">
                                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
                                            📄
                                          </div>

                                          <div className="min-w-0 flex-1">
                                            <p
                                              className="truncate text-sm font-semibold text-gray-800"
                                              title={
                                                message.attachment_name ||
                                                "Document attachment"
                                              }
                                            >
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
                                                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-50"
                                              >
                                                Open
                                              </a>

                                              <a
                                                href={`/api/internal-chat/attachment?message_id=${encodeURIComponent(
                                                  message.id
                                                )}&download=1`}
                                                className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-bold text-white hover:bg-blue-800"
                                              >
                                                Download
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  ) : null}

                                  <div className="absolute -right-2 -top-2 z-20 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
                                      className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-bold text-gray-500 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                                      title="Message options"
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
                                          <span>↩</span>
                                          <span>
                                            Reply
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openForwardPopup(
                                              message
                                            )
                                          }
                                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                          <span>➡</span>
                                          <span>
                                            Forward
                                          </span>
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
                                          <span>📋</span>
                                          <span>
                                            Copy
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            deleteMessageForMe(
                                              message
                                            )
                                          }
                                          disabled={
                                            deletingMessageId ===
                                            message.id
                                          }
                                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                        >
                                          <span>🗑</span>
                                          <span>
                                            Delete for Me
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            deleteMessageForEveryone(
                                              message
                                            )
                                          }
                                          disabled={
                                            deletingMessageId ===
                                            message.id
                                          }
                                          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                                        >
                                          <span>🗑</span>
                                          <span>
                                            {deletingMessageId ===
                                            message.id
                                              ? "Deleting..."
                                              : "Delete for Everyone"}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            setOpenMessageMenuId(
                                              ""
                                            )
                                          }
                                          className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-500 hover:bg-gray-50"
                                        >
                                          <span>✕</span>
                                          <span>
                                            Cancel
                                          </span>
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] leading-none text-gray-500">
                                    <span>
                                      {formatTime(
                                        message.created_at
                                      )}
                                    </span>

                                    {mine ? (
                                      <span
                                        className={
                                          message.seen_by_employee
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
                      <div className="max-w-sm rounded-2xl bg-white/90 p-6 text-center shadow-sm">
                        <p className="text-lg font-bold text-[#3f4447]">
                          Start a conversation
                        </p>

                        <p className="mt-2 text-sm text-gray-500">
                          Send a private message to this employee.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error ? (
                  <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="border-t border-gray-200 bg-[#fafafa] px-4 py-3">
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
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#8f7415]">
                          Replying to{" "}
                          {replyingTo.sender_role ===
                          "Admin"
                            ? "Admin"
                            : "Employee"}
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
                        className="ml-3 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold text-gray-500 hover:bg-black/5"
                        title="Cancel reply"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}

                  {selectedFile ? (
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-[#eadb9f] bg-[#fff9df] px-4 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-700">
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
                        className="ml-3 rounded-lg px-3 py-1 font-bold text-red-600 hover:bg-red-50"
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
                      title="Attach a document"
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
                      className="max-h-28 min-h-10 flex-1 resize-none rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm leading-5 outline-none transition focus:border-[#d2b241]"
                    />

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={
                        sending ||
                        (!messageText.trim() &&
                          !selectedFile)
                      }
                      className="h-10 rounded-full bg-[#d2b241] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#bd9b2e] disabled:opacity-50"
                    >
                      {sending
                        ? "Sending..."
                        : "Send"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <div>
                  <h2 className="text-2xl font-bold text-[#3f4447]">
                    Select an employee
                  </h2>

                  <p className="mt-2 text-gray-500">
                    Choose an employee from the left to open the private conversation.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Sidebar() {
  const items = [
    ["Dashboard", "/dashboard"],
    ["Employees", "/employees"],
    ["Messenger", "/messenger"],
    ["Leave Requests", "/leave-requests"],
    ["Document Expiry", "/document-expiry"],
    ["Reports", "/reports"],
  ];

  return (
    <aside className="hidden w-72 shrink-0 flex-col justify-between bg-[#3f4447] p-6 text-white md:flex">
      <div>
        <div className="mb-10 text-3xl font-bold tracking-widest">
          IC
          <span className="text-[#d2b241]">
            D
          </span>
          E
        </div>

        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a
              key={name}
              href={href}
              className={`block rounded-xl px-4 py-3 ${
                name === "Messenger"
                  ? "bg-[#d2b241] font-semibold"
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
        className="block w-full rounded-2xl border border-white/25 py-4 text-center font-semibold text-white hover:bg-white/10"
      >
        Sign Out
      </a>
    </aside>
  );
}
