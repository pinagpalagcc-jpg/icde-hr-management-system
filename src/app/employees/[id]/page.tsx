"use client";

import { useState } from "react";

export default function EmployeeProfilePage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Office Documents");

  function openUpload(category: string) {
    setSelectedCategory(category);
    setShowUploadForm(true);
    setTimeout(() => {
      document.getElementById("upload-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  const officeDocs = [
    ["Job Description", "2024-01-15", "N/A", "N/A", "Active"],
    ["Employment Contract", "2024-01-15", "2026-01-15", "204 days", "Active"],
    ["NDA Form", "2024-01-15", "N/A", "N/A", "Active"],
  ];

  const immigrationDocs = [
    ["Emirates ID", "2024-03-10", "2027-03-10", "620 days", "Active"],
    ["Labour Card", "2024-03-10", "2026-08-10", "46 days", "Expiring"],
    ["Visa", "2024-03-10", "2026-09-05", "72 days", "Expiring"],
  ];

  const certificates = [
    ["CV", "N/A", "N/A", "N/A", "Active"],
    ["Medical License", "2025-07-20", "2026-07-20", "25 days", "Expiring"],
    ["BLS Certificate", "2025-05-01", "2026-05-01", "310 days", "Active"],
  ];

  const leaveApplications = [
    ["Annual Leave", "15 Jun 2026", "10 Jul 2026", "20 Jul 2026", "10 Days", "Vacation", "Pending"],
    ["Annual Leave", "01 May 2026", "01 May 2026", "06 May 2026", "6 Days", "Family Trip", "Completed"],
  ];

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
        <div>
          <div className="text-3xl font-bold tracking-widest mb-10">
            IC<span className="text-[#d2b241]">D</span>E
          </div>

          <nav className="space-y-3">
            <a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a>
            <a href="/employees" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Employees</a>
            <a href="/leave-requests" className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a>
            <a href="/document-expiry" className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a>
            <a href="/reports" className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a>
          </nav>
        </div>

        <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-x-hidden">
        <a href="/employees" className="text-[#d2b241] font-semibold">← Back to Employees</a>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-2xl bg-[#3f4447] text-white flex items-center justify-center text-4xl font-bold">
              DA
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#3f4447]">Dr. Ahmad Khan</h1>
              <p className="text-gray-500">Employee ID: ICDE-001</p>
              <p className="text-gray-500">Department: Doctors | Position: Dentist</p>
              <span className="inline-block mt-3 bg-green-100 text-green-700 px-4 py-1 rounded-full font-semibold">
                Available
              </span>
            </div>
            <button onClick={() => alert("Edit Profile form will be added in next step")} className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">
              Edit Profile
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <InfoCard title="Personal Information">
            <Row label="Date of Birth" value="12 Mar 1988" />
            <Row label="Phone" value="+971 50 000 0001" />
            <Row label="Email" value="ahmad@icde.com" />
            <Row label="Address" value="Abu Dhabi, UAE" />
            <Row label="Emergency Contact" value="+971 50 111 2222" />
          </InfoCard>

          <InfoCard title="Employment Details">
            <Row label="Date of Joining" value="15 Jan 2024" />
            <Row label="End of Contract" value="15 Jan 2026" />
            <Row label="Department" value="Doctors" />
            <Row label="Position" value="Dentist" />
          </InfoCard>

          <InfoCard title="Salary & Benefits">
            <Row label="Basic Salary" value="AED 18,000" />
            <Row label="Other Benefits" value="AED 2,500" />
            <Row label="Total Package" value="AED 20,500" />
            <Row label="Annual Ticket Due" value="15 Jan 2027" />
          </InfoCard>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Leave Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SmallStat title="Annual Entitlement" value="30 Days" />
            <SmallStat title="Leaves Used" value="6 Days" />
            <SmallStat title="Balance Leaves" value="24 Days" />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Leave Applications & History</h2>
          <Table
            headers={["Leave Type", "Applied On", "From", "To", "Duration", "Reason", "Status", "Action"]}
            rows={leaveApplications.map((l) => [...l, l[6] === "Pending" ? "Approve / Reject" : "—"])}
          />
        </section>

        <UploadDocumentForm
          selectedCategory={selectedCategory}
          onCancel={() => {}}
        />

        <DocumentSection title="Office Documents" rows={officeDocs} onUpload={() => openUpload("Office Documents")} />
        <DocumentSection title="Immigration Documents" rows={immigrationDocs} onUpload={() => openUpload("Immigration Documents")} />
        <DocumentSection title="Degrees & Certificates" rows={certificates} onUpload={() => openUpload("Degrees & Certificates")} />
      </main>
    </div>
  );
}

function UploadDocumentForm({
  selectedCategory,
  onCancel,
}: {
  selectedCategory: string;
  onCancel: () => void;
}) {
  return (
    <section id="upload-form" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-2">Upload New Document</h2>
      <p className="text-gray-500 mb-6">
        Add any employee document with issue and expiry details. Use Not Applicable for documents without expiry.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Field label="Document Name" placeholder="e.g. Emirates ID, BLS Certificate" />
        <div>
          <label className="text-sm font-semibold text-gray-600">Category</label>
          <select defaultValue={selectedCategory} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white">
            <option>Office Documents</option>
            <option>Immigration Documents</option>
            <option>Degrees & Certificates</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600">Upload File</label>
          <input type="file" className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <Field label="Issue Date" placeholder="Select issue date" />
        <Field label="Expiry Date" placeholder="Select expiry date" />
        <div className="flex items-end">
          <label className="flex items-center gap-3 bg-[#f7f4ec] rounded-xl px-4 py-3 w-full">
            <input type="checkbox" />
            <span className="font-semibold text-[#3f4447]">Not Applicable</span>
          </label>
        </div>
      </div>

      <div className="mb-5">
        <label className="text-sm font-semibold text-gray-600">Notes</label>
        <textarea className="mt-2 w-full border rounded-xl px-4 py-3 outline-none" placeholder="Optional remarks" rows={3}></textarea>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-5 py-3 rounded-xl border font-semibold">Cancel</button>
        <button type="button" onClick={() => alert("Document save will connect to Supabase in next step")} className="px-5 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">Save Document</button>
      </div>
    </section>
  );
}

function DocumentSection({ title, rows, onUpload }: { title: string; rows: string[][]; onUpload: () => void }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold text-[#3f4447]">{title}</h2>
        <a href="#upload-form" className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold inline-block">
          + Upload Document
        </a>
      </div>
      <Table
        headers={["Document Name", "Issue Date", "Expiry Date", "Remaining Days", "Status", "Preview"]}
        rows={rows.map((r) => [...r, "Preview"])}
      />
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#3f4447] text-white">
            {headers.map((h) => (
              <th key={h} className="p-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-[#f7f4ec]">
              {row.map((cell, j) => (
                <td key={j} className="p-3 font-medium">
                  {cell.includes("Approve") ? (
                    <div className="flex gap-2">
                      <button className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">Approve</button>
                      <button className="bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">Reject</button>
                    </div>
                  ) : cell === "Active" || cell === "Completed" ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">{cell}</span>
                  ) : cell === "Expiring" || cell === "Pending" ? (
                    <span className="bg-[#d2b241]/20 text-[#8a721e] px-3 py-1 rounded-full font-semibold">{cell}</span>
                  ) : cell === "Preview" ? (
                    <button className="text-[#d2b241] font-bold">Preview</button>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-xl font-bold text-[#3f4447] mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SmallStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-[#d2b241] text-center">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <input className="mt-2 w-full border rounded-xl px-4 py-3 outline-none" placeholder={placeholder} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-[#3f4447] text-right">{value}</span>
    </div>
  );
}
