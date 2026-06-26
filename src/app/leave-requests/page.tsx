"use client";

import { useState } from "react";

export default function LeaveRequestsPage() {
  const [rejectModal, setRejectModal] = useState<string | null>(null);

  const pendingRequests = [
    ["Dr. Ahmad Khan", "Doctors", "Annual Leave", "10 Jul 2026", "20 Jul 2026", "10 Days", "24 Days", "Vacation", "Pending"],
    ["Nurse Maria", "Nurses", "Sick Leave", "02 Aug 2026", "04 Aug 2026", "3 Days", "18 Days", "Medical Rest", "Pending"],
  ];

  const history = [
    ["Fatima Ali", "Front Office", "Annual Leave", "01 May 2026", "06 May 2026", "6 Days", "Completed"],
    ["John Peter", "Back Office", "Emergency Leave", "10 Apr 2026", "11 Apr 2026", "2 Days", "Rejected"],
  ];

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
        <div>
          <div className="text-3xl font-bold tracking-widest mb-10">
            IC<span className="text-[#d2b241]">D</span>E
          </div>

          <nav className="space-y-3">
            <a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a>
            <a href="/employees" className="block px-4 py-3 rounded-xl hover:bg-white/10">Employees</a>
            <a href="/leave-requests" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Leave Requests</a>
            <a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a>
            <a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a>
          </nav>
        </div>

        <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Leave Requests</h1>
        <p className="text-gray-500 mb-8">Review, approve, or reject employee leave applications</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Pending Requests" value="2" />
          <Kpi title="Approved This Month" value="5" />
          <Kpi title="Employees On Leave" value="3" />
          <Kpi title="Rejected Requests" value="1" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Pending Leave Applications</h2>

          <div className="w-full overflow-x-auto">
            <table className="min-w-[1150px] text-sm">
              <thead>
                <tr className="bg-[#3f4447] text-white">
                  {["Employee", "Department", "Leave Type", "From", "To", "Duration", "Balance Leaves", "Reason", "Status", "Action"].map((h) => (
                    <th key={h} className="p-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((r) => (
                  <tr key={r[0]} className="border-b hover:bg-[#f7f4ec]">
                    {r.map((cell, index) => (
                      <td key={index} className="p-3 font-medium whitespace-nowrap">
                        {index === 6 ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">{cell}</span>
                        ) : cell === "Pending" ? (
                          <span className="bg-[#d2b241]/20 text-[#8a721e] px-3 py-1 rounded-full font-semibold">Pending</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => alert("Leave approved. Staff notification will be sent.")}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectModal(r[0])}
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold text-[#3f4447] mb-2">Reject Leave Request</h2>
            <p className="text-gray-500 mb-5">
              Please enter the reason for rejecting leave request of <b>{rejectModal}</b>.
            </p>

            <label className="text-sm font-semibold text-gray-600">Reason for Rejection</label>
            <textarea
              className="mt-2 w-full border rounded-xl px-4 py-3 outline-none"
              rows={4}
              placeholder="Enter reason here..."
            />

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setRejectModal(null)} className="px-5 py-3 rounded-xl border font-semibold">
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("Leave rejected. Reason will be sent to staff notification.");
                  setRejectModal(null);
                }}
                className="px-5 py-3 rounded-xl bg-red-100 text-red-700 font-semibold"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </div>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#3f4447] text-white">
            {headers.map((h) => (
              <th key={h} className="p-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-[#f7f4ec]">
              {row.map((cell, j) => (
                <td key={j} className="p-3 font-medium">
                  {cell === "Completed" ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">{cell}</span>
                  ) : cell === "Rejected" ? (
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">{cell}</span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
