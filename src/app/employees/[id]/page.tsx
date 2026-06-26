"use client";

import { useEffect, useState } from "react";

export default function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch(`/api/employees/${p.id}`).then((r) => r.json()).then(setEmployee);
    });
  }, [params]);

  function update(field: string, value: string) {
    setEmployee((prev: any) => ({ ...prev, [field]: value }));
  }

  async function saveChanges() {
    setSaving(true);

    const payload = {
      employee_code: employee.employee_code,
      first_name: employee.first_name,
      middle_name: employee.middle_name,
      last_name: employee.last_name,
      gender: employee.gender,
      date_of_birth: employee.date_of_birth || null,
      nationality: employee.nationality,
      marital_status: employee.marital_status,
      department: employee.department,
      position: employee.position,
      employment_type: employee.employment_type,
      joining_date: employee.joining_date || null,
      contract_end_date: employee.contract_end_date || null,
      annual_ticket_due: employee.annual_ticket_due || null,
      basic_salary: Number(employee.basic_salary || 0),
      other_benefits: Number(employee.other_benefits || 0),
      mobile_number: employee.mobile_number,
      email: employee.email,
      uae_address: employee.uae_address,
      home_country_address: employee.home_country_address,
      status: employee.status || "Active",
    };

    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to update employee");
      setSaving(false);
      return;
    }

    setEmployee(result);
    setEditMode(false);
    setSaving(false);
    alert("Employee profile updated successfully");
  }

  async function toggleStatus() {
    const nextStatus = employee.status === "Inactive" ? "Active" : "Inactive";

    await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    location.reload();
  }

  async function deleteEmployee() {
    if (!confirm("Delete this employee permanently?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    window.location.href = "/employees";
  }

  if (!employee) return <div className="p-10">Loading...</div>;

  const fullName = `${employee.first_name || ""} ${employee.middle_name || ""} ${employee.last_name || ""}`.replace(/\s+/g, " ").trim();
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-hidden">
        <a href="/employees" className="text-[#d2b241] font-semibold">← Back to Employees</a>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 mb-6">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-5">
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 rounded-2xl bg-[#3f4447] text-white flex items-center justify-center text-4xl font-bold">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#3f4447]">{fullName}</h1>
                <p className="text-gray-500">Employee ID: {employee.employee_code}</p>
                <p className="text-gray-500">Department: {employee.department || "-"} | Position: {employee.position || "-"}</p>
                <span className={`inline-block mt-3 px-4 py-2 rounded-full font-semibold ${employee.status === "Inactive" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {employee.status || "Active"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {editMode ? (
                <>
                  <button onClick={() => setEditMode(false)} className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl font-semibold">
                    Cancel Edit
                  </button>
                  <button onClick={saveChanges} disabled={saving} className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button onClick={() => setEditMode(true)} className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">
                  Edit Profile
                </button>
              )}

              <button
                onClick={toggleStatus}
                className={employee.status === "Inactive"
                  ? "bg-green-100 text-green-700 px-5 py-3 rounded-xl font-semibold"
                  : "bg-orange-100 text-orange-700 px-5 py-3 rounded-xl font-semibold"}
              >
                {employee.status === "Inactive" ? "Activate" : "Deactivate"}
              </button>

              <button onClick={deleteEmployee} className="bg-red-100 text-red-700 px-5 py-3 rounded-xl font-semibold">
                Delete
              </button>
            </div>
          </div>
        </section>

        {editMode ? (
          <>
            <EditSection title="Basic Information">
              <EditInput label="Employee ID" field="employee_code" value={employee.employee_code} update={update} />
              <EditInput label="First Name" field="first_name" value={employee.first_name} update={update} />
              <EditInput label="Middle Name" field="middle_name" value={employee.middle_name} update={update} />
              <EditInput label="Last Name" field="last_name" value={employee.last_name} update={update} />
              <EditInput label="Date of Birth" field="date_of_birth" type="date" value={employee.date_of_birth} update={update} />
              <EditSelect label="Gender" field="gender" value={employee.gender} options={["Male", "Female"]} update={update} />
              <EditInput label="Nationality" field="nationality" value={employee.nationality} update={update} />
              <EditSelect label="Marital Status" field="marital_status" value={employee.marital_status} options={["Single", "Married", "Divorced", "Widowed"]} update={update} />
            </EditSection>

            <EditSection title="Employment Information">
              <EditSelect label="Department" field="department" value={employee.department} options={["Doctors", "Nurses", "Front Office", "Back Office", "Admin", "House Keeping"]} update={update} />
              <EditInput label="Position" field="position" value={employee.position} update={update} />
              <EditSelect label="Employment Type" field="employment_type" value={employee.employment_type} options={["Full Time", "Part Time", "Contract", "Probation"]} update={update} />
              <EditInput label="Joining Date" field="joining_date" type="date" value={employee.joining_date} update={update} />
              <EditInput label="Contract End Date" field="contract_end_date" type="date" value={employee.contract_end_date} update={update} />
              <EditInput label="Annual Ticket Due" field="annual_ticket_due" type="date" value={employee.annual_ticket_due} update={update} />
              <EditInput label="Basic Salary" field="basic_salary" value={employee.basic_salary} update={update} />
              <EditInput label="Other Benefits" field="other_benefits" value={employee.other_benefits} update={update} />
            </EditSection>

            <EditSection title="Contact Information">
              <EditInput label="Mobile Number" field="mobile_number" value={employee.mobile_number} update={update} />
              <EditInput label="Email Address" field="email" value={employee.email} update={update} />
              <EditInput label="UAE Address" field="uae_address" value={employee.uae_address} update={update} />
              <EditInput label="Home Country Address" field="home_country_address" value={employee.home_country_address} update={update} />
            </EditSection>
          </>
        ) : (
          <>
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              <InfoCard title="Personal Information" rows={[
                ["Phone", employee.mobile_number || "-"],
                ["Email", employee.email || "-"],
                ["Date of Birth", employee.date_of_birth || "-"],
                ["Nationality", employee.nationality || "-"],
                ["Gender", employee.gender || "-"],
                ["Marital Status", employee.marital_status || "-"],
              ]} />

              <InfoCard title="Employment Details" rows={[
                ["Joining Date", employee.joining_date || "-"],
                ["Department", employee.department || "-"],
                ["Position", employee.position || "-"],
                ["Employment Type", employee.employment_type || "-"],
                ["Contract End", employee.contract_end_date || "-"],
                ["Annual Ticket Due", employee.annual_ticket_due || "-"],
              ]} />

              <InfoCard title="Salary & Leave" rows={[
                ["Basic Salary", `AED ${employee.basic_salary || 0}`],
                ["Other Benefits", `AED ${employee.other_benefits || 0}`],
                ["Annual Leave", "30 Days"],
                ["Leave Used", "6 Days"],
                ["Leave Balance", "24 Days"],
              ]} />
            </section>

            <InfoWide title="Address Information" rows={[
              ["UAE Residence Address", employee.uae_address || "-"],
            ]} />


            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-xl font-bold text-[#3f4447] mb-5">Leaves Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-5 text-center">
                  <p className="text-gray-500 text-sm">Total Leaves</p>
                  <h3 className="text-2xl font-bold text-[#3f4447] mt-2">30 Days</h3>
                </div>
                <div className="rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-5 text-center">
                  <p className="text-gray-500 text-sm">Leaves Used</p>
                  <h3 className="text-2xl font-bold text-[#3f4447] mt-2">6 Days</h3>
                </div>
                <div className="rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-5 text-center">
                  <p className="text-gray-500 text-sm">Balance Leaves</p>
                  <h3 className="text-2xl font-bold text-[#3f4447] mt-2">24 Days</h3>
                </div>
              </div>
            </section>

            <DocumentSection />

            <LeaveSection />

            <AuditSection status={employee.status || "Active"} />
          </>
        )}
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <div className="text-3xl font-bold tracking-widest mb-10">IC<span className="text-[#d2b241]">D</span>E</div>
        <nav className="space-y-3">
          <a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a>
          <a href="/employees" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Employees</a>
          <a href="/leave-requests" className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a>
          <a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a>
          <a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a>
        </nav>
      </div>
      <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">Sign Out</button>
    </aside>
  );
}

function InfoCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>
      {rows.map(([l, v]) => (
        <div key={l} className="flex justify-between border-b py-2 gap-4">
          <span className="text-gray-500">{l}</span>
          <b className="text-right">{v}</b>
        </div>
      ))}
    </section>
  );
}

function InfoWide({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>
      {rows.map(([l, v]) => (
        <div key={l} className="flex justify-between border-b py-2 gap-4">
          <span className="text-gray-500">{l}</span>
          <b className="text-right">{v}</b>
        </div>
      ))}
    </section>
  );
}

function EditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

function EditInput({ label, field, value, update, type = "text" }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <input type={type} value={value || ""} onChange={(e) => update(field, e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" />
    </div>
  );
}

function EditSelect({ label, field, value, options, update }: any) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <select value={value || ""} onChange={(e) => update(field, e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white">
        <option value="">Select</option>
        {options.map((o: string) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function DocumentSection() {
  const rows = [
    ["Office Documents", "Employment Contract", "N/A", "Active"],
    ["Immigration Documents", "Visa / Emirates ID", "Pending Upload", "Pending"],
    ["Degrees & Certificates", "Degree / License", "Pending Upload", "Pending"],
  ];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-[#3f4447]">Employee Documents</h2>
        <button className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">Upload Document</button>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="bg-[#3f4447] text-white"><th className="p-3 text-left">Category</th><th className="p-3 text-left">Document</th><th className="p-3 text-left">Expiry</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Preview</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]} className="border-b"><td className="p-3">{r[0]}</td><td className="p-3">{r[1]}</td><td className="p-3">{r[2]}</td><td className="p-3">{r[3]}</td><td className="p-3 text-[#d2b241] font-bold">Preview</td></tr>)}</tbody>
      </table>
    </section>
  );
}

function LeaveSection() {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">Leave Applications & History</h2>
      <table className="w-full text-sm">
        <thead><tr className="bg-[#3f4447] text-white"><th className="p-3 text-left">Leave Type</th><th className="p-3 text-left">From</th><th className="p-3 text-left">To</th><th className="p-3 text-left">Duration</th><th className="p-3 text-left">Status</th></tr></thead>
        <tbody>
          <tr className="border-b"><td className="p-3">Annual Leave</td><td className="p-3">01 May 2026</td><td className="p-3">06 May 2026</td><td className="p-3">6 Days</td><td className="p-3"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">Completed</span></td></tr>
        </tbody>
      </table>
    </section>
  );
}

function AuditSection({ status }: { status: string }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">Audit Log</h2>
      <div className="space-y-3 text-sm">
        <p>✅ Employee profile loaded from Supabase.</p>
        <p>✅ Current status: <b>{status}</b></p>
        <p>✅ Edit, deactivate, activate, and delete actions are available.</p>
      </div>
    </section>
  );
}
