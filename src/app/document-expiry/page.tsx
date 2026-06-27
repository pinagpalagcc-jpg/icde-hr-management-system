import { getEmployees, daysRemaining, fullName } from "@/lib/hr";

export default async function DocumentExpiryPage() {
  const employees = await getEmployees();

  const alerts = employees.flatMap((e) => {
    const rows = [];
    const contractDays = daysRemaining(e.contract_end_date);
    const ticketDays = daysRemaining(e.annual_ticket_due);

    if (contractDays !== null && contractDays >= 0 && contractDays <= 90) rows.push([fullName(e), e.department || "-", "Contract End", e.contract_end_date, `${contractDays} Days`]);
    if (ticketDays !== null && ticketDays >= 0 && ticketDays <= 90) rows.push([fullName(e), e.department || "-", "Annual Ticket Due", e.annual_ticket_due, `${ticketDays} Days`]);

    return rows;
  });

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar active="Document Expiry" />
      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Document Expiry</h1>
        <p className="text-gray-500 mb-8">Live alerts from employee contract and annual ticket dates</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Expiring in 30 Days" value={alerts.filter((a) => parseInt(a[4]) <= 30).length} />
          <Kpi title="Expiring in 60 Days" value={alerts.filter((a) => parseInt(a[4]) <= 60).length} />
          <Kpi title="Expiring in 90 Days" value={alerts.length} />
          <Kpi title="Expired Documents" value="0" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Upcoming Document Expiry Alerts</h2>
          <table className="w-full text-sm">
            <thead><tr className="bg-[#3f4447] text-white">{["Employee","Department","Document","Expiry Date","Remaining Days"].map((h)=><th key={h} className="p-3 text-left">{h}</th>)}</tr></thead>
            <tbody>
              {alerts.length ? alerts.map((r,i)=><tr key={i} className="border-b">{r.map((c)=><td key={c} className="p-3">{c}</td>)}</tr>) : <tr><td colSpan={5} className="p-6 text-center text-gray-500">No document expiry alerts.</td></tr>}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center"><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function Sidebar({ active }: { active: string }) {
  const items = [["Dashboard","/dashboard"],["Employees","/employees"],["Leave Requests","/leave-requests"],["Document Expiry","/document-expiry"],["Reports","/reports"]];
  return <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between"><div><img src="/icde-logo.png" alt="ICDE Logo" className="w-24 mb-10" /><nav className="space-y-3">{items.map(([n,h])=><a key={n} href={h} className={`block px-4 py-3 rounded-xl ${active===n?"bg-[#d2b241] font-semibold":"hover:bg-white/10"}`}>{n}</a>)}</nav></div><a href="/login" className="block text-center w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</a></aside>;
}
