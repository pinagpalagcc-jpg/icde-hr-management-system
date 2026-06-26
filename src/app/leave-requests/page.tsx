export default function LeaveRequestsPage() {
  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar active="Leave Requests" />
      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Leave Requests</h1>
        <p className="text-gray-500 mb-8">Live leave request module will connect after leave table setup</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Pending Requests" value="0" />
          <Kpi title="Approved This Month" value="0" />
          <Kpi title="Employees On Leave" value="0" />
          <Kpi title="Rejected Requests" value="0" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Pending Leave Applications</h2>
          <p className="text-gray-500 text-center py-10">No leave requests yet.</p>
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
  return <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between"><div><div className="text-3xl font-bold tracking-widest mb-10">IC<span className="text-[#d2b241]">D</span>E</div><nav className="space-y-3">{items.map(([n,h])=><a key={n} href={h} className={`block px-4 py-3 rounded-xl ${active===n?"bg-[#d2b241] font-semibold":"hover:bg-white/10"}`}>{n}</a>)}</nav></div><button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</button></aside>;
}
