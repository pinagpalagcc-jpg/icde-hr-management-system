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
    searchParams.then((params) => {
      const id = params.employee_id || "";
      setEmployeeId(id);

      if (id) {
        loadLeaves(id);
      }
    });
  }, [searchParams]);

  async function loadLeaves(_id: string) {
    const response = await fetch(
      "/api/leave-requests",
      {
        credentials: "include",
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.error ||
          "Unable to load leave requests."
      );

      setLeaves([]);
      return;
    }

    setLeaves(
      Array.isArray(data) ? data : []
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <StaffSidebar
        active="My Leave Requests"
        employeeId={employeeId}
      />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">
          My Leave Requests
        </h1>

        <p className="text-gray-500 mb-8">
          Track your submitted and approved leave applications.
        </p>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-[1050px] w-full text-sm">
              <thead>
                <tr className="bg-[#d2b241] text-white">
                  <th className="p-3 text-left">Leave Type</th>
                  <th className="p-3 text-left">From</th>
                  <th className="p-3 text-left">To</th>
                  <th className="p-3 text-left">Days</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Period Used</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">
                    Rejection Reason
                  </th>
                </tr>
              </thead>

              <tbody>
                {leaves.length ? (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="border-b">
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

                      <td className="p-3 font-semibold">
                        {leave.status === "Approved" &&
                        leave.annual_period_year
                          ? leave.annual_period_year
                          : "-"}
                      </td>

                      <td className="p-3">
                        <StatusBadge status={leave.status} />
                      </td>

                      <td className="p-3">
                        {leave.rejection_reason || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-gray-500"
                    >
                      No leave requests submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Approved"
      ? "bg-green-100 text-green-700"
      : status === "Rejected"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`${className} px-3 py-1 rounded-full font-semibold`}
    >
      {status}
    </span>
  );
}

function StaffSidebar({
  active,
  employeeId,
}: {
  active: string;
  employeeId: string;
}) {
  const items = [
    ["Dashboard", "/staff"],
    [
      "My Profile",
      employeeId
        ? `/staff/profile/${employeeId}`
        : "/staff",
    ],
    [
      "Apply Leave",
      employeeId
        ? `/staff/apply-leave?employee_id=${employeeId}`
        : "/staff",
    ],
    [
      "My Leave Requests",
      employeeId
        ? `/staff/my-leave-requests?employee_id=${employeeId}`
        : "/staff",
    ],
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <div className="mb-10">
          <div className="text-4xl font-black tracking-widest">
            <span className="text-white">IC</span>
            <span className="text-[#d2b241]">D</span>
            <span className="text-white">E</span>
          </div>

          <div className="text-sm text-white/90 mt-3">
            HR Management Portal
          </div>

          <div className="w-24 h-[3px] bg-[#d2b241] mt-3 rounded-full" />

          <div className="text-xs text-white/60 mt-3">
            @2026 V.1.1
          </div>
        </div>

        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a
              key={name}
              href={href}
              className={`block px-4 py-3 rounded-xl ${
                active === name
                  ? "bg-[#d2b241] font-semibold"
                  : "hover:bg-white/10"
              }`}
            >
              {name}
            </a>
          ))}
        </nav>
      </div>

      <button
        onClick={() => {
          localStorage.clear();
          document.cookie =
            "icde_auth=; path=/; max-age=0";
          window.location.href = "/logout";
        }}
        className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10"
      >
        Sign Out
      </button>
    </aside>
  );
}
