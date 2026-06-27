"use client";

import { useEffect, useState } from "react";

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "Annual Leave",
    start_date: "",
    end_date: "",
    reason: "",
  });

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch(`/api/employees/${p.id}`).then((r) => r.json()).then(setEmployee);
      fetch(`/api/employee-documents?employee_id=${p.id}`).then((r) => r.json()).then((d) => setDocuments(Array.isArray(d) ? d : []));
    });
  }, [params]);

  function totalDays() {
    if (!leaveForm.start_date || !leaveForm.end_date) return 0;
    const start = new Date(leaveForm.start_date);
    const end = new Date(leaveForm.end_date);
    return Math.max(Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1, 0);
  }

  async function submitLeave() {
    const days = totalDays();

    if (!leaveForm.start_date || !leaveForm.end_date || days <= 0) {
      alert("Please select valid leave dates.");
      return;
    }

    if (days > Number(employee.balance_leaves || 0)) {
      alert("Leave days cannot exceed balance leaves.");
      return;
    }

    const res = await fetch("/api/leave-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_id: id,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        total_days: days,
        reason: leaveForm.reason,
        status: "Pending",
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to submit leave request");
      return;
    }

    setLeaveForm({ leave_type: "Annual Leave", start_date: "", end_date: "", reason: "" });
    alert("Leave request submitted to Admin for approval.");
  }

  if (!employee) return <div className="p-10">Loading...</div>;

  const fullName = `${employee.first_name || ""} ${employee.middle_name || ""} ${employee.last_name || ""}`.replace(/\s+/g, " ").trim();
  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <StaffSidebar active="My Profile" employeeId={id} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <a href="/staff" className="text-[#d2b241] font-semibold">← Back to Staff Portal</a>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-2xl bg-[#3f4447] text-white flex items-center justify-center text-4xl font-bold overflow-hidden">
              {employee.profile_photo ? <img src={employee.profile_photo} className="w-full h-full object-cover" alt="Profile" /> : initials}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#3f4447]">{fullName}</h1>
              <p className="text-gray-500">Employee ID: {employee.employee_code}</p>
              <p className="text-gray-500">Department: {employee.department || "-"} | Position: {employee.position || "-"}</p>
              <span className="inline-block mt-3 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                {employee.status || "Active"}
              </span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <InfoCard title="Personal Information" rows={[
            ["Phone", employee.mobile_number || "-"],
            ["Email", employee.email || "-"],
            ["Date of Birth", employee.date_of_birth || "-"],
            ["Nationality", employee.nationality || "-"],
            ["Gender", employee.gender || "-"],
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
            ["Annual Leave", `${employee.total_leaves || 30} Days`],
            ["Leave Used", `${employee.leaves_used || 0} Days`],
            ["Leave Balance", `${employee.balance_leaves || 30} Days`],
          ]} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-5">Leaves Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniKpi title="Total Leaves" value={`${employee.total_leaves || 30} Days`} />
            <MiniKpi title="Leaves Used" value={`${employee.leaves_used || 0} Days`} />
            <MiniKpi title="Balance Leaves" value={`${employee.balance_leaves || 30} Days`} />
          </div>
        </section>

        <DocumentCenter documents={documents} />
      </main>
    </div>
  );
}

function DocumentCenter({ documents }: { documents: any[] }) {
  const categories = ["Office Documents", "Immigration Documents", "Personal Documents"];

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
      <h2 className="text-xl font-bold text-[#3f4447] mb-2">My Documents</h2>
      <p className="text-gray-500 text-sm mb-6">View-only access. You can preview and download documents.</p>

      {categories.map((category) => {
        const rows = documents.filter((d) => d.category === category);

        return (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-bold text-[#3f4447] mb-3">{category}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead>
                  <tr className="bg-[#d2b241] text-white">
                    <th className="p-3 text-left">Document Name</th>
                    <th className="p-3 text-left">Date of Issue</th>
                    <th className="p-3 text-left">Date of Expiry</th>
                    <th className="p-3 text-left">Preview</th>
                    <th className="p-3 text-left">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? rows.map((doc) => (
                    <tr key={doc.id} className="border-b">
                      <td className="p-3 font-semibold">{doc.document_name}</td>
                      <td className="p-3">{doc.issue_date || "-"}</td>
                      <td className="p-3">{doc.expiry_date || "No Expiry"}</td>
                      <td className="p-3">
                        <button onClick={() => previewDoc(doc)} className="text-[#d2b241] font-bold">Preview</button>
                      </td>
                      <td className="p-3">
                        <a href={doc.file_data} download={doc.file_name || doc.document_name} className="text-[#d2b241] font-bold">Download</a>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="p-5 text-center text-gray-500">No documents uploaded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function previewDoc(doc: any) {
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(`
      <html>
        <head><title>${doc.document_name}</title></head>
        <body style="margin:0">
          <iframe src="${doc.file_data}" style="width:100%;height:100vh;border:0"></iframe>
        </body>
      </html>
    `);
    w.document.close();
  }
}

function InfoCard({ title, rows }: { title: string; rows: string[][] }) {
  return <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-xl font-bold text-[#3f4447] mb-5">{title}</h2>{rows.map(([l,v])=><div key={l} className="flex justify-between border-b py-2 gap-4"><span className="text-gray-500">{l}</span><b className="text-right">{v}</b></div>)}</section>;
}

function MiniKpi({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border-t-4 border-[#d2b241] shadow-sm p-5 text-center"><p className="text-gray-500 text-sm">{title}</p><h3 className="text-2xl font-bold text-[#3f4447] mt-2">{value}</h3></div>;
}

function Input({ label, value, onChange, type = "text" }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" /></div>;
}

function Select({ label, value, options, onChange }: any) {
  return <div><label className="text-sm font-semibold text-gray-600">{label}</label><select value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white">{options.map((o: string)=><option key={o}>{o}</option>)}</select></div>;
}

function StaffSidebar({ active, employeeId }: { active: string; employeeId: string }) {
  const items = [
    ["Dashboard", "/staff"],
    ["My Profile", `/staff/profile/${employeeId}`],
    ["Apply Leave", `/staff/apply-leave?employee_id=${employeeId}`],
    ["My Leave Requests", `/staff/my-leave-requests?employee_id=${employeeId}`],
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        <div className="text-3xl font-bold tracking-widest mb-10">IC<span className="text-[#d2b241]">D</span>E</div>
        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a key={name} href={href} className={`block px-4 py-3 rounded-xl ${active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"}`}>
              {name}
            </a>
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
