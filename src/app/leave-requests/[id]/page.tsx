"use client";

import { useEffect, useMemo, useState } from "react";

const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
  "Holiday Credit Leave",
  "Maternity Leave",
  "Paternity Leave",
];

type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number | string;
  reason?: string;
  status: string;
};

export default function LeaveRequestEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [requestId, setRequestId] = useState("");
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [employee, setEmployee] = useState<any>(null);

  const [form, setForm] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    total_days: "",
    reason: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setErrorMessage("");

        const { id } = await params;

        if (!active) return;

        setRequestId(id);

        const leaveResponse = await fetch(
          `/api/leave-requests/${id}`,
          { cache: "no-store" }
        );

        const leaveData = await leaveResponse.json();

        if (!leaveResponse.ok) {
          throw new Error(
            leaveData?.error || "Unable to load leave request."
          );
        }

        const employeeResponse = await fetch(
          `/api/employees/${leaveData.employee_id}`,
          { cache: "no-store" }
        );

        const employeeData = await employeeResponse.json();

        if (!employeeResponse.ok) {
          throw new Error(
            employeeData?.error || "Unable to load employee."
          );
        }

        if (!active) return;

        setLeave(leaveData);
        setEmployee(employeeData);

        setForm({
          leave_type: leaveData.leave_type || "",
          start_date: leaveData.start_date || "",
          end_date: leaveData.end_date || "",
          total_days: String(leaveData.total_days || ""),
          reason: leaveData.reason || "",
        });
      } catch (error) {
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Leave Request Editor."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [params]);

  const fullName = useMemo(() => {
    if (!employee) return "-";

    return `${employee.first_name || ""} ${
      employee.middle_name || ""
    } ${employee.last_name || ""}`
      .replace(/\s+/g, " ")
      .trim();
  }, [employee]);

  function calculateDays(startDate: string, endDate: string) {
    if (!startDate || !endDate) return "";

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return "";
    }

    const difference =
      end.getTime() - start.getTime();

    return String(
      Math.floor(difference / (1000 * 60 * 60 * 24)) + 1
    );
  }

  function updateDate(
    field: "start_date" | "end_date",
    value: string
  ) {
    const updated = {
      ...form,
      [field]: value,
    };

    updated.total_days = calculateDays(
      updated.start_date,
      updated.end_date
    );

    setForm(updated);
  }

  async function saveChanges() {
    if (leave?.status !== "Pending") {
      setErrorMessage(
        "Only pending leave requests can be edited."
      );
      return false;
    }

    if (
      !form.leave_type ||
      !form.start_date ||
      !form.end_date ||
      !form.total_days
    ) {
      setErrorMessage(
        "Leave type, From, To, and Total Days are required."
      );
      return false;
    }

    try {
      setSaving(true);
      setMessage("");
      setErrorMessage("");

      const response = await fetch(
        `/api/leave-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leave_type: form.leave_type,
            start_date: form.start_date,
            end_date: form.end_date,
            total_days: Number(form.total_days),
            reason: form.reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save leave changes."
        );
      }

      setLeave(data);
      setMessage("Leave request changes saved successfully.");

      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save leave changes."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    status: "Approved" | "Rejected"
  ) {
    if (leave?.status !== "Pending") {
      setErrorMessage(
        "This leave request is no longer pending."
      );
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");
      setErrorMessage("");

      const saved = await saveChanges();

      if (!saved) return;

      const response = await fetch(
        `/api/leave-requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `Unable to ${status.toLowerCase()} leave request.`
        );
      }

      setLeave(data);
      setMessage(
        `Leave request ${status.toLowerCase()} successfully.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update leave status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] p-8">
        Loading Leave Request Editor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <a
          href="/leave-requests"
          className="text-[#b59628] font-bold hover:underline"
        >
          ← Back to Leave Requests
        </a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">
            Leave Request Editor
          </h1>

          <p className="text-gray-500 mt-2">
            Review and correct the leave request before approval.
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">
            {message}
          </div>
        ) : null}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">
            Employee Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Info
              label="Employee ID"
              value={employee?.employee_id || "-"}
            />

            <Info
              label="Employee Name"
              value={fullName || "-"}
            />

            <Info
              label="Department"
              value={employee?.department || "-"}
            />

            <Info
              label="Current Annual Balance"
              value={`${employee?.balance_leaves ?? 0} Days`}
            />

            <Info
              label="Holiday Credit Balance"
              value={`${employee?.credit_leave_balance ?? 0} Days`}
            />

            <Info
              label="Request Status"
              value={leave?.status || "-"}
            />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">
            Leave Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Leave Type
              </label>

              <select
                value={form.leave_type}
                disabled={leave?.status !== "Pending"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    leave_type: event.target.value,
                  })
                }
                className="mt-2 w-full border rounded-xl px-4 py-3 bg-white disabled:bg-gray-100"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <Field
              label="From"
              type="date"
              value={form.start_date}
              disabled={leave?.status !== "Pending"}
              onChange={(value) =>
                updateDate("start_date", value)
              }
            />

            <Field
              label="To"
              type="date"
              value={form.end_date}
              disabled={leave?.status !== "Pending"}
              onChange={(value) =>
                updateDate("end_date", value)
              }
            />

            <Field
              label="Total Days"
              type="number"
              value={form.total_days}
              disabled={leave?.status !== "Pending"}
              min="0.5"
              step="0.5"
              onChange={(value) =>
                setForm({
                  ...form,
                  total_days: value,
                })
              }
            />

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-600">
                Reason
              </label>

              <textarea
                value={form.reason}
                disabled={leave?.status !== "Pending"}
                onChange={(event) =>
                  setForm({
                    ...form,
                    reason: event.target.value,
                  })
                }
                rows={4}
                className="mt-2 w-full border rounded-xl px-4 py-3 outline-none disabled:bg-gray-100"
              />
            </div>
          </div>

          {leave?.status === "Pending" ? (
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="bg-[#3f4447] text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          ) : null}
        </section>

        {leave?.status === "Pending" ? (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-[#3f4447] mb-5">
              Approval
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                disabled={actionLoading || saving}
                onClick={() => updateStatus("Approved")}
                className="bg-green-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-60"
              >
                Approve Leave
              </button>

              <button
                type="button"
                disabled={actionLoading || saving}
                onClick={() => updateStatus("Rejected")}
                className="bg-red-700 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-60"
              >
                Reject Leave
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
        {label}
      </p>

      <p className="text-[#3f4447] font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  disabled = false,
  min,
  step,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        disabled={disabled}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border rounded-xl px-4 py-3 outline-none disabled:bg-gray-100"
      />
    </div>
  );
}
