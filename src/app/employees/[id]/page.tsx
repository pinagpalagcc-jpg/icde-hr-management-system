"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, type ReactNode } from "react";

const ADMIN_DELETE_PASSWORD = "admin123";

const TABS = [
  "Personal Information",
  "Employment Detail",
  "Salary and Benefits",
  "Leave Details",
  "Office Documents",
  "Immigration Documents",
  "Personal Documents",
] as const;

type TabName = (typeof TABS)[number];

export default function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const [id, setId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>("Personal Information");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [docForm, setDocForm] = useState({
    document_name: "",
    category: "Office Documents",
    issue_date: "",
    expiry_date: "",
    not_applicable: false,
    file_name: "",
    file_type: "",
    file_data: "",
  });

  useEffect(() => {
    Promise.resolve(params).then((p) => {
      setId(p.id);
      loadEmployee(p.id);
      loadDocuments(p.id);
    });
  }, [params]);

  async function loadEmployee(employeeId: string) {
    const data = await fetch(`/api/employees/${employeeId}`).then((r) => r.json());
    setEmployee(data);
  }

  async function loadDocuments(employeeId: string) {
    const data = await fetch(`/api/employee-documents?employee_id=${employeeId}`).then((r) => r.json());
    setDocuments(Array.isArray(data) ? data : []);
  }

  function update(field: string, value: any) {
    setEmployee((prev: any) => ({ ...prev, [field]: value }));
  }

  async function saveChanges() {
    setSaving(true);

    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
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
    const nextStatus = (employee.status || "Available") === "On Leave" ? "Available" : "On Leave";

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

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      const photoData = String(reader.result || "");

      const res = await fetch(`/api/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_photo: photoData }),
      });

      const result = await res.json();

      if (!res.ok) return alert(result.error || "Failed to upload photo");

      setEmployee(result);
      alert("Profile photo updated successfully");
    };

    reader.readAsDataURL(file);
  }

  async function removePhoto() {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_photo: null }),
    });

    const result = await res.json();

    if (!res.ok) return alert(result.error || "Failed to remove photo");

    setEmployee(result);
    alert("Profile photo removed successfully");
  }

  function handleFile(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setDocForm((prev) => ({
        ...prev,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_data: String(reader.result || ""),
      }));
    };

    reader.readAsDataURL(file);
  }

  async function uploadDocument(categoryOverride?: string) {
    if (!docForm.document_name) return alert("Please enter document name.");
    if (!docForm.file_data) return alert("Please choose a file.");

    const res = await fetch("/api/employee-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: id,
        document_name: docForm.document_name,
        category: categoryOverride || docForm.category,
        issue_date: docForm.not_applicable ? null : docForm.issue_date || null,
        expiry_date: docForm.not_applicable ? null : docForm.expiry_date || null,
        file_name: docForm.file_name,
        file_type: docForm.file_type,
        file_data: docForm.file_data,
        status: "Available",
      }),
    });

    const result = await res.json();

    if (!res.ok) return alert(result.error || "Failed to upload document");

    setDocForm({
      document_name: "",
      category: categoryOverride || "Office Documents",
      issue_date: "",
      expiry_date: "",
      not_applicable: false,
      file_name: "",
      file_type: "",
      file_data: "",
    });

    await loadDocuments(id);
    alert("Document uploaded successfully");
  }

  async function deleteDocument(documentId: string) {
    const password = prompt("Enter Admin password to delete this document:");

    if (password !== ADMIN_DELETE_PASSWORD) {
      return alert("Wrong password. Document was not deleted.");
    }

    if (!confirm("Delete this document permanently?")) return;

    const res = await fetch(`/api/employee-documents/${documentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const result = await res.json();
      return alert(result.error || "Failed to delete document");
    }

    await loadDocuments(id);
    alert("Document deleted successfully");
  }

  if (!employee) return <div className="p-10">Loading...</div>;

  const fullName = `${employee.first_name || ""} ${employee.middle_name || ""} ${employee.last_name || ""}`
    .replace(/\s+/g, " ")
    .trim();

  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-x-hidden">
        <a href="/employees" className="text-[#d2b241] font-semibold">
          ← Back to Employees
        </a>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 mb-6">
          <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-5">
            <div className="flex items-center gap-6">
              <div>
                <div className="w-32 h-32 rounded-2xl bg-[#3f4447] text-white flex items-center justify-center text-4xl font-bold overflow-hidden">
                  {employee.profile_photo ? (
                    <img src={employee.profile_photo} alt="Employee Photo" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>

                <label className="mt-3 block text-center bg-[#d2b241] text-white px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer">
                  Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)} />
                </label>

                {employee.profile_photo && (
                  <button onClick={removePhoto} className="mt-2 w-full text-sm bg-red-100 text-red-700 px-3 py-2 rounded-xl font-semibold">
                    Remove Photo
                  </button>
                )}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-[#3f4447]">{fullName}</h1>
                <p className="text-gray-500">Employee ID: {employee.employee_code}</p>
                <p className="text-gray-500">
                  Department: {employee.department || "-"} | Position: {employee.position || "-"}
                </p>

                <span className={`inline-block mt-3 px-4 py-2 rounded-full font-semibold ${
                  (employee.status || "Available") === "On Leave"
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {employee.status || "Available"}
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
                className={(employee.status || "Available") === "On Leave"
                  ? "bg-green-100 text-green-700 px-5 py-3 rounded-xl font-semibold"
                  : "bg-orange-100 text-orange-700 px-5 py-3 rounded-xl font-semibold"
                }
              >
                {(employee.status || "Available") === "On Leave" ? "Activate" : "Deactivate"}
              </button>

              <button onClick={deleteEmployee} className="bg-red-100 text-red-700 px-5 py-3 rounded-xl font-semibold">
                Delete
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 rounded-2xl font-bold text-sm shadow-md border-2 transition-all ${
                  activeTab === tab
                    ? "bg-[#d2b241] text-white border-[#b99316] scale-[1.03]"
                    : tab === "Personal Information"
                    ? "bg-[#efe7ff] text-[#5b21b6] border-[#c4b5fd] hover:bg-[#ddd6fe]"
                    : tab === "Employment Detail"
                    ? "bg-[#dbeafe] text-[#1d4ed8] border-[#93c5fd] hover:bg-[#bfdbfe]"
                    : tab === "Salary and Benefits"
                    ? "bg-[#fef3c7] text-[#92400e] border-[#fbbf24] hover:bg-[#fde68a]"
                    : tab === "Leave Details"
                    ? "bg-[#dcfce7] text-[#166534] border-[#86efac] hover:bg-[#bbf7d0]"
                    : tab === "Office Documents"
                    ? "bg-[#e0f2fe] text-[#075985] border-[#7dd3fc] hover:bg-[#bae6fd]"
                    : tab === "Immigration Documents"
                    ? "bg-[#d1fae5] text-[#047857] border-[#6ee7b7] hover:bg-[#a7f3d0]"
                    : "bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe] hover:bg-[#e9d5ff]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "Personal Information" &&
  (editMode ? (
    <EditSection title="Personal Information">
      <EditInput
        label="Employee ID"
        field="employee_code"
        value={employee.employee_code}
        update={update}
      />
      <EditInput
        label="First Name"
        field="first_name"
        value={employee.first_name}
        update={update}
      />
      <EditInput
        label="Middle Name"
        field="middle_name"
        value={employee.middle_name}
        update={update}
      />
      <EditInput
        label="Last Name"
        field="last_name"
        value={employee.last_name}
        update={update}
      />
      <EditInput
        label="Date of Birth"
        field="date_of_birth"
        type="date"
        value={employee.date_of_birth}
        update={update}
      />
      <EditSelect
        label="Gender"
        field="gender"
        value={employee.gender}
        options={["Male", "Female"]}
        update={update}
      />
      <EditInput
        label="Nationality"
        field="nationality"
        value={employee.nationality}
        update={update}
      />
      <EditInput
        label="Mobile Number"
        field="mobile_number"
        value={employee.mobile_number}
        update={update}
      />
      <EditInput
        label="Email Address"
        field="email"
        value={employee.email}
        update={update}
      />
      <EditInput
        label="UAE Address"
        field="uae_address"
        value={employee.uae_address}
        update={update}
      />
    </EditSection>
  ) : (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">
        Personal Information
      </h2>

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full border border-gray-200">
          <thead className="bg-[#d2b241] text-white">
            <tr>
              <th className="p-3 text-left">Employee ID</th>
              <th className="p-3 text-left">Full Name</th>
              <th className="p-3 text-left">Mobile Number</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Date of Birth</th>
              <th className="p-3 text-left">Nationality</th>
              <th className="p-3 text-left">Gender</th>
              <th className="p-3 text-left">Resident Address</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t">
              <td className="p-3">{employee.employee_code || "-"}</td>
              <td className="p-3">{fullName || "-"}</td>
              <td className="p-3">{employee.mobile_number || "-"}</td>
              <td className="p-3">{employee.email || "-"}</td>
              <td className="p-3">{employee.date_of_birth || "-"}</td>
              <td className="p-3">{employee.nationality || "-"}</td>
              <td className="p-3">{employee.gender || "-"}</td>
              <td className="p-3">{employee.uae_address || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ))}

        {activeTab === "Employment Detail" &&
          (editMode ? (
            <EditSection title="Employment Detail">
              <EditSelect label="Department" field="department" value={employee.department} options={["Clinicians", "Admin", "Front Desk", "Dental Assistant", "Insurance", "House Keeping", "Dependants"]} update={update} />
              <EditInput label="Position" field="position" value={employee.position} update={update} />
              <EditSelect label="Employment Type" field="employment_type" value={employee.employment_type} options={["Full Time", "Part Time", "Contract", "Probation"]} update={update} />
              <EditInput label="Joining Date" field="joining_date" type="date" value={employee.joining_date} update={update} />
              <EditInput label="Contract End Date" field="contract_end_date" type="date" value={employee.contract_end_date} update={update} />
              <EditInput label="Annual Ticket Due" field="annual_ticket_due" type="date" value={employee.annual_ticket_due} update={update} />
              <EditInput label="Username / Email" field="login_username" value={employee.login_username} update={update} />
              <EditInput label="Reset Temporary Password" field="login_password" value={employee.login_password} update={update} />
              <EditSelect label="User Role" field="user_role" value={employee.user_role} options={["Staff", "Admin"]} update={update} />
              <button type="button" onClick={() => update("must_change_password", "true")} className="bg-orange-100 text-orange-700 px-5 py-3 rounded-xl font-semibold mt-7">
                Force Password Change
              </button>
            </EditSection>
          ) : (
            <InfoWide
              title="Employment Detail"
              rows={[
                ["Department", employee.department || "-"],
                ["Position", employee.position || "-"],
                ["Employment Type", employee.employment_type || "-"],
                ["Joining Date", employee.joining_date || "-"],
                ["Contract End", employee.contract_end_date || "-"],
                ["Annual Ticket Due", employee.annual_ticket_due || "-"],
                ["Username / Email", employee.login_username || "-"],
                ["User Role", employee.user_role || "-"],
              ]}
            />
          ))}

        {activeTab === "Salary and Benefits" &&
          (editMode ? (
            <EditSection title="Salary and Benefits">
              <EditInput label="Basic Salary" field="basic_salary" value={employee.basic_salary} update={update} />
              <EditInput label="Other Benefits" field="other_benefits" value={employee.other_benefits} update={update} />
            </EditSection>
          ) : (
            <InfoWide
              title="Salary and Benefits"
              rows={[
                ["Basic Salary", `AED ${employee.basic_salary || 0}`],
                ["Other Benefits", `AED ${employee.other_benefits || 0}`],
              ]}
            />
          ))}

        {activeTab === "Leave Details" && (
  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
    <h2 className="text-xl font-bold text-[#3f4447] mb-6">
      Leave Summary
    </h2>

    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Annual Leave
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniKpi
              title="Total"
              value={`${employee.total_leaves ?? 0} Days`}
              onClick={() => {
                window.location.href =
                  `/employees/${id}/annual-leave-register`;
              }}
            />
          <MiniKpi
  title="Used"
  value={`${employee.leaves_used ?? 0} Days`}
  onClick={() =>
    window.location.href = `/employees/${id}/leave-ledger?type=annual`
  }
/>
          <MiniKpi
            title="Balance"
            value={`${employee.balance_leaves ?? 30} Days`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Paternity Leave
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniKpi title="Total" value="15 Days" />
          <MiniKpi
            title="Used"
            value={`${employee.paternity_leave_used ?? 0} Days`}
              onClick={() =>
                window.location.href = `/employees/${id}/leave-ledger?type=paternity`
              }
          />
          <MiniKpi
            title="Balance"
            value={`${employee.paternity_leave_balance ?? 15} Days`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Maternity Leave
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniKpi title="Total" value="45 Days" />
          <MiniKpi
            title="Used"
            value={`${employee.maternity_leave_used ?? 0} Days`}
              onClick={() =>
                window.location.href = `/employees/${id}/leave-ledger?type=maternity`
              }
          />
          <MiniKpi
            title="Balance"
            value={`${employee.maternity_leave_balance ?? 45} Days`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Holiday Credit Leave
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniKpi
            title="Earned"
            value={`${employee.credit_leave_earned ?? 0} Days`}
              onClick={() =>
                window.location.href = `/employees/${id}/holiday-credit-ledger`
              }
          />
          <MiniKpi
            title="Used"
            value={`${employee.credit_leave_used ?? 0} Days`}
              onClick={() =>
                window.location.href = `/employees/${id}/holiday-credit-ledger`
              }
          />
          <MiniKpi
            title="Balance"
            value={`${employee.credit_leave_balance ?? 0} Days`}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Unpaid Leave
        </h3>

        <MiniKpi
          title="Used"
          value={`${employee.unpaid_leave_used ?? 0} Days`}
        />
      </div>
    </div>
  </section>
)}

        {activeTab === "Office Documents" && (
          <DocumentCenter category="Office Documents" docForm={docForm} setDocForm={setDocForm} handleFile={handleFile} uploadDocument={uploadDocument} documents={documents} deleteDocument={deleteDocument} />
        )}

        {activeTab === "Immigration Documents" && (
          <DocumentCenter category="Immigration Documents" docForm={docForm} setDocForm={setDocForm} handleFile={handleFile} uploadDocument={uploadDocument} documents={documents} deleteDocument={deleteDocument} />
        )}

        {activeTab === "Personal Documents" && (
          <DocumentCenter category="Personal Documents" docForm={docForm} setDocForm={setDocForm} handleFile={handleFile} uploadDocument={uploadDocument} documents={documents} deleteDocument={deleteDocument} />
        )}

        <AuditSection status={employee.status || "Available"} />
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <div className="mb-10">
          <div className="text-4xl font-black tracking-widest">
            <span className="text-white">IC</span><span className="text-[#d2b241]">D</span><span className="text-white">E</span>
          </div>
          <div className="text-sm text-white/90 mt-3">HR Management Portal</div>
          <div className="w-24 h-[3px] bg-[#d2b241] mt-3 rounded-full"></div>
          <div className="text-xs text-white/60 mt-3">©2026 V.1.1</div>
        </div>

        <nav className="space-y-3">
          <a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a>
          <a href="/employees" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Employees</a>
          <a href="/leave-requests" className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a>
          <a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a>
          <a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a>
        </nav>
      </div>

      <button
        onClick={() => {
          localStorage.clear();
          document.cookie = "icde_auth=; path=/; max-age=0";
          window.location.href = "/login";
        }}
        className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10"
      >
        Sign Out
      </button>
    </aside>
  );
}

function DocumentCenter({ category, docForm, setDocForm, handleFile, uploadDocument, documents, deleteDocument }: any) {
  const rows = documents.filter((d: any) => d.category === category);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#3f4447]">{category}</h2>
        <p className="text-gray-500 text-sm">Upload, preview, download, and protected delete.</p>
      </div>

      <div className="bg-[#f7f4ec] rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-[#3f4447] mb-4">Upload New Document</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Document Name" value={docForm.document_name} onChange={(v: string) => setDocForm({ ...docForm, document_name: v })} />
          <Select label="Section / Category" value={category} options={[category]} onChange={() => setDocForm({ ...docForm, category })} />

          <div>
            <label className="text-sm font-semibold text-gray-600">Upload File</label>
            <input type="file" onChange={(e) => handleFile(e.target.files?.[0] || null)} className="mt-2 w-full border rounded-xl px-4 py-3 bg-white" />
            {docForm.file_name && <p className="text-xs text-green-700 mt-1">Selected: {docForm.file_name}</p>}
          </div>

          <Input label="Date of Issue" type="date" value={docForm.issue_date} onChange={(v: string) => setDocForm({ ...docForm, issue_date: v })} />
          <Input label="Date of Expiry" type="date" value={docForm.expiry_date} onChange={(v: string) => setDocForm({ ...docForm, expiry_date: v })} />

          <label className="flex items-center gap-3 bg-white rounded-xl border px-4 py-3 mt-7">
            <input
              type="checkbox"
              checked={docForm.not_applicable}
              onChange={(e) =>
                setDocForm({
                  ...docForm,
                  not_applicable: e.target.checked,
                  issue_date: e.target.checked ? "" : docForm.issue_date,
                  expiry_date: e.target.checked ? "" : docForm.expiry_date,
                })
              }
            />
            <span className="font-semibold text-[#3f4447]">Not Applicable</span>
          </label>
        </div>

        <button onClick={() => uploadDocument(category)} className="mt-5 bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">
          Upload Document
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full text-sm">
          <thead>
            <tr className="bg-[#d2b241] text-white">
              <th className="p-3 text-left">Document Name</th>
              <th className="p-3 text-left">Date of Issue</th>
              <th className="p-3 text-left">Date of Expiry</th>
              <th className="p-3 text-left">Remaining Days</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Preview</th>
              <th className="p-3 text-left">Download</th>
              <th className="p-3 text-left">Delete</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((doc: any) => {
                const info = expiryInfo(doc.expiry_date);

                return (
                  <tr key={doc.id} className="border-b hover:bg-[#f7f4ec]">
                    <td className="p-3 font-semibold">{doc.document_name}</td>
                    <td className="p-3">{doc.issue_date || "-"}</td>
                    <td className="p-3">{doc.expiry_date || "No Expiry"}</td>
                    <td className="p-3"><span className={`${info.className} px-3 py-1 rounded-full font-semibold`}>{info.daysText}</span></td>
                    <td className="p-3"><span className={`${info.className} px-3 py-1 rounded-full font-semibold`}>{info.status}</span></td>
                    <td className="p-3">{doc.file_data ? <button type="button" onClick={() => previewDoc(doc)} className="text-[#d2b241] font-bold">Preview</button> : "-"}</td>
                    <td className="p-3">{doc.file_data ? <a href={doc.file_data} download={doc.file_name || doc.document_name} className="text-[#d2b241] font-bold">Download</a> : "-"}</td>
                    <td className="p-3"><button onClick={() => deleteDocument(doc.id)} className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">Delete</button></td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-5 text-center text-gray-500">
                  No {category.toLowerCase()} uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function expiryInfo(expiryDate: string | null) {
  if (!expiryDate) return { daysText: "No Expiry", status: "No Expiry", className: "bg-gray-100 text-gray-700" };

  const today = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { daysText: `${Math.abs(days)} days expired`, status: "Expired", className: "bg-red-200 text-red-900" };
  if (days <= 30) return { daysText: `${days} days`, status: "Critical", className: "bg-red-100 text-red-700" };
  if (days <= 60) return { daysText: `${days} days`, status: "Warning", className: "bg-orange-100 text-orange-700" };
  if (days <= 90) return { daysText: `${days} days`, status: "Upcoming", className: "bg-yellow-100 text-yellow-700" };

  return { daysText: `${days} days`, status: "Available", className: "bg-green-100 text-green-700" };
}

function previewDoc(doc: any) {
  const w = window.open("", "_blank");

  if (w) {
    w.document.write(`<html><head><title>${doc.document_name}</title></head><body style="margin:0"><iframe src="${doc.file_data}" style="width:100%;height:100vh;border:0"></iframe></body></html>`);
    w.document.close();
  }
}

function MiniKpi({
  title,
  value,
  onClick,
}: {
  title: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`w-full rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-5 text-center transition ${
        onClick
          ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
          : "cursor-default"
      }`}
    >
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </button>
  );
}

function InfoWide({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between border-b py-2 gap-4">
          <span className="text-gray-500">{label}</span>
          <b className="text-right">{value}</b>
        </div>
      ))}
    </section>
  );
}

function EditSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"><h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div></section>;
}

function EditInput({ label, field, value, update, type = "text" }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><input type={type} value={value || ""} onChange={(e) => update(field, e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" /></div>;
}

function EditSelect({ label, field, value, options, update }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><select value={value || ""} onChange={(e) => update(field, e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white"><option value="">Select</option>{options.map((option: string) => <option key={option}>{option}</option>)}</select></div>;
}

function Input({ label, value, onChange, type = "text" }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" /></div>;
}

function Select({ label, value, options, onChange }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><select value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white">{options.map((option: string) => <option key={option}>{option}</option>)}</select></div>;
}

function LeaveSection() {
  return <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6"><h2 className="text-xl font-bold text-[#3f4447] mb-5">Leave Applications & History</h2><p className="text-gray-500">Leave history will connect in the Leave Management phase.</p></section>;
}

function AuditSection({ status }: { status: string }) {
  return <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10"><h2 className="text-xl font-bold text-[#3f4447] mb-5">Audit Log</h2><div className="space-y-3 text-sm"><p>✅ Employee profile loaded from Supabase.</p><p>✅ Current status: <b>{status}</b></p><p>✅ Edit, activate, deactivate, delete, and document actions are available.</p></div></section>;
}
