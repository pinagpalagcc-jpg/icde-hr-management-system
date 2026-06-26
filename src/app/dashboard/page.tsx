import { departments, getEmployees, daysRemaining, fullName } from "@/lib/hr";

export default async function DashboardPage() {
  const employees = await getEmployees();

  const total = employees.length;
  const inactive = employees.filter((e) => e.status === "Inactive").length;
  const active = total - inactive;

  const deptCounts = departments.map((d) => [d, employees.filter((e) => e.department === d).length]);

  const alerts = employees.flatMap((e) => {
    const rows = [];
    const contractDays = daysRemaining(e.contract_end_date);
    const ticketDays = daysRemaining(e.annual_ticket_due);

    if (contractDays !== null && contractDays >= 0 && contractDays <= 90) {
      rows.push([fullName(e), e.department || "-", "Contract End", e.contract_end_date, `${contractDays} days`]);
    }

    if (ticketDays !== null && ticketDays >= 0 && ticketDays <= 90) {
      rows.push([fullName(e), e.department || "-", "Annual Ticket Due", e.annual_ticket_due, `${ticketDays} days`]);
    }

    return rows;
  });

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
            <Kpi title="Active Employees" value={active} />
            <Kpi title="Inactive Employees" value={inactive} />
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
          <Kpi title="Pending Leave Requests" value="0" />
          <Kpi title="Employees On Leave" value="0" />
          <Kpi title="Documents Expiring" value={alerts.length} />
          <Kpi title="Annual Tickets Due" value={alerts.filter((a) => a[2] === "Annual Ticket Due").length} />
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
                {alerts.length ? alerts.map((r, i) => (
                  <tr key={i} className="border-b">
                    {r.map((c) => <td key={c} className="p-3">{c}</td>)}
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

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center min-w-[140px]"><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function Sidebar({ active }: { active: string }) {
  const items = [["Dashboard","/dashboard"],["Employees","/employees"],["Leave Requests","/leave-requests"],["Document Expiry","/document-expiry"],["Reports","/reports"]];
  return <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between"><div><div className="text-3xl font-bold tracking-widest mb-10">IC<span className="text-[#d2b241]">D</span>E</div><nav className="space-y-3">{items.map(([n,h])=><a key={n} href={h} className={`block px-4 py-3 rounded-xl ${active===n?"bg-[#d2b241] font-semibold":"hover:bg-white/10"}`}>{n}</a>)}</nav></div><button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</button></aside>;
}
