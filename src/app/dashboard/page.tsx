import { departments, getEmployees, daysRemaining, fullName } from "@/lib/hr";
import { supabase } from "@/lib/supabase";

export default async function DashboardPage() {
  const employees = await getEmployees();

  const total = employees.length;
  const inactive = employees.filter((e) => (e.status || "Available") === "On Leave").length;
  const active = total - inactive;

  const deptCounts = departments.map((d) => [d, employees.filter((e) => e.department === d).length]);

  const { data: documents } = await supabase
    .from("employee_documents")
    .select("*, employees(first_name, middle_name, last_name, department)")
    .not("expiry_date", "is", null);

  const alerts = (documents || [])
    .map((doc: any) => {
      const remaining = daysRemaining(doc.expiry_date);
      return {
        employee_id: doc.employee_id,
        employee: fullName(doc.employees || {}),
        department: doc.employees?.department || "-",
        document: doc.document_name || "-",
        expiry: doc.expiry_date,
        remaining,
      };
    })
    .filter((a: any) => a.remaining !== null && a.remaining >= 0 && a.remaining <= 90)
    .sort((a: any, b: any) => a.remaining - b.remaining);

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar active="Dashboard" />

      <main className="flex-1 p-8 overflow-x-hidden">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3f4447]">Admin Dashboard</h1>
            <p className="text-gray-500">ICDE HR Management System</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Kpi title="Total Employees" value={total} />
            <Kpi title="Available Employees" value={active} />
            <Kpi title="Employees On Leave" value={inactive} />
          </div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {deptCounts.map(([name, count]) => (
            <a key={name} href={`/employees?department=${encodeURIComponent(String(name))}`} className="bg-white rounded-2xl p-4 shadow-sm border-t-4 border-[#d2b241] hover:shadow-lg hover:-translate-y-1 transition-all text-center">
              <p className="text-sm text-gray-500">{name}</p>
              <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{count}</h3>
            </a>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Pending Leave Requests" value="0" href="/leave-requests" />
          <Kpi title="Employees On Leave" value="0" href="/reports?filter=on-leave" />
          <Kpi title="Documents Expiring" value={alerts.length} href="/document-expiry" />
          <Kpi title="Annual Tickets Due" value={alerts.filter((a: any) => a.document === "Annual Ticket Due").length} href="/document-expiry?type=annual-ticket" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Upcoming Document Expiry - 90 Days Alert</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#3f4447] text-white">
                  {["Employee", "Department", "Document", "Expiry", "Remaining Days"].map((h) => <th key={h} className="p-3 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {alerts.length ? alerts.map((a: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="p-3">
                      <a href={`/employees/${a.employee_id}`} className="text-[#d2b241] font-bold">
                        {a.employee}
                      </a>
                    </td>
                    <td className="p-3">{a.department}</td>
                    <td className="p-3">{a.document}</td>
                    <td className="p-3">{a.expiry}</td>
                    <td className="p-3">
                      <span className={`${expiryBadgeClass(a.remaining)} px-3 py-1 rounded-full font-semibold`}>
                        {a.remaining} days
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-500">No upcoming document expiry alerts.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}


function expiryBadgeClass(days: number) {
  if (days <= 30) return "bg-red-100 text-red-700";
  if (days <= 60) return "bg-orange-100 text-orange-700";
  return "bg-purple-100 text-purple-700";
}

function Kpi({ title, value, href }: { title: string; value: string | number; href?: string }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center min-w-[140px]"><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function Sidebar({ active }: { active: string }) {
  const items = [["Dashboard","/dashboard"],["Employees","/employees"],["Leave Requests","/leave-requests"],["Document Expiry","/document-expiry"],["Reports","/reports"]];
  return <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between"><div>
        
      <div className="mb-10">
        <div className="text-4xl font-black tracking-widest">
          <span className="text-white">IC</span><span className="text-[#d2b241]">D</span><span className="text-white">E</span>
        </div>
        <div className="text-sm text-white/90 mt-3">HR Management Portal</div>
        <div className="w-24 h-[3px] bg-[#d2b241] mt-3 rounded-full"></div>
        <div className="text-xs text-white/60 mt-3">@2026 V.1.1</div>
      </div>
      <nav className="space-y-3">{items.map(([n,h])=><a key={n} href={h} className={`block px-4 py-3 rounded-xl ${active===n?"bg-[#d2b241] font-semibold":"hover:bg-white/10"}`}>{n}</a>)}</nav></div><a href="/login" className="block text-center w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</a></aside>;
}
