export default function ReportsPage() {
  const employeeSummary = [
    ["Doctors", "18", "16", "2"],
    ["Nurses", "22", "21", "1"],
    ["Front Office", "10", "10", "0"],
    ["Back Office", "12", "11", "1"],
    ["Admin", "8", "8", "0"],
    ["House Keeping", "15", "14", "1"],
  ];

  const leaveSummary = [
    ["Pending Leave Requests", "2"],
    ["Employees On Leave", "3"],
    ["Approved This Month", "5"],
    ["Rejected Requests", "1"],
  ];

  const documentSummary = [
    ["Expiring in 30 Days", "1"],
    ["Expiring in 60 Days", "2"],
    ["Expiring in 90 Days", "4"],
    ["Expired Documents", "0"],
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
            <a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a>
            <a href="/reports" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Reports</a>
          </nav>
        </div>

        <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Reports</h1>
        <p className="text-gray-500 mb-8">HR summaries for employees, leave, and document expiry</p>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Kpi title="Total Employees" value="85" />
          <Kpi title="Active Employees" value="82" />
          <Kpi title="Employees On Leave" value="3" />
          <Kpi title="Documents Expiring" value="4" />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <ReportCard title="Employee Summary by Department">
            <Table headers={["Department", "Total", "Active", "On Leave"]} rows={employeeSummary} />
          </ReportCard>

          <ReportCard title="Leave Summary">
            <Table headers={["Description", "Count"]} rows={leaveSummary} />
          </ReportCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ReportCard title="Document Expiry Summary">
            <Table headers={["Category", "Count"]} rows={documentSummary} />
          </ReportCard>

          <ReportCard title="Export Reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ExportButton title="Employee Report" />
              <ExportButton title="Leave Report" />
              <ExportButton title="Document Expiry Report" />
              <ExportButton title="Full HR Summary" />
            </div>
          </ReportCard>
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

function ReportCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#3f4447] text-white">
            {headers.map((h) => (
              <th key={h} className="p-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-[#f7f4ec]">
              {row.map((cell, j) => (
                <td key={j} className="p-3 font-medium">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExportButton({ title }: { title: string }) {
  return (
    <button className="bg-[#f7f4ec] border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md transition-all">
      <p className="font-bold text-[#3f4447]">{title}</p>
      <p className="text-sm text-gray-500 mt-1">Export / Download</p>
    </button>
  );
}
