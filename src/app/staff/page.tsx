import { getEmployees, fullName, daysRemaining } from "@/lib/hr";
import { supabase } from "@/lib/supabase";

export default async function StaffDashboardPage() {
  const employees = await getEmployees();
  const employee = employees[0];

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] flex">
        <StaffSidebar active="Dashboard" employeeId="" />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">Staff Dashboard</h1>
          <p className="text-gray-500 mt-4">No employee found. Add an employee first.</p>
        </main>
      </div>
    );
  }

  const { data: docs } = await supabase
    .from("employee_documents")
    .select("*")
    .eq("employee_id", employee.id)
    .not("expiry_date", "is", null);

  const expiryAlerts = (docs || [])
    .map((d: any) => ({
      document: d.document_name,
      category: d.category,
      expiry: d.expiry_date,
      remaining: daysRemaining(d.expiry_date),
    }))
    .filter((d: any) => d.remaining !== null && d.remaining >= 0 && d.remaining <= 90)
    .sort((a: any, b: any) => a.remaining - b.remaining);

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <StaffSidebar active="Dashboard" employeeId={employee.id} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Staff Dashboard</h1>
        <p className="text-gray-500 mb-8">Welcome, {fullName(employee)}</p>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Kpi title="Total Leaves" value={`${employee.total_leaves || 30} Days`} />
          <Kpi title="Leaves Used" value={`${employee.leaves_used || 0} Days`} />
          <Kpi title="Balance Leaves" value={`${employee.balance_leaves || 30} Days`} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Upcoming My Document Expiry - 90 Days Alert</h2>

          <div className="overflow-x-auto">
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
                {expiryAlerts.length ? expiryAlerts.map((d: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="p-3 font-semibold">{d.document}</td>
                    <td className="p-3">{d.category}</td>
                    <td className="p-3">{d.expiry}</td>
                    <td className="p-3">
                      <span className={`${expiryBadgeClass(d.remaining)} px-3 py-1 rounded-full font-semibold`}>
                        {d.remaining} days
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="p-6 text-center text-gray-500">No upcoming document expiry alerts.</td></tr>
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

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center"><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function StaffSidebar({ active, employeeId }: { active: string; employeeId: string }) {
  const items = [
    ["Dashboard", "/staff"],
    ["My Profile", employeeId ? `/staff/profile/${employeeId}` : "/staff"],
    ["Apply Leave", employeeId ? `/staff/apply-leave?employee_id=${employeeId}` : "/staff"],
    ["My Leave Requests", employeeId ? `/staff/my-leave-requests?employee_id=${employeeId}` : "/staff"],
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <div className="text-3xl font-bold tracking-widest mb-10">IC<span className="text-[#d2b241]">D</span>E</div>
        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a key={name} href={href} className={`block px-4 py-3 rounded-xl ${active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"}`}>{name}</a>
          ))}
        </nav>
      </div>
      <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</button>
    </aside>
  );
}
