"use client";

import { useEffect, useState } from "react";

export default function MyLeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ employee_id?: string }>;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    searchParams.then((p) => {
      const id = p.employee_id || "";
      setEmployeeId(id);
      if (id) loadLeaves(id);
    });
  }, [searchParams]);

  async function loadLeaves(id: string) {
    const all = await fetch("/api/leave-requests").then((r) => r.json());
    setLeaves((all || []).filter((l: any) => l.employee_id === id));
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <StaffSidebar active="My Leave Requests" employeeId={employeeId} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">My Leave Requests</h1>
        <p className="text-gray-500 mb-8">Track your submitted leave applications.</p>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#d2b241] text-white">
                <th className="p-3 text-left">Leave Type</th>
                <th className="p-3 text-left">From</th>
                <th className="p-3 text-left">To</th>
                <th className="p-3 text-left">Days</th>
                <th className="p-3 text-left">Reason</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length ? leaves.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="p-3">{l.leave_type}</td>
                  <td className="p-3">{l.start_date}</td>
                  <td className="p-3">{l.end_date}</td>
                  <td className="p-3">{l.total_days}</td>
                  <td className="p-3">{l.reason || "-"}</td>
                  <td className="p-3"><StatusBadge status={l.status} /></td>
                  <td className="p-3">{l.rejection_reason || "-"}</td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="p-6 text-center text-gray-500">No leave requests submitted yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
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

function StaffSidebar({ active, employeeId }: { active: string; employeeId: string }) {
  const items = [
    ["Dashboard", "/staff"],
    ["My Profile", employeeId ? `/staff/profile/${employeeId}` : "/staff"],
    ["Apply Leave", employeeId ? `/staff/apply-leave?employee_id=${employeeId}` : "/staff"],
    ["My Leave Requests", employeeId ? `/staff/my-leave-requests?employee_id=${employeeId}` : "/staff"],
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <img src="/icde-logo.png" alt="ICDE Logo" className="w-24 mb-10" />
        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a key={name} href={href} className={`block px-4 py-3 rounded-xl ${active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"}`}>{name}</a>
          ))}
        </nav>
      </div>
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
        className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10"
      >
        Sign Out
      </button>
    </aside>
  );
}
