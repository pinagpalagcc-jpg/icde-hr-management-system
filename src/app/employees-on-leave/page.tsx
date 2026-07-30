export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getEmployees } from "@/lib/hr";
import { supabase } from "@/lib/supabase";

export default async function EmployeesOnLeavePage() {
  const employees = await getEmployees();

  const today = new Date().toISOString().slice(0, 10);

  const { data: activeLeaves } = await supabase
    .from("leave_requests")
    .select(`
      employee_id,
      leave_type,
      start_date,
      end_date
    `)
    .eq("status", "Approved")
    .lte("start_date", today)
    .gte("end_date", today);

  const leaveRows =
    (activeLeaves || []).map((leave: any) => {
      const employee = employees.find(
        (e: any) => e.id === leave.employee_id
      );

      if (!employee) return null;

      const employeeName = `${employee.first_name || ""} ${employee.middle_name || ""} ${employee.last_name || ""}`
        .replace(/\s+/g, " ")
        .trim();

      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);

      const days =
        Math.floor(
          (end.getTime() - start.getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      return {
        id: employee.id,
        employeeCode: employee.employee_code,
        name: employeeName,
        department: employee.department,
        leaveType: leave.leave_type,
        startDate: leave.start_date,
        endDate: leave.end_date,
        days,
      };
    }).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar active="Employees On Leave" />

      <main className="flex-1 p-8 overflow-x-hidden">

        <h1 className="text-3xl font-bold text-[#3f4447]">
          Employees On Leave
        </h1>

        <p className="text-gray-500 mb-8">
          Currently approved employee leave records
        </p>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          <div className="overflow-x-auto">

            <table className="min-w-[1100px] w-full text-sm">

              <thead>

                <tr className="bg-[#3f4447] text-white">

                  <th className="p-3 text-left">Employee ID</th>

                  <th className="p-3 text-left">Name</th>

                  <th className="p-3 text-left">Department</th>

                  <th className="p-3 text-left">Leave Type</th>

                  <th className="p-3 text-left">Start Date</th>

                  <th className="p-3 text-left">End Date</th>

                  <th className="p-3 text-left">Days</th>

                </tr>

              </thead>

              <tbody>
                                {leaveRows.length ? (
                  leaveRows.map((row: any) => (
                    <tr
                      key={row.id}
                      className="border-b hover:bg-[#f7f4ec]"
                    >
                      <td className="p-3 font-semibold">
                        {row.employeeCode}
                      </td>

                      <td className="p-3">
                        <a
                          href={`/employees/${row.id}`}
                          className="text-[#d2b241] font-bold"
                        >
                          {row.name}
                        </a>
                      </td>

                      <td className="p-3">
                        {row.department}
                      </td>

                      <td className="p-3">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                          {row.leaveType}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {row.startDate}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {row.endDate}
                      </td>

                      <td className="p-3 font-bold">
                        {row.days}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-gray-500"
                    >
                      No employees are currently on leave.
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

function Sidebar({ active }: { active: string }) {
  const items = [
    ["Dashboard", "/dashboard"],
    ["Employees", "/employees"],
    ["Messenger", "/messenger"],
    ["Leave Requests", "/leave-requests"],
    ["Document Expiry", "/document-expiry"],
    ["Reports", "/reports"],
    ["HR AI Assistant", "/hr-ai-assistant"],
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

          <div className="w-24 h-[3px] bg-[#d2b241] mt-3 rounded-full"></div>

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

      <a
        href="/login"
        className="block text-center w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10"
      >
        Sign Out
      </a>
    </aside>
  );
}
    