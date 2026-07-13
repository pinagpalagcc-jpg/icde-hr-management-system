"use client";

import { useEffect, useState } from "react";

export default function LeaveRequestsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    from: "",
    to: "",
    status: "All",
    leaveType: "All",
  });

  const [showResults, setShowResults] = useState(false);

  async function loadLeaves() {
    setLoading(true);

    const [leaveRes, employeeRes] = await Promise.all([
      fetch("/api/leave-requests"),
      fetch("/api/employees"),
    ]);

    const leaveData = await leaveRes.json();
    const employeeData = await employeeRes.json();

    const employees = Array.isArray(employeeData) ? employeeData : [];

    const mergedLeaves = Array.isArray(leaveData)
      ? leaveData.map((leave: any) => {
          const employee =
            leave.employees ||
            employees.find((emp: any) => emp.id === leave.employee_id) ||
            null;

          return { ...leave, employee };
        })
      : [];

    setLeaves(mergedLeaves);
    setLoading(false);
  }

  useEffect(() => {
    loadLeaves();
  }, []);

  function filteredLeaves() {
    if (!showResults) return [];

    return leaves.filter((leave) => {
      const startDate = leave.start_date || "";

      const matchFrom = filters.from ? startDate >= filters.from : true;
      const matchTo = filters.to ? startDate <= filters.to : true;
      const matchStatus = filters.status === "All" ? true : leave.status === filters.status;
      const matchType = filters.leaveType === "All" ? true : leave.leave_type === filters.leaveType;

      return matchFrom && matchTo && matchStatus && matchType;
    });
  }

  async function deleteLeave(leave: any) {
    if (!leave?.id) {
      alert("Leave request ID missing.");
      return;
    }

    const confirmed = window.confirm(
      `Delete this ${leave.status} leave request? Its linked ledger entry will also be deleted.`
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `/api/leave-requests/${leave.id}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(
        result.error ||
          "Failed to delete leave request."
      );
      return;
    }

    alert(
      "Leave request and linked ledger entry deleted successfully."
    );

    await loadLeaves();
  }

  async function approveLeave(leave: any) {
    if (!leave?.id) {
      alert("Leave request ID missing. Please refresh and try again.");
      return;
    }

    const res = await fetch(`/api/leave-requests/${leave.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Approved" }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to approve leave");
      return;
    }

    alert("Leave approved successfully.");
    loadLeaves();
  }

  async function rejectLeave(leave: any) {
    if (!leave?.id) {
      alert("Leave request ID missing. Please refresh and try again.");
      return;
    }

    const res = await fetch(`/api/leave-requests/${leave.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Rejected" }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to reject leave");
      return;
    }

    alert("Leave rejected successfully.");
    loadLeaves();
  }

  const allFiltered = filteredLeaves();
  const pending = allFiltered.filter((leave) => leave.status === "Pending");
  const approved = allFiltered.filter((leave) => leave.status === "Approved");
  const rejected = allFiltered.filter((leave) => leave.status === "Rejected");

  const totalPending = leaves.filter((leave) => leave.status === "Pending").length;
  const totalApproved = leaves.filter((leave) => leave.status === "Approved").length;
  const totalRejected = leaves.filter((leave) => leave.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <AdminSidebar active="Leave Requests" />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Leave Requests</h1>
        <p className="text-gray-500 mb-8">
          Filter, review, approve, or reject employee leave applications.
        </p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Pending Requests" value={totalPending} />
          <Kpi title="Approved Requests" value={totalApproved} />
          <Kpi title="Rejected Requests" value={totalRejected} />
          <Kpi title="Total Requests" value={leaves.length} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Filter Leave Requests</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <Input
              label="From Date"
              type="date"
              value={filters.from}
              onChange={(v: string) => setFilters({ ...filters, from: v })}
            />

            <Input
              label="To Date"
              type="date"
              value={filters.to}
              onChange={(v: string) => setFilters({ ...filters, to: v })}
            />

            <Select
              label="Status"
              value={filters.status}
              options={["All", "Pending", "Approved", "Rejected"]}
              onChange={(v: string) => setFilters({ ...filters, status: v })}
            />

            <Select
              label="Leave Type"
              value={filters.leaveType}
              options={[
                "All",
                "Annual Leave",
                "Sick Leave",
                "Emergency Leave",
                "Unpaid Leave",
                "Holiday Credit Leave",
                "Maternity Leave",
                "Paternity Leave",
              ]}
              onChange={(v: string) => setFilters({ ...filters, leaveType: v })}
            />
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setShowResults(true)}
              className="bg-[#d2b241] text-white px-6 py-3 rounded-xl font-semibold"
            >
              Search Requests
            </button>

            <button
              onClick={() => {
                setFilters({ from: "", to: "", status: "All", leaveType: "All" });
                setShowResults(false);
              }}
              className="bg-[#3f4447] text-white px-6 py-3 rounded-xl font-semibold"
            >
              Clear Filter
            </button>
          </div>

          {!showResults && (
            <p className="text-gray-500 mt-4">
              Select date range or filter, then click Search Requests to show the table.
            </p>
          )}
        </section>

        {loading ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm">Loading...</div>
        ) : showResults ? (
          <>
            <LeaveTable
              title="Pending Leave Applications"
              leaves={pending}
              showActions
              approveLeave={approveLeave}
              rejectLeave={rejectLeave}
            />
            <LeaveTable
              title="Approved Requests"
              leaves={approved}
              showDelete
              deleteLeave={deleteLeave}
            />

            <LeaveTable
              title="Rejected Requests"
              leaves={rejected}
              showDelete
              deleteLeave={deleteLeave}
            />
          </>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-500">
            Leave request table is hidden. Use the filter above to view requests.
          </div>
        )}
      </main>
    </div>
  );
}

function employeeDisplayName(leave: any) {
  const emp = leave.employee || leave.employees || {};

  const fullName =
    emp.full_name ||
    emp.name ||
    emp.employee_name ||
    [emp.first_name, emp.last_name].filter(Boolean).join(" ");

  return fullName || emp.email || leave.employee_name || "-";
}

function LeaveTable({
  title,
  leaves,
  showActions = false,
  showDelete = false,
  approveLeave,
  rejectLeave,
  deleteLeave,
}: any) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">
        {title}
      </h2>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-[1250px] w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#d2b241] text-white">
              <th className="p-3 text-left">Employee</th>
              <th className="p-3 text-left">Leave Type</th>
              <th className="p-3 text-left">From</th>
              <th className="p-3 text-left">To</th>
              <th className="p-3 text-left">Days</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Balance Leaves</th>
              <th className="p-3 text-left">Status</th>
              {showActions || showDelete ? (
                <th className="p-3 text-left">Action</th>
              ) : null}
            </tr>
          </thead>

          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    showActions || showDelete ? 9 : 8
                  }
                  className="p-6 text-center text-gray-500"
                >
                  No leave requests found.
                </td>
              </tr>
            ) : (
              leaves.map((leave: any) => (
                <tr key={leave.id} className="border-b">
                  <td className="p-3 font-medium">
                    {employeeDisplayName(leave)}
                  </td>

                  <td className="p-3">
                    {leave.leave_type}
                  </td>

                  <td className="p-3">
                    {leave.start_date}
                  </td>

                  <td className="p-3">
                    {leave.end_date}
                  </td>

                  <td className="p-3">
                    {leave.total_days}
                  </td>

                  <td className="p-3">
                    {leave.reason || "-"}
                  </td>

                  <td className="p-3">
                    {leave.employee?.balance_leaves ??
                      leave.employees?.balance_leaves ??
                      "-"}
                  </td>

                  <td className="p-3 font-semibold">
                    {leave.status}
                  </td>

                  {showActions ? (
                    <td className="p-3 whitespace-nowrap">
                      <a
                        href={`/leave-requests/${leave.id}`}
                        className="inline-block text-blue-700 font-bold mr-4 hover:underline"
                      >
                        Edit
                      </a>

                      <button
                        type="button"
                        onClick={() => approveLeave(leave)}
                        className="text-green-700 font-bold mr-4 hover:underline"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectLeave(leave)}
                        className="text-red-700 font-bold hover:underline"
                      >
                        Reject
                      </button>
                    </td>
                  ) : showDelete ? (
                    <td className="p-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => deleteLeave(leave)}
                        className="text-red-700 font-bold hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Scroll left/right if table is wider than screen.
      </p>
    </section>
  );
}


function Kpi({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-t-4 border-[#d2b241] p-6 text-center">
      <p className="text-gray-500">{title}</p>
      <h3 className="text-3xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"
      >
        {options.map((option: string) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function AdminSidebar({ active }: { active: string }) {
  const items = [
    ["Dashboard", "/dashboard"],
    ["Employees", "/employees"],
    ["Leave Requests", "/leave-requests"],
    ["Reports", "/reports"],
    ["Document Expiry", "/document-expiry"],
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <div className="mb-10">
          <div className="text-4xl font-black tracking-widest">
            <span className="text-white">IC</span><span className="text-[#d2b241]">D</span><span className="text-white">E</span>
          </div>
          <div className="text-sm text-white/90 mt-3">HR Management Portal</div>
          <div className="w-24 h-[3px] bg-[#d2b241] mt-3 rounded-full"></div>
          <div className="text-xs text-white/60 mt-3">@2026 V.1.1</div>
        </div>

        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a key={name} href={href} className={`block px-4 py-3 rounded-xl ${active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"}`}>
              {name}
            </a>
          ))}
        </nav>
      </div>

      <button
        onClick={() => {
          localStorage.clear();
          document.cookie = "icde_auth=; path=/; max-age=0";
          window.location.href = "/login";
        }}
        className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10"
      >
        Sign Out
      </button>
    </aside>
  );
}
