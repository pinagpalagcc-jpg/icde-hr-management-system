export default function DocumentExpiryPage() {
  const documents = [
    ["Dr. Ahmad Khan", "Doctors", "Medical License", "Degrees & Certificates", "20 Jul 2026", "25 Days", "Critical"],
    ["Nurse Maria", "Nurses", "Labour Card", "Immigration Documents", "10 Aug 2026", "46 Days", "Warning"],
    ["Fatima Ali", "Front Office", "Employment Contract", "Office Documents", "30 Aug 2026", "66 Days", "Upcoming"],
    ["John Peter", "Back Office", "Visa", "Immigration Documents", "05 Sep 2026", "72 Days", "Upcoming"],
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
            <a href="/leave-requests" className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a>
            <a href="/document-expiry" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Document Expiry</a>
            <a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a>
          </nav>
        </div>

        <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Document Expiry</h1>
        <p className="text-gray-500 mb-8">Track documents expiring within the next 90 days</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Expiring in 30 Days" value="1" />
          <Kpi title="Expiring in 60 Days" value="2" />
          <Kpi title="Expiring in 90 Days" value="4" />
          <Kpi title="Expired Documents" value="0" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Upcoming Document Expiry Alerts</h2>

          <div className="w-full overflow-x-auto">
            <table className="min-w-[1050px] text-sm w-full">
              <thead>
                <tr className="bg-[#3f4447] text-white">
                  {["Employee", "Department", "Document", "Category", "Expiry Date", "Remaining Days", "Priority", "Preview"].map((h) => (
                    <th key={h} className="p-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d[0] + d[2]} className="border-b hover:bg-[#f7f4ec]">
                    <td className="p-3 font-semibold whitespace-nowrap text-[#d2b241]">{d[0]}</td>
                    <td className="p-3 whitespace-nowrap">{d[1]}</td>
                    <td className="p-3 whitespace-nowrap">{d[2]}</td>
                    <td className="p-3 whitespace-nowrap">{d[3]}</td>
                    <td className="p-3 whitespace-nowrap">{d[4]}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="bg-[#d2b241]/20 text-[#8a721e] px-3 py-1 rounded-full font-semibold">{d[5]}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <PriorityBadge value={d[6]} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <button className="text-[#d2b241] font-bold">Preview</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
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

function PriorityBadge({ value }: { value: string }) {
  if (value === "Critical") {
    return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">{value}</span>;
  }

  if (value === "Warning") {
    return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-semibold">{value}</span>;
  }

  return <span className="bg-[#d2b241]/20 text-[#8a721e] px-3 py-1 rounded-full font-semibold">{value}</span>;
}
