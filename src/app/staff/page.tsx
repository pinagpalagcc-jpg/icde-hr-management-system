"use client";

import { useEffect, useState } from "react";

export default function StaffDashboardPage() {
  const [employee, setEmployee] = useState<any>(null);
  const [expiryAlerts, setExpiryAlerts] = useState<any[]>([]);

  useEffect(() => {
    const id = localStorage.getItem("icde_user_id");
    const role = localStorage.getItem("icde_user_role");

    if (!id || role !== "Staff") {
      window.location.href = "/login";
      return;
    }

    loadStaff(id);
  }, []);

  async function loadStaff(id: string) {
    const emp = await fetch(`/api/employees/${id}`).then((r) => r.json());
    setEmployee(emp);

    const docs = await fetch(`/api/employee-documents?employee_id=${id}`).then((r) => r.json());

    const alerts = (docs || [])
      .filter((d: any) => d.expiry_date)
      .map((d: any) => {
        const days = daysRemaining(d.expiry_date);
        return { ...d, remaining: days };
      })
      .filter((d: any) => d.remaining >= 0 && d.remaining <= 90)
      .sort((a: any, b: any) => a.remaining - b.remaining);

    setExpiryAlerts(alerts);
  }

  if (!employee) return <div className="p-10">Loading Staff Dashboard...</div>;

  const name = `${employee.first_name || ""} ${employee.middle_name || ""} ${employee.last_name || ""}`.replace(/\s+/g, " ").trim();

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <StaffSidebar active="Dashboard" employeeId={employee.id} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Staff Dashboard</h1>
        <p className="text-gray-500 mb-8">Welcome, {name}</p>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Kpi title="Total Leaves" value={`${employee.total_leaves || 30} Days`} />
          <Kpi title="Leaves Used" value={`${employee.leaves_used || 0} Days`} />
          <Kpi title="Balance Leaves" value={`${employee.balance_leaves || 30} Days`} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Upcoming My Document Expiry - 90 Days Alert</h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#d2b241] text-white">
                <th className="p-3 text-left">Document</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Expiry Date</th>
                <th className="p-3 text-left">Remaining Days</th>
              </tr>
            </thead>
            <tbody>
              {expiryAlerts.length ? expiryAlerts.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-3 font-semibold">{d.document_name}</td>
                  <td className="p-3">{d.category}</td>
                  <td className="p-3">{d.expiry_date}</td>
                  <td className="p-3"><span className={`${expiryBadgeClass(d.remaining)} px-3 py-1 rounded-full font-semibold`}>{d.remaining} days</span></td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No upcoming document expiry alerts.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function daysRemaining(dateValue: string) {
  const today = new Date();
  const expiry = new Date(dateValue);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function expiryBadgeClass(days: number) {
  if (days <= 30) return "bg-red-100 text-red-700";
  if (days <= 60) return "bg-orange-100 text-orange-700";
  return "bg-purple-100 text-purple-700";
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center"><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function StaffSidebar({ active, employeeId }: { active: string; employeeId: string }) {
  const items = [
    ["Dashboard", "/staff"],
    ["My Profile", `/staff/profile/${employeeId}`],
    ["Apply Leave", `/staff/apply-leave?employee_id=${employeeId}`],
    ["My Leave Requests", `/staff/my-leave-requests?employee_id=${employeeId}`],
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        
        
        <div className="mb-10 flex justify-center"></div>
        <div className="mb-10 flex justify-center">
          <div className="relative w-40 h-16 flex items-center justify-center">
            <div className="text-5xl font-black tracking-widest text-[#6b7780] leading-none">ICDE</div>
            <div className="absolute bottom-3 left-[58px] w-14 h-6 border-b-[10px] border-[#d2b241] rounded-b-full"></div>
          </div>
        </div>
        <div className="mb-10 text-center">
        <div className="text-5xl font-serif tracking-widest font-bold leading-none">
          <span className="text-white">IC</span><span className="text-[#d2b241]">D</span><span className="text-white">E</span>
        </div>
        <div className="w-32 h-[3px] bg-[#d2b241] mx-auto mt-3 rounded-full"></div>
        <div className="text-[11px] tracking-[0.25em] text-white/80 mt-3">HR MANAGEMENT SYSTEM</div>
      </div>
      <nav className="space-y-3">{items.map(([name, href]) => <a key={name} href={href} className={`block px-4 py-3 rounded-xl ${active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"}`}>{name}</a>)}</nav>
      </div>
      <button onClick={() => { localStorage.clear(); window.location.href="/login"; }} className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</button>
    </aside>
  );
}
