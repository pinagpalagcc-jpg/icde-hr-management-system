"use client";

import { useEffect, useState } from "react";

import StaffSidebar from "@/components/StaffSidebar";
export default function MyLeaveRequestsPage() {
  const [employeeId, setEmployeeId] = useState("");
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    async function initializePage() {
      try {
        const sessionResponse = await fetch(
          "/api/auth/session",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!sessionResponse.ok) {
          window.location.href = "/logout";
          return;
        }

        const session = await sessionResponse.json();

        const id =
          session.userId ||
          session.user?.userId ||
          "";

        if (!id || session.role !== "Staff") {
          window.location.href = "/logout";
          return;
        }

        setEmployeeId(id);
        await loadLeaves();
      } catch {
        alert(
          "Unable to verify your secure session."
        );
      }
    }

    initializePage();
  }, []);

  async function loadLeaves() {
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
