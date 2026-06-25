import {
  Users,
  UserRound,
  BriefcaseBusiness,
  ClipboardList,
  CalendarDays,
  FileWarning,
  Home,
  LogOut
} from "lucide-react";

const departments = [
  { name: "Doctors", count: 18 },
  { name: "Nurses", count: 22 },
  { name: "Front Office", count: 10 },
  { name: "Back Office", count: 12 },
  { name: "Admin", count: 8 },
  { name: "House Keeping", count: 15 }
];

const expiry = [
  { name: "Dr. Ahmad Khan", department: "Doctors", document: "Medical License", expiry: "2026-07-20", days: 25 },
  { name: "Nurse Maria", department: "Nurses", document: "Emirates ID", expiry: "2026-08-05", days: 41 },
  { name: "Fatima Ali", department: "Front Office", document: "Employment Contract", expiry: "2026-08-30", days: 66 }
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <aside className="w-72 bg-[#3f4447] text-white p-6 hidden md:block">
        <div className="text-3xl font-bold tracking-widest mb-10">
          IC<span className="text-[#d2b241]">D</span>E
        </div>

        <div className="flex flex-col h-[calc(100vh-120px)] justify-between">
          <nav className="space-y-3">
            <MenuItem icon={<Home size={18} />} label="Dashboard" active />
            <MenuItem icon={<Users size={18} />} label="Employees" />
            <MenuItem icon={<CalendarDays size={18} />} label="Leave Requests" />
            <MenuItem icon={<FileWarning size={18} />} label="Document Expiry" />
            <MenuItem icon={<ClipboardList size={18} />} label="Reports" />
          </nav>

          <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3f4447]">Admin Dashboard</h1>
            <p className="text-gray-500">ICDE HR Management System</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <TopStat title="Total Employees" value="85" />
            <TopStat title="Active Employees" value="82" />
            <TopStat title="Inactive Employees" value="3" />
          </div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {departments.map((d) => (
            <DepartmentCard key={d.name} title={d.name} value={String(d.count)} />
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MiniCard title="Pending Leave Requests" value="4" />
          <MiniCard title="Employees On Leave" value="3" />
          <MiniCard title="Documents Expiring" value="12" />
          <MiniCard title="Annual Tickets Due" value="5" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-4">Upcoming Document Expiry - 90 Days Alert</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#3f4447] text-white">
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">Document</th>
                  <th className="p-3 text-left">Expiry</th>
                  <th className="p-3 text-left">Remaining Days</th>
                  <th className="p-3 text-left">Preview</th>
                </tr>
              </thead>
              <tbody>
                {expiry.map((e) => (
                  <tr key={e.name} className="border-b hover:bg-[#f7f4ec]">
                    <td className="p-3 font-semibold text-[#3f4447]">{e.name}</td>
                    <td className="p-3">{e.department}</td>
                    <td className="p-3">{e.document}</td>
                    <td className="p-3">{e.expiry}</td>
                    <td className="p-3">
                      <span className="bg-[#d2b241]/20 text-[#8a721e] px-3 py-1 rounded-full font-semibold">
                        {e.days} days
                      </span>
                    </td>
                    <td className="p-3">
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

function MenuItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${active ? "bg-[#d2b241] text-white" : "hover:bg-white/10"}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function TopStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-t-4 border-[#d2b241] text-center min-w-36">
      <p className="text-gray-500 text-xs font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </div>
  );
}

function DepartmentCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border-t-4 border-[#d2b241] cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all text-center">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-[#d2b241]">
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </div>
  );
}
