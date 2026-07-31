"use client";

import { useEffect, useMemo, useState } from "react";

const ANNUAL_GROUP_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
];

export default function LeaveLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    params.then(async ({ id }) => {
      setEmployeeId(id);

      try {
        const [employeeRes, leaveRes] = await Promise.all([
          fetch(`/api/employees/${id}`),
          fetch("/api/leave-requests"),
        ]);

        const employeeData = await employeeRes.json();
        const leaveData = await leaveRes.json();

        setEmployee(employeeData);

        setRequests(
          Array.isArray(leaveData)
            ? leaveData.filter(
                (request: any) =>
                  request.employee_id === id &&
                  request.status === "Approved" &&
                  ANNUAL_GROUP_TYPES.includes(request.leave_type)
              )
            : []
        );
      } catch {
        setEmployee(null);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const startDate = request.start_date || "";

      const matchesFrom = fromDate ? startDate >= fromDate : true;
      const matchesTo = toDate ? startDate <= toDate : true;

      return matchesFrom && matchesTo;
    });
  }, [requests, fromDate, toDate]);

  const filteredUsedDays = filteredRequests.reduce(
    (total, request) => total + Number(request.total_days || 0),
    0
  );

  const fullName = employee
    ? `${employee.first_name || ""} ${employee.middle_name || ""} ${
        employee.last_name || ""
      }`
        .replace(/\s+/g, " ")
        .trim()
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] p-8">
        Loading Annual Leave Ledger...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] p-8">
      <div className="max-w-7xl mx-auto">
        <a
          href={`/employees/${employeeId}`}
          className="text-[#d2b241] font-bold"
        >
          ← Back to Employee Profile
        </a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">
            Annual Leave Ledger
          </h1>

          <p className="text-gray-500 mt-2">
            {fullName || "Employee"} — Annual, Sick and Emergency Leave records
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <LedgerKpi
            title="Total Entitlement"
            value={`${employee?.total_leaves ?? 30} Days`}
          />

          <LedgerKpi
            title="Total Used"
            value={`${employee?.leaves_used ?? 0} Days`}
          />

          <LedgerKpi
            title="Current Balance"
            value={`${employee?.balance_leaves ?? 0} Days`}
          />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">
            Filter Ledger
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="w-full bg-[#3f4447] text-white px-5 py-3 rounded-xl font-semibold"
              >
                Clear Dates
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-[#3f4447]">
              Approved Leave History
            </h2>

            <div className="text-sm font-semibold text-[#3f4447]">
              Selected Period Used: {filteredUsedDays} Days
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-[1000px] w-full text-sm">
              <thead>
                <tr className="bg-[#d2b241] text-white">
                  <th className="p-3 text-left">Leave Type</th>
                  <th className="p-3 text-left">From</th>
                  <th className="p-3 text-left">To</th>
                  <th className="p-3 text-left">Days</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-6 text-center text-gray-500"
                    >
                      No approved leave records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b hover:bg-[#f7f4ec]"
                    >
                      <td className="p-3 font-semibold">
                        {request.leave_type}
                      </td>
                      <td className="p-3">{request.start_date || "-"}</td>
                      <td className="p-3">{request.end_date || "-"}</td>
                      <td className="p-3">
                        {Number(request.total_days || 0)}
                      </td>
                      <td className="p-3">{request.reason || "-"}</td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                          {request.status}
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
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-6 text-center">
      <p className="text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
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
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"
      />
    </div>
  );
}