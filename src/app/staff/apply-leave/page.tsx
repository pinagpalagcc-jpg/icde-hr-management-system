"use client";

import { useEffect, useState } from "react";

export default function ApplyLeavePage() {
  const [employeeId, setEmployeeId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    leave_type: "Annual Leave",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("employee_id") || localStorage.getItem("authUser") || "";

    setEmployeeId(id);

    if (!id) {
      setLoading(false);
      return;
    }

    fetch(`/api/employees/${id}`)
      .then((r) => r.json())
      .then((data) => setEmployee(data))
      .catch(() => setEmployee(null))
      .finally(() => setLoading(false));
  }, []);

  function totalDays() {
    if (!form.start_date || !form.end_date) return 0;
    const start = new Date(form.start_date);
    const end = new Date(form.end_date);
    return Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 0);
  }

  async function submitLeave() {
    const days = totalDays();

    if (!employeeId) {
      alert("Employee not selected. Please login again.");
      return;
    }

    if (!form.start_date || !form.end_date || days <= 0) {
      alert("Please select valid leave dates.");
      return;
    }

    if (days > Number(employee?.balance_leaves || 0)) {
      alert("Leave days cannot exceed balance leaves.");
      return;
    }

    const res = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: employeeId,
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        total_days: days,
        reason: form.reason,
        status: "Pending",
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to submit leave request");
      return;
    }

    setForm({ leave_type: "Annual Leave", start_date: "", end_date: "", reason: "" });
    alert("Leave request submitted to Admin for approval.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] flex">
        <StaffSidebar active="Apply Leave" employeeId={employeeId} />
        <main className="flex-1 p-8">Loading...</main>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] flex">
        <StaffSidebar active="Apply Leave" employeeId={employeeId} />
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">Apply Leave</h1>
          <p className="text-red-600 mt-4">Employee profile not found. Please login again.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <StaffSidebar active="Apply Leave" employeeId={employeeId} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Apply Leave</h1>
        <p className="text-gray-500 mb-8">Submit leave request for Admin approval.</p>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Kpi title="Total Leaves" value={`${employee.total_leaves || 30} Days`} />
          <Kpi title="Leaves Used" value={`${employee.leaves_used || 0} Days`} />
          <Kpi title="Balance Leaves" value={`${employee.balance_leaves || 30} Days`} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Leave Application Form</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select label="Leave Type" value={form.leave_type} options={["Annual Leave", "Sick Leave", "Emergency Leave", "Unpaid Leave"]} onChange={(v: string) => setForm({ ...form, leave_type: v })} />
            <Input label="Reason" value={form.reason} onChange={(v: string) => setForm({ ...form, reason: v })} />
            <Input label="From Date" type="date" value={form.start_date} onChange={(v: string) => setForm({ ...form, start_date: v })} />
            <Input label="To Date" type="date" value={form.end_date} onChange={(v: string) => setForm({ ...form, end_date: v })} />
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-gray-500">Selected leave days: <b>{totalDays()}</b></p>
            <button onClick={submitLeave} className="bg-[#d2b241] text-white px-6 py-3 rounded-xl font-semibold">Submit Leave</button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string | number }) {
  return <div className="bg-white rounded-2xl shadow-sm border-t-4 border-[#d2b241] p-6 text-center"><p className="text-gray-500">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function Input({ label, value, onChange, type = "text" }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" /></div>;
}

function Select({ label, value, options, onChange }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><select value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white">{options.map((o: string) => <option key={o}>{o}</option>)}</select></div>;
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
        <div className="mb-10">
          <div className="text-4xl font-black tracking-widest">
            <span className="text-white">IC</span><span className="text-[#d2b241]">D</span><span className="text-white">E</span>
          </div>
          <div className="text-sm text-white/90 mt-3">HR Management Portal</div>
          <div className="w-24 h-[3px] bg-[#d2b241] mt-3 rounded-full"></div>
          <div className="text-xs text-white/60 mt-3">@2026 V.1.1</div>
        </div>

        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a key={name} href={href} className={`block px-4 py-3 rounded-xl ${active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"}`}>{name}</a>
          ))}
        </nav>
      </div>

      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/login";
        }}
        className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10"
      >
        Sign Out
      </button>
    </aside>
  );
}
