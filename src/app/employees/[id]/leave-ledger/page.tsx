"use client";

import { useEffect, useMemo, useState } from "react";

const ANNUAL_GROUP_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
];

type Employee = {
  id?: string;
  employee_id?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  department?: string;
  position?: string;
  designation?: string;
  date_of_joining?: string;
  total_leaves?: number | string;
  leaves_used?: number | string;
  balance_leaves?: number | string;
  paternity_leave_used?: number | string;
  paternity_leave_balance?: number | string;
  maternity_leave_used?: number | string;
  maternity_leave_balance?: number | string;
};

type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type?: string;
  start_date?: string;
  end_date?: string;
  total_days?: number | string;
  reason?: string;
  status?: string;
  created_at?: string;
  approved_at?: string;
  annual_period_year?: number | string | null;
};

export default function LeaveLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [isStaffView, setIsStaffView] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [ledgerType, setLedgerType] = useState("annual");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [leaveType, setLeaveType] = useState("All");

  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
  const [appliedLeaveType, setAppliedLeaveType] = useState("All");

  const ledgerConfig =
    ledgerType === "paternity"
      ? {
          title: "Paternity Leave Ledger",
          subtitle: "Approved Paternity Leave records",
          leaveTypes: ["Paternity Leave"],
          entitlement: 15,
          used: Number(employee?.paternity_leave_used ?? 0),
          balance: Number(employee?.paternity_leave_balance ?? 15),
        }
      : ledgerType === "maternity"
      ? {
          title: "Maternity Leave Ledger",
          subtitle: "Approved Maternity Leave records",
          leaveTypes: ["Maternity Leave"],
          entitlement: 45,
          used: Number(employee?.maternity_leave_used ?? 0),
          balance: Number(employee?.maternity_leave_balance ?? 45),
        }
      : {
          title: "Annual Leave Ledger",
          subtitle: "Approved Annual, Sick and Emergency Leave records",
          leaveTypes: ANNUAL_GROUP_TYPES,
          entitlement: Number(employee?.total_leaves ?? 30),
          used: Number(employee?.leaves_used ?? 0),
          balance: Number(employee?.balance_leaves ?? 30),
        };

  useEffect(() => {
    let active = true;

    async function loadLedger() {
      try {
        setLoading(true);
        setErrorMessage("");

        const { id } = await params;

        if (!active) return;

        const currentLedgerType =
          new URLSearchParams(window.location.search).get("type") || "annual";

        setLedgerType(currentLedgerType);
        setIsStaffView(
          new URLSearchParams(window.location.search).get("portal") ===
            "staff"
        );
        setEmployeeId(id);

        const selectedLeaveTypes =
          currentLedgerType === "paternity"
            ? ["Paternity Leave"]
            : currentLedgerType === "maternity"
            ? ["Maternity Leave"]
            : ANNUAL_GROUP_TYPES;

        const [employeeRes, leaveRes] = await Promise.all([
          fetch(`/api/employees/${id}`, {
            cache: "no-store",
          }),
          fetch("/api/leave-requests", {
            cache: "no-store",
          }),
        ]);

        if (!employeeRes.ok) {
          throw new Error("Unable to load employee information.");
        }

        if (!leaveRes.ok) {
          throw new Error("Unable to load employee leave records.");
        }

        const employeeData = await employeeRes.json();
        const leaveData = await leaveRes.json();

        if (!active) return;

        setEmployee(employeeData);

        const approvedRequests = Array.isArray(leaveData)
          ? leaveData.filter((request: LeaveRequest) => {
              return (
                String(request.employee_id) === String(id) &&
                String(request.status).toLowerCase() === "approved" &&
                selectedLeaveTypes.includes(String(request.leave_type))
              );
            })
          : [];

        approvedRequests.sort((a: LeaveRequest, b: LeaveRequest) => {
          const dateA = new Date(
            a.start_date || a.created_at || 0
          ).getTime();

          const dateB = new Date(
            b.start_date || b.created_at || 0
          ).getTime();

          return dateB - dateA;
        });

        setRequests(approvedRequests);
      } catch (error) {
        if (!active) return;

        setEmployee(null);
        setRequests([]);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load Annual Leave Ledger."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLedger();

    return () => {
      active = false;
    };
  }, [params]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const startDate = request.start_date || "";
      const endDate = request.end_date || startDate;

      const matchesFrom = appliedFromDate
        ? endDate >= appliedFromDate
        : true;

      const matchesTo = appliedToDate
        ? startDate <= appliedToDate
        : true;

      const matchesType =
        appliedLeaveType === "All"
          ? true
          : request.leave_type === appliedLeaveType;

      return matchesFrom && matchesTo && matchesType;
    });
  }, [
    requests,
    appliedFromDate,
    appliedToDate,
    appliedLeaveType,
  ]);

  const totalEntitlement = ledgerConfig.entitlement;

  const totalUsed = requests.reduce(
    (total, request) =>
      total + Number(request.total_days || 0),
    0
  );

  const currentBalance = Math.max(
    totalEntitlement - totalUsed,
    0
  );

  const filteredUsedDays = filteredRequests.reduce(
    (total, request) =>
      total + Number(request.total_days || 0),
    0
  );

  const annualLeaveUsed = requests
    .filter(
      (request) =>
        request.leave_type === "Annual Leave"
    )
    .reduce(
      (total, request) =>
        total + Number(request.total_days || 0),
      0
    );

  const sickLeaveUsed = requests
    .filter(
      (request) =>
        request.leave_type === "Sick Leave"
    )
    .reduce(
      (total, request) =>
        total + Number(request.total_days || 0),
      0
    );

  const emergencyLeaveUsed = requests
    .filter(
      (request) =>
        request.leave_type === "Emergency Leave"
    )
    .reduce(
      (total, request) =>
        total + Number(request.total_days || 0),
      0
    );

  const fullName = employee
    ? `${employee.first_name || ""} ${
        employee.middle_name || ""
      } ${employee.last_name || ""}`
        .replace(/\s+/g, " ")
        .trim()
    : "";

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const searchFilters = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setAppliedLeaveType(leaveType);
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setLeaveType("All");

    setAppliedFromDate("");
    setAppliedToDate("");
    setAppliedLeaveType("All");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <p className="text-[#3f4447] font-semibold">
              Loading Annual Leave Ledger...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href={
            isStaffView
              ? `/staff/profile/${employeeId}`
              : `/employees/${employeeId}`
          }
          className="inline-flex items-center text-[#b59628] font-bold hover:underline"
        >
          ← Back to Profile
        </a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">
            {ledgerConfig.title}
          </h1>

          <p className="text-gray-500 mt-2">
            {ledgerConfig.subtitle}
          </p>
        </div>

        {errorMessage ? (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <LedgerKpi
            title="Total Entitlement"
            value={`${totalEntitlement} Days`}
            subtitle={`${ledgerConfig.title.replace(" Ledger", "")} entitlement`}
          />

          <LedgerKpi
            title="Total Used"
            value={`${totalUsed} Days`}
            subtitle="Approved leave deducted"
          />

          <LedgerKpi
            title="Current Balance"
            value={`${currentBalance} Days`}
            subtitle="Available leave balance"
          />
        </section>

        {ledgerType === "annual" ? (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <LeaveTypeSummary
              title="Annual Leave Used"
              value={`${annualLeaveUsed} Days`}
            />

            <LeaveTypeSummary
              title="Sick Leave Used"
              value={`${sickLeaveUsed} Days`}
            />

            <LeaveTypeSummary
              title="Emergency Leave Used"
              value={`${emergencyLeaveUsed} Days`}
            />
          </section>
        ) : null}

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#3f4447]">
                Filter Ledger
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Filter approved leave records by date and leave type.
              </p>
            </div>

            <div className="text-sm font-semibold text-[#3f4447]">
              Selected Period Used: {filteredUsedDays} Days
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <DateInput
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
            />

            <DateInput
              label="To Date"
              value={toDate}
              onChange={setToDate}
            />

            <div>
              <label className="text-sm font-semibold text-gray-600">
                Leave Type
              </label>

              <select
                value={leaveType}
                onChange={(event) =>
                  setLeaveType(event.target.value)
                }
                className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white focus:border-[#d2b241]"
              >
                <option value="All">
                  All Leave Types
                </option>

                {ledgerConfig.leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={searchFilters}
                className="flex-1 bg-[#d2b241] hover:bg-[#b99a2f] text-white px-5 py-3 rounded-xl font-semibold transition"
              >
                Search
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="flex-1 bg-[#3f4447] hover:bg-[#2f3437] text-white px-5 py-3 rounded-xl font-semibold transition"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#3f4447]">
                Approved Leave Transactions
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {filteredRequests.length} approved record
                {filteredRequests.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="rounded-xl bg-[#f7f4ec] px-4 py-3 text-sm font-bold text-[#3f4447]">
              Total: {filteredUsedDays} Days
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-[1200px] w-full text-sm">
              <thead>
                <tr className="bg-[#d2b241] text-white">
                  <th className="p-3 text-left">
                    Date
                  </th>

                  <th className="p-3 text-left">
                    Leave Type
                  </th>

                  <th className="p-3 text-left">
                    From
                  </th>

                  <th className="p-3 text-left">
                    To
                  </th>

                  <th className="p-3 text-center">
                    Days Used
                  </th>

                  <th className="p-3 text-center">
                    Period
                  </th>

                  <th className="p-3 text-left">
                    Reason
                  </th>

                  <th className="p-3 text-left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-gray-500"
                    >
                      No approved leave records found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-[#faf8f1]"
                    >
                      <td className="p-3">
                        {formatDate(
                          request.approved_at ||
                            request.created_at ||
                            request.start_date
                        )}
                      </td>

                      <td className="p-3 font-semibold text-[#3f4447]">
                        {request.leave_type || "-"}
                      </td>

                      <td className="p-3">
                        {formatDate(
                          request.start_date
                        )}
                      </td>

                      <td className="p-3">
                        {formatDate(
                          request.end_date
                        )}
                      </td>

                      <td className="p-3 text-center font-bold">
                        {Number(
                          request.total_days || 0
                        )}
                      </td>

                      <td className="p-3 text-center font-semibold text-[#3f4447]">
                        {request.annual_period_year || "-"}
                      </td>

                      <td className="p-3 max-w-[320px]">
                        <div className="whitespace-normal">
                          {request.reason || "-"}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="inline-flex bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                          {request.status || "Approved"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function LedgerKpi({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-6 text-center">
      <p className="text-gray-500 font-medium">
        {title}
      </p>

      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">
        {value}
      </h3>

      <p className="text-xs text-gray-400 mt-2">
        {subtitle}
      </p>
    </div>
  );
}

function LeaveTypeSummary({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-[#3f4447] rounded-2xl shadow-sm p-5 text-center text-white">
      <p className="text-sm text-gray-200">
        {title}
      </p>

      <h3 className="text-xl font-bold mt-2">
        {value}
      </h3>
    </div>
  );
}

function EmployeeDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="text-[#3f4447] font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">
        {label}
      </label>

      <input
        type="date"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none bg-white focus:border-[#d2b241]"
      />
    </div>
  );
}
