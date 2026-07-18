export const dynamic = "force-dynamic";
export const revalidate = 0;

import { departments, getEmployees, daysRemaining, fullName, getActiveLeaveEmployeeIds, displayStatus } from "@/lib/hr";
import { supabase } from "@/lib/supabase";
import DocumentExpiryAccordion from "@/components/DocumentExpiryAccordion";

export default async function DashboardPage() {
  const employees = await getEmployees();
  const activeLeaveIds = await getActiveLeaveEmployeeIds();

  const { data: leaves } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("status", "Pending");

  const onLeaveIds = new Set(activeLeaveIds);

  const total = employees.length;
  const inactive = employees.filter((e: any) => onLeaveIds.has(e.id)).length;
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
        department:
          doc.employees?.department || "-",
        document: doc.document_name || "-",
        category: doc.category || "Personal Documents",
        expiry: doc.expiry_date,
        remaining,
      };
    })
    .filter(
      (alert: any) =>
        alert.remaining !== null &&
        alert.remaining <= 90
    )
    .sort(
      (first: any, second: any) =>
        first.remaining - second.remaining
    );

  const groupedAlerts = Object.values(
    alerts.reduce(
      (groups: Record<string, any>, alert: any) => {
        if (!groups[alert.employee_id]) {
          groups[alert.employee_id] = {
            employee_id: alert.employee_id,
            employee: alert.employee,
            department: alert.department,
            nearestExpiry: alert.expiry,
            nearestRemaining: alert.remaining,
            documents: [],
          };
        }

        groups[alert.employee_id].documents.push(
          alert
        );

        if (
          alert.remaining <
          groups[alert.employee_id].nearestRemaining
        ) {
          groups[alert.employee_id].nearestRemaining =
            alert.remaining;

          groups[alert.employee_id].nearestExpiry =
            alert.expiry;
        }

        return groups;
      },
      {}
    )
  ).sort(
    (first: any, second: any) =>
      first.nearestRemaining -
      second.nearestRemaining
  );

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
            <Kpi title="Total Employees" value={total} href="/employees?view=all" />
            <Kpi title="Available Employees" value={active} href="/employees?status=Available" />
            <Kpi title="Employees On Leave" value={inactive} href="/employees?status=On%20Leave" />
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
          <Kpi title="Pending Leave Requests" value={(leaves || []).length} href="/leave-requests" />
          <Kpi title="Employees On Leave" value={inactive} href="/employees?status=On%20Leave" />
          <Kpi title="Documents Expiring" value={alerts.length} href="/document-expiry" />
          <Kpi title="Annual Tickets Due" value={employees.filter((e: any) => daysRemaining(e.annual_ticket_due) !== null && daysRemaining(e.annual_ticket_due)! >= 0 && daysRemaining(e.annual_ticket_due)! <= 90).length} href="/document-expiry?type=annual-ticket" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-[#3f4447]">
              Upcoming Document Expiry - 90 Days Alert
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Click an employee to view all expiring documents.
            </p>
          </div>

          <DocumentExpiryAccordion
            groups={groupedAlerts as any[]}
          />
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

function Kpi({
  title,
  value,
  href,
}: {
  title: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center min-w-[140px] hover:shadow-lg hover:-translate-y-1 transition-all"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center min-w-[140px]">
      {content}
    </div>
  );
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
