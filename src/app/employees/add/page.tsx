"use client";

import { useState } from "react";

export default function AddEmployeePage() {
  const [saving, setSaving] = useState(false);

  async function createEmployee(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);

    const payload = {
      employee_code: String(fd.get("employee_code") || "").trim(),
      first_name: String(fd.get("first_name") || "").trim(),
      middle_name: String(fd.get("middle_name") || "").trim(),
      last_name: String(fd.get("last_name") || "").trim(),
      gender: String(fd.get("gender") || ""),
      date_of_birth: String(fd.get("date_of_birth") || "") || null,
      nationality: String(fd.get("nationality") || "").trim(),
      department: String(fd.get("department") || ""),
      position: String(fd.get("position") || "").trim(),
      employment_type: String(fd.get("employment_type") || ""),
      joining_date: String(fd.get("joining_date") || "") || null,
      contract_end_date: String(fd.get("contract_end_date") || "") || null,
      annual_ticket_due: String(fd.get("annual_ticket_due") || "") || null,
      basic_salary: Number(fd.get("basic_salary") || 0),
      other_benefits: Number(fd.get("other_benefits") || 0),
      total_leaves: Number(fd.get("total_leaves") || 30),
      leaves_used: Number(fd.get("leaves_used") || 0),
      balance_leaves: Number(fd.get("balance_leaves") || 30),
      login_username: String(fd.get("login_username") || "").trim(),
      login_password: String(fd.get("login_password") || "").trim(),
      user_role: String(fd.get("user_role") || "Staff"),
      must_change_password: true,
      status: "Available",
      mobile_number: String(fd.get("mobile_number") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      uae_address: String(fd.get("uae_address") || "").trim(),
    };

    if (!payload.employee_code || !payload.first_name || !payload.last_name) {
      alert("Employee ID, First Name, and Last Name are required.");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to create employee");
      setSaving(false);
      return;
    }

    alert("Employee created successfully");
    window.location.href = "/employees";
  }

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
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
            <a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a>
            <a href="/employees" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Employees</a>
            <a href="/leave-requests" className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a>
            <a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a>
            <a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a>
          </nav>
        </div>

        <a href="/login" className="block text-center w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</a>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <a href="/employees" className="text-[#d2b241] font-semibold">← Back to Employees</a>

        <div className="mt-6 mb-6">
          <h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1>
          <p className="text-gray-500">Single-page employee registration — saves directly to Supabase</p>
        </div>

        <form onSubmit={createEmployee}>
          <FormSection title="Basic Information">
            <Field label="Employee ID" name="employee_code" defaultValue="" required />
            <Field label="First Name" name="first_name" required />
            <Field label="Middle Name" name="middle_name" />
            <Field label="Last Name" name="last_name" required />
            <Field label="Date of Birth" name="date_of_birth" type="date" />
            <Select label="Gender" name="gender" options={["Male", "Female"]} />
            <Field label="Nationality" name="nationality" />
          </FormSection>

          <FormSection title="Employment Information">
            <Select label="Department" name="department" options={["Clinicians", "Admin", "Front Desk", "Dental Assistant", "Insurance", "House Keeping", "Dependants"]} />
            <Field label="Position" name="position" />
            <Select label="Employment Type" name="employment_type" options={["Full Time", "Part Time", "Contract", "Probation"]} />
            <Field label="Joining Date" name="joining_date" type="date" />
            <Field label="Contract End Date" name="contract_end_date" type="date" />
            <Field label="Annual Ticket Due Date" name="annual_ticket_due" type="date" />
            <Field label="Basic Salary" name="basic_salary" />
            <Field label="Other Benefits" name="other_benefits" />
            <Field label="Total Leaves" name="total_leaves" defaultValue="30" />
            <Field label="Leaves Used" name="leaves_used" defaultValue="0" />
            <Field label="Balance Leaves" name="balance_leaves" defaultValue="30" />
          </FormSection>

          <FormSection title="Contact Information">
            <Field label="Mobile Number" name="mobile_number" />
            <Field label="Email Address" name="email" />
            <Field label="UAE Residence Address" name="uae_address" />
          </FormSection>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-[#3f4447] mb-3">Documents</h2>
            <p className="text-gray-500">Upload documents from the employee profile after creating the employee.</p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Login Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Username / Email" name="login_username" />
            <Field label="Temporary Password" name="login_password" />
            <Select label="User Role" name="user_role" options={["Staff", "Admin"]} />
          </div>
          <p className="text-sm text-gray-500 mt-3">User must change temporary password after first login.</p>
        </section>

        <div className="flex justify-between mb-10">
            <a href="/employees" className="px-6 py-3 rounded-xl border font-semibold">Cancel</a>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold"
            >
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue = "",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"
      />
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <select name={name} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white">
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
