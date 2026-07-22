"use client";

import { useEffect, useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({
    mobile_number: "",
    email: "",
    uae_address: "",
    home_country_address: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    relationship: "",
    alternative_contact_number: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("employee_contact");
    if (saved) setForm(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("employee_contact", JSON.stringify(form));
  }, [form]);

  function saveAndNext() {
    localStorage.setItem("employee_contact", JSON.stringify(form));
    window.location.href = "/employees/add/documents";
  }

  return (
    <PageLayout step="Step 3 of 4 — Contact Information" active="Contact">
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-[#3f4447] mb-6">Contact Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Object.entries(form).map(([key, value]) => (
            <Input key={key} label={key.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase())} value={value} onChange={(v: string) => setForm({ ...form, [key]: v })} />
          ))}
        </div>

        <div className="flex justify-between mt-8">
          <a href="/employees/add/employment" className="px-6 py-3 rounded-xl border font-semibold">Previous</a>
          <button onClick={saveAndNext} className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">Next →</button>
        </div>
      </section>
    </PageLayout>
  );
}

function PageLayout({ children, step, active }: { children: React.ReactNode; step: string; active: string }) {
  return <div className="min-h-screen bg-[#f7f4ec] flex"><Sidebar /><main className="flex-1 p-8 overflow-x-hidden"><a href="/employees/add/employment" className="text-[#d2b241] font-semibold">← Back</a><div className="mt-6 mb-8"><h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1><p className="text-gray-500">{step}</p></div><Steps active={active} />{children}</main></div>;
}
function Sidebar(){return <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between"><div><div className="text-3xl font-bold tracking-widest mb-10">IC<span className="text-[#d2b241]">D</span>E</div>
        <div className="mb-10 flex justify-center"></div>
        <div className="mb-10 flex justify-center">
          <div className="relative w-40 h-16 flex items-center justify-center">
            <div className="text-5xl font-black tracking-widest text-[#6b7780] leading-none">ICDE</div>
            <div className="absolute bottom-3 left-[58px] w-14 h-6 border-b-[10px] border-[#d2b241] rounded-b-full"></div>
          </div>
        </div>
        <nav className="space-y-3"><a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a><a href="/employees" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Employees</a><a href="/leave-requests" className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a><a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a><a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a></nav></div><a href="/logout" className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">Sign Out</a></aside>}
function Steps({active}:{active:string}){return <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"><div className="grid grid-cols-4 gap-3 text-center">{["Basic Information","Employment","Contact","Documents"].map(s=><div key={s} className={`rounded-xl py-3 font-semibold ${s===active?"bg-[#d2b241] text-white":"bg-[#f7f4ec] text-[#3f4447]"}`}>{s}</div>)}</div></section>}
function Input({label,value,onChange}:any){return <div><label className="text-sm font-semibold text-gray-600">{label}</label><input value={value} onChange={(e)=>onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"/></div>}
