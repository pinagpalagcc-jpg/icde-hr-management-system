"use client";

import { useState } from "react";

export default function DocumentsPage() {
  const [saving, setSaving] = useState(false);

  async function createEmployee() {
    setSaving(true);

    const basic = JSON.parse(localStorage.getItem("employee_basic") || "{}");
    const employment = JSON.parse(localStorage.getItem("employee_employment") || "{}");
    const contact = JSON.parse(localStorage.getItem("employee_contact") || "{}");

    const employee = {
      ...basic,
      ...employment,
      ...contact,
      status: "Active",
    };

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to create employee");
      setSaving(false);
      return;
    }

    localStorage.removeItem("employee_basic");
    localStorage.removeItem("employee_employment");
    localStorage.removeItem("employee_contact");

    alert("Employee created successfully");
    window.location.href = "/employees";
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">
        <a href="/employees/add/contact" className="text-[#d2b241] font-semibold">← Back to Contact</a>
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1>
          <p className="text-gray-500">Step 4 of 4 — Initial Documents</p>
        </div>

        <Steps active="Documents" />

        <DocumentUploadBox title="Office Documents" examples="Employment Contract, Job Description, Joining Form, NDA" />
        <DocumentUploadBox title="Immigration Documents" examples="Emirates ID, Visa, Labour Card, Work Permit" />
        <DocumentUploadBox title="Degrees & Certificates" examples="CV, Degree, BLS Certificate, Health License" />

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-3">Final Confirmation</h2>
          <p className="text-gray-500 mb-6">Click Create Employee to save this employee into Supabase.</p>

          <div className="flex justify-between">
            <a href="/employees/add/contact" className="px-6 py-3 rounded-xl border font-semibold">Previous</a>
            <button onClick={createEmployee} disabled={saving} className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">
              {saving ? "Saving..." : "Create Employee"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function DocumentUploadBox({ title, examples }: { title: string; examples: string }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#3f4447]">{title}</h2>
      <p className="text-gray-500 mb-5">Examples: {examples}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Field label="Document Name" />
        <Field label="Upload File" type="file" />
        <Field label="Issue Date" type="date" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Expiry Date" type="date" />
        <div className="flex items-end">
          <label className="flex items-center gap-3 bg-[#f7f4ec] rounded-xl px-4 py-3 w-full">
            <input type="checkbox" />
            <span className="font-semibold text-[#3f4447]">Not Applicable</span>
          </label>
        </div>
        <div className="flex items-end">
          <button className="w-full bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">Add Document</button>
        </div>
      </div>
    </section>
  );
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
function Field({label,type="text"}:{label:string;type?:string}){return <div><label className="text-sm font-semibold text-gray-600">{label}</label><input type={type} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"/></div>}
