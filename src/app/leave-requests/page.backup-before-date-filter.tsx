"use client";

import { useEffect, useState } from "react";

export default function LeaveRequestsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const pending = leaves.filter((leave) => leave.status === "Pending");
  const approved = leaves.filter((leave) => leave.status === "Approved");
  const rejected = leaves.filter((leave) => leave.status === "Rejected");

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <AdminSidebar active="Leave Requests" />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Leave Requests</h1>
        <p className="text-gray-500 mb-8">Review, approve, or reject employee leave applications.</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Pending Requests" value={pending.length} />
          <Kpi title="Approved Requests" value={approved.length} />
          <Kpi title="Rejected Requests" value={rejected.length} />
          <Kpi title="Total Requests" value={leaves.length} />
        </section>

        {loading ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm">Loading...</div>
        ) : (
          <>
            <LeaveTable title="Pending Leave Applications" leaves={pending} showActions approveLeave={approveLeave} rejectLeave={rejectLeave} />
            <LeaveTable title="Approved Requests" leaves={approved} />
            <LeaveTable title="Rejected Requests" leaves={rejected} />
          </>
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

function LeaveTable({ title, leaves, showActions = false, approveLeave, rejectLeave }: any) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-[1200px] w-full text-sm border-collapse">
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
              {showActions && <th className="p-3 text-left">Action</th>}
            </tr>
          </thead>

          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 9 : 8} className="p-6 text-center text-gray-500">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              leaves.map((leave: any) => (
                <tr key={leave.id} className="border-b">
                  <td className="p-3 font-medium">{employeeDisplayName(leave)}</td>
                  <td className="p-3">{leave.leave_type}</td>
                  <td className="p-3">{leave.start_date}</td>
                  <td className="p-3">{leave.end_date}</td>
                  <td className="p-3">{leave.total_days}</td>
                  <td className="p-3">{leave.reason || "-"}</td>
                  <td className="p-3">{leave.employee?.balance_leaves ?? leave.employees?.balance_leaves ?? "-"}</td>
                  <td className="p-3 font-semibold">{leave.status}</td>

                  {showActions && (
                    <td className="p-3">
                      <button onClick={() => approveLeave(leave)} className="text-green-700 font-bold mr-4">
                        Approve
                      </button>
                      <button onClick={() => rejectLeave(leave)} className="text-red-700 font-bold">
                        Reject
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">Scroll left/right if table is wider than screen.</p>
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
