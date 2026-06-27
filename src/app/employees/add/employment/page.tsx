"use client";

import { useEffect, useState } from "react";

export default function EmploymentPage() {
  const [form, setForm] = useState({
    department: "",
    position: "",
    reporting_manager: "",
    employment_type: "",
    joining_date: "",
    contract_start_date: "",
    contract_end_date: "",
    annual_ticket_due: "",
    basic_salary: "",
    other_benefits: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("employee_employment");
    if (saved) setForm(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("employee_employment", JSON.stringify(form));
  }, [form]);

  function saveAndNext() {
    localStorage.setItem("employee_employment", JSON.stringify(form));
    window.location.href = "/employees/add/contact";
  }

  return (
    <PageLayout step="Step 2 of 4 — Employment Information" active="Employment">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-[#3f4447] mb-6">Employment Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Select label="Department" value={form.department} options={["Doctors", "Nurses", "Front Office", "Back Office", "Admin", "House Keeping"]} onChange={(v: string) => setForm({ ...form, department: v })} />
          <Input label="Position" value={form.position} onChange={(v: string) => setForm({ ...form, position: v })} />
          <Input label="Reporting Manager" value={form.reporting_manager} onChange={(v: string) => setForm({ ...form, reporting_manager: v })} />
          <Select label="Employment Type" value={form.employment_type} options={["Full Time", "Part Time", "Contract", "Probation"]} onChange={(v: string) => setForm({ ...form, employment_type: v })} />
          <Input label="Date of Joining" type="date" value={form.joining_date} onChange={(v: string) => setForm({ ...form, joining_date: v })} />
          <Input label="Contract Start Date" type="date" value={form.contract_start_date} onChange={(v: string) => setForm({ ...form, contract_start_date: v })} />
          <Input label="Contract End Date" type="date" value={form.contract_end_date} onChange={(v: string) => setForm({ ...form, contract_end_date: v })} />
          <Input label="Annual Ticket Due Date" type="date" value={form.annual_ticket_due} onChange={(v: string) => setForm({ ...form, annual_ticket_due: v })} />
          <Input label="Basic Salary" value={form.basic_salary} onChange={(v: string) => setForm({ ...form, basic_salary: v })} />
          <Input label="Other Benefits" value={form.other_benefits} onChange={(v: string) => setForm({ ...form, other_benefits: v })} />
        </div>

        <div className="flex justify-between mt-8">
          <a href="/employees/add" className="px-6 py-3 rounded-xl border font-semibold">Previous</a>
          <button onClick={saveAndNext} className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">Next →</button>
        </div>
      </section>
    </PageLayout>
  );
}

function PageLayout({ children, step, active }: { children: React.ReactNode; step: string; active: string }) {
  return <div className="min-h-screen bg-[#f7f4ec] flex"><Sidebar /><main className="flex-1 p-8 overflow-x-hidden"><a href="/employees/add" className="text-[#d2b241] font-semibold">← Back</a><div className="mt-6 mb-8"><h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1><p className="text-gray-500">{step}</p></div><Steps active={active} />{children}</main></div>;
}
function Sidebar(){return <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between"><div><div className="text-3xl font-bold tracking-widest mb-10">IC<span className="text-[#d2b241]">D</span>E</div>
        <div className="mb-10 flex justify-center"></div>
        <div className="mb-10 flex justify-center">
          <div className="relative w-40 h-16 flex items-center justify-center">
            <div className="text-5xl font-black tracking-widest text-[#6b7780] leading-none">ICDE</div>
            <div className="absolute bottom-3 left-[58px] w-14 h-6 border-b-[10px] border-[#d2b241] rounded-b-full"></div>
          </div>
        </div>
        <nav className="space-y-3"><a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a><a href="/employees" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Employees</a><a href="/leave-requests" className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a><a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a><a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a></nav></div><button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">Sign Out</button></aside>}
function Steps({active}:{active:string}){return <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"><div className="grid grid-cols-4 gap-3 text-center">{["Basic Information","Employment","Contact","Documents"].map(s=><div key={s} className={`rounded-xl py-3 font-semibold ${s===active?"bg-[#d2b241] text-white":"bg-[#f7f4ec] text-[#3f4447]"}`}>{s}</div>)}</div></section>}
function Input({label,value,onChange,type="text"}:any){return <div><label className="text-sm font-semibold text-gray-600">{label}</label><input type={type} value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"/></div>}
function Select({label,value,options,onChange}:any){return <div><label className="text-sm font-semibold text-gray-600">{label}</label><select value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"><option value="">Select</option>{options.map((o:string)=><option key={o}>{o}</option>)}</select></div>}
