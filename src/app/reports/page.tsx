import { departments, getEmployees } from "@/lib/hr";

export default async function ReportsPage() {
  const employees = await getEmployees();

  const total = employees.length;
  const active = employees.filter((e) => e.status !== "On Leave").length;
  const inactive = employees.filter((e) => e.status === "On Leave").length;

  const rows = departments.map((d) => {
    const dept = employees.filter((e) => e.department === d);
    return [d, String(dept.length), String(dept.filter((e) => e.status !== "On Leave").length), String(dept.filter((e) => e.status === "On Leave").length)];
  });

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar active="Reports" />
      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Reports</h1>
        <p className="text-gray-500 mb-8">Live HR summaries from Supabase</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Total Employees" value={total} />
          <Kpi title="Available Employees" value={active} />
          <Kpi title="Employees On Leave" value={inactive} />
          <Kpi title="Departments" value={departments.length} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Employee Summary by Department</h2>
          <Table headers={["Department", "Total", "Available", "On Leave"]} rows={rows} />
        </section>
      </main>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center"><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <table className="w-full text-sm"><thead><tr className="bg-[#3f4447] text-white">{headers.map((h)=><th key={h} className="p-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map((r, rowIndex)=><tr key={`${r[0]}-${rowIndex}`} className="border-b">{r.map((c, cellIndex)=><td key={`${r[0]}-${cellIndex}`} className="p-3">{c}</td>)}</tr>)}</tbody></table>;
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
