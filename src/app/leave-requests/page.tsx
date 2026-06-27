"use client";

import { useEffect, useState } from "react";

export default function LeaveRequestsPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const pending = leaves.filter((l) => l.status === "Pending");
  const approved = leaves.filter((l) => l.status === "Approved");
  const rejected = leaves.filter((l) => l.status === "Rejected");

  useEffect(() => {
    loadLeaves();
  }, []);

  async function loadLeaves() {
    const data = await fetch("/api/leave-requests").then((r) => r.json());
    setLeaves(Array.isArray(data) ? data : []);
  }

  async function approveLeave(id: string) {
    if (!confirm("Approve this leave request?")) return;

    const res = await fetch(`/api/leave-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Approved" }),
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Failed to approve leave");
      return;
    }

    await loadLeaves();
    alert("Leave approved and balance updated.");
  }

  async function rejectLeave(id: string) {
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    const res = await fetch(`/api/leave-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Rejected", rejection_reason: reason }),
    });

    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Failed to reject leave");
      return;
    }

    await loadLeaves();
    alert("Leave rejected.");
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar active="Leave Requests" />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Leave Requests</h1>
        <p className="text-gray-500 mb-8">Review, approve, or reject employee leave applications.</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Pending Requests" value={pending.length} />
          <Kpi title="Approved Requests" value={approved.length} />
          <Kpi title="Rejected Requests" value={rejected.length} />
          <Kpi title="Total Requests" value={leaves.length} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Pending Leave Applications</h2>
          <LeaveTable leaves={pending} showActions approveLeave={approveLeave} rejectLeave={rejectLeave} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Leave History</h2>
          <LeaveTable leaves={[...approved, ...rejected]} />
        </section>
      </main>
    </div>
  );
}

function LeaveTable({ leaves, showActions = false, approveLeave, rejectLeave }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] w-full text-sm">
        <thead>
          <tr className="bg-[#d2b241] text-white">
            <th className="p-3 text-left">Employee</th>
            <th className="p-3 text-left">Department</th>
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
          {leaves.length ? leaves.map((l: any) => {
            const e = l.employees || {};
            const name = `${e.first_name || ""} ${e.middle_name || ""} ${e.last_name || ""}`.replace(/\s+/g, " ").trim();

            return (
              <tr key={l.id} className="border-b">
                <td className="p-3 font-semibold">{name || "-"}</td>
                <td className="p-3">{e.department || "-"}</td>
                <td className="p-3">{l.leave_type}</td>
                <td className="p-3">{l.start_date}</td>
                <td className="p-3">{l.end_date}</td>
                <td className="p-3">{l.total_days}</td>
                <td className="p-3">{l.reason || "-"}</td>
                <td className="p-3">{e.balance_leaves ?? "-"}</td>
                <td className="p-3"><StatusBadge status={l.status} /></td>
                {showActions && (
                  <td className="p-3">
                    <button onClick={() => approveLeave(l.id)} className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold mr-2">Approve</button>
                    <button onClick={() => rejectLeave(l.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">Reject</button>
                  </td>
                )}
              </tr>
            );
          }) : (
            <tr><td colSpan={showActions ? 10 : 9} className="p-6 text-center text-gray-500">No leave requests found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Approved" ? "bg-green-100 text-green-700" :
    status === "Rejected" ? "bg-red-100 text-red-700" :
    "bg-yellow-100 text-yellow-700";

  return <span className={`${cls} px-3 py-1 rounded-full font-semibold`}>{status}</span>;
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center"><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function Sidebar({ active }: { active: string }) {
  const items = [["Dashboard","/dashboard"],["Employees","/employees"],["Leave Requests","/leave-requests"],["Document Expiry","/document-expiry"],["Reports","/reports"]];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <div className="bg-white rounded-xl p-2 mb-10 inline-block"><img src="/icde-logo.png" alt="ICDE Logo" className="w-28 h-auto" /></div>
        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a key={name} href={href} className={`block px-4 py-3 rounded-xl ${active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"}`}>{name}</a>
          ))}
        </nav>
      </div>
      <a href="/login" className="block text-center w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</a>
    </aside>
  );
}
