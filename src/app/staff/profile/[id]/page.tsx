"use client";
import { useEffect, useState } from "react";
import SalaryIncrementTable from "@/components/SalaryIncrementTable";
import EmployeeLoanLedger from "@/components/EmployeeLoanLedger";

const TABS = [
  "Personal Information",
  "Salary & Benefits",
  "Leave Details",
  "Office Documents",
  "Immigration Documents",
  "Personal Documents",
  "HAAD",
] as const;

type TabName = (typeof TABS)[number];

export default function StaffProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [annualLeaveSummary, setAnnualLeaveSummary] = useState({
    used: 0,
    balance: 0,
  });
  const [activeTab, setActiveTab] = useState<TabName>("Personal Information");

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      loadEmployee(p.id);
      loadDocuments(p.id);
    });
  }, [params]);

  async function loadEmployee(employeeId: string) {
    const [employeeResponse, leaveResponse] = await Promise.all([
      fetch(`/api/employees/${employeeId}`, {
        cache: "no-store",
      }),
      fetch("/api/leave-requests", {
        cache: "no-store",
      }),
    ]);

    const employeeData = await employeeResponse.json();
    const leaveData = await leaveResponse.json();

    setEmployee(employeeData);

    const annualGroupTypes = [
      "Annual Leave",
      "Sick Leave",
      "Emergency Leave",
  "Encash Leave",
    ];

    const approvedAnnualRequests = Array.isArray(leaveData)
      ? leaveData.filter((request: any) => {
          return (
            String(request.employee_id) === String(employeeId) &&
            String(request.status).toLowerCase() === "approved" &&
            annualGroupTypes.includes(
              String(request.leave_type)
            )
          );
        })
      : [];

    const used = approvedAnnualRequests.reduce(
      (total: number, request: any) =>
        total + Number(request.total_days || 0),
      0
    );

    const entitlement = Number(
      employeeData.total_leaves ?? 0
    );

    setAnnualLeaveSummary({
      used,
      balance: Math.max(entitlement - used, 0),
    });
  }

  async function loadDocuments(employeeId: string) {
    const data = await fetch(`/api/employee-documents?employee_id=${employeeId}`).then((r) => r.json());
    setDocuments(Array.isArray(data) ? data : []);
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#f7f4ec] flex">
        <StaffSidebar active="My Profile" employeeId={id} />
        <main className="flex-1 p-8">Loading...</main>
      </div>
    );
  }

  const fullName = `${employee.first_name || ""} ${employee.middle_name || ""} ${employee.last_name || ""}`
    .replace(/\s+/g, " ")
    .trim();

  const initials = `${employee.first_name?.[0] || ""}${employee.last_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <StaffSidebar active="My Profile" employeeId={id} />

      <main className="flex-1 p-8 overflow-x-hidden">
        <a href="/staff" className="text-[#d2b241] font-semibold">
          ← Back to Staff Portal
        </a>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-2xl bg-[#3f4447] text-white flex items-center justify-center text-4xl font-bold overflow-hidden">
              {employee.profile_photo ? (
                <img
                  src={employee.profile_photo}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                initials
              )}
            </div>

            <div>
              <h1 className="text-3xl font-bold text-[#3f4447]">{fullName}</h1>
              <p className="text-gray-500">Employee ID: {employee.employee_code || "-"}</p>
              <p className="text-gray-500">
                Department: {employee.department || "-"} | Position: {employee.position || "-"}
              </p>
              <span className="inline-block mt-3 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                {employee.status || "Available"}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {TABS.filter(
              (tab) =>
                tab !== "HAAD" ||
                ["Clinicians", "Dental Assistant"].includes(
                  employee.department || ""
                )
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 rounded-2xl font-bold text-sm shadow-md border-2 transition-all ${
                  activeTab === tab
                    ? "bg-[#d2b241] text-white border-[#b99316] scale-[1.03]"
                    : tab === "Personal Information"
                    ? "bg-[#efe7ff] text-[#5b21b6] border-[#c4b5fd] hover:bg-[#ddd6fe]"
                    : tab === "Salary & Benefits"
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

        {activeTab === "Personal Information" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-[#3f4447] mb-5">
              Personal Information
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-[1500px] w-full border border-gray-200">
                <thead className="bg-[#d2b241] text-white">
                  <tr>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Employee ID</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Full Name</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Mobile Number</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Email</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Date of Birth</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Nationality</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Gender</th>
                    <th className="px-2 py-2 text-left whitespace-nowrap text-sm">Resident Address</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-t">
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{employee.employee_code || "-"}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{fullName || "-"}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{employee.mobile_number || "-"}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{employee.email || "-"}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{employee.date_of_birth || "-"}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{employee.nationality || "-"}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{employee.gender || "-"}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm">{employee.uae_address || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Salary & Benefits" && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-xl font-bold text-[#3f4447] mb-5">
              Salary & Benefits
            </h2>

            <div className="overflow-x-auto border rounded-xl">
              <table className="min-w-[1100px] w-full text-sm">
                <thead>
                  <tr className="bg-[#d2b241] text-white">
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Department</th>
                    <th className="p-4 text-left">Basic Salary</th>
                    <th className="p-4 text-left">Accommodation</th>
                    <th className="p-4 text-left">Transportation</th>
                    <th className="p-4 text-left">Total</th>
                  </tr>
                </thead>

                <tbody>
                  <tr className="border-t">
                    <td className="p-4 whitespace-nowrap">
                      {employee.employee_code || "-"}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {fullName || "-"}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {employee.department || "-"}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      AED {Number(employee.basic_salary || 0).toLocaleString()}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      AED{" "}
                      {Number(
                        employee.accommodation_allowance || 0
                      ).toLocaleString()}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      AED{" "}
                      {Number(
                        employee.transportation_allowance || 0
                      ).toLocaleString()}
                    </td>

                    <td className="p-4 font-bold text-[#3f4447] whitespace-nowrap">
                      AED{" "}
                      {(
                        Number(employee.basic_salary || 0) +
                        Number(employee.accommodation_allowance || 0) +
                        Number(employee.transportation_allowance || 0)
                      ).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "Salary & Benefits" && (
          <SalaryIncrementTable
            employeeId={id}
            currentSalary={Number(employee.basic_salary || 0)}
            readOnly
            onSalaryChanged={() => loadEmployee(id)}
          />
        )}

        {activeTab === "Salary & Benefits" && (
          <EmployeeLoanLedger
            employeeId={id}
            readOnly
          />
        )}

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
            onClick={() =>
              window.location.href =
                `/staff/profile/${id}/annual-leave-register?portal=staff`
            }
          />
          <MiniKpi
            title="Used"
            value={`${annualLeaveSummary.used} Days`}
              onClick={() =>
                window.location.href =
                  `/staff/profile/${id}/leave-ledger?type=annual`
              }
          />
          <MiniKpi
            title="Balance"
            value={`${annualLeaveSummary.balance} Days`}
          />
        </div>
      </div>

      {String(employee.gender || "")
        .trim()
        .toLowerCase() === "male" && (
      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Paternity Leave
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniKpi
  title="Total"
  value={`${employee.paternity_leave_total ?? 0} Days`}
  onClick={() =>
    (window.location.href = `/staff/profile/${id}/paternity-leave-register?portal=staff`)
  }
/>
          <MiniKpi
            title="Used"
            value={`${employee.paternity_leave_used ?? 0} Days`}
              onClick={() =>
                window.location.href =
                  `/staff/profile/${id}/paternity-leave-register?portal=staff`
              }
          />
          <MiniKpi
  title="Balance"
  value={`${employee.paternity_leave_total ?? 0} Days`}
  onClick={() =>
    (window.location.href = `/staff/profile/${id}/paternity-leave-register?portal=staff`)
  }
/>
        </div>
      </div>
      )}

      {String(employee.gender || "")
        .trim()
        .toLowerCase() === "female" && (
      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Maternity Leave
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniKpi
  title="Balance"
  value={`${employee.maternity_leave_total ?? 0} Days`}
  onClick={() =>
    (window.location.href = `/staff/profile/${id}/maternity-leave-register?portal=staff`)
  }
/>
          <MiniKpi
            title="Used"
            value={`${employee.maternity_leave_used ?? 0} Days`}
              onClick={() =>
                window.location.href =
                  `/staff/profile/${id}/maternity-leave-register?portal=staff`
              }
          />
          <MiniKpi
  title="Total"
  value={`${employee.maternity_leave_total ?? 0} Days`}
  onClick={() =>
    (window.location.href = `/staff/profile/${id}/maternity-leave-register?portal=staff`)
  }
/>
        </div>
      </div>
      )}

      <div className="rounded-2xl border border-gray-100 p-5">
        <h3 className="text-lg font-bold text-[#3f4447] mb-4">
          Holiday Credit Leave
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MiniKpi
            title="Earned"
            value={`${employee.credit_leave_earned ?? 0} Days`}
              onClick={() =>
                window.location.href =
                  `/staff/profile/${id}/holiday-credit-ledger`
              }
          />
          <MiniKpi
            title="Used"
            value={`${employee.credit_leave_used ?? 0} Days`}
              onClick={() =>
                window.location.href =
                  `/staff/profile/${id}/holiday-credit-ledger`
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

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <MiniKpi
            title="Used"
            value={`${employee.unpaid_leave_used ?? 0} Days`}
          />
        </div>
      </div>
    </div>
  </section>
)}

        {activeTab === "Office Documents" && (
          <DocumentCenter category="Office Documents" documents={documents} />
        )}

        {activeTab === "Immigration Documents" && (
          <DocumentCenter category="Immigration Documents" documents={documents} />
        )}

        {activeTab === "Personal Documents" && (
          <DocumentCenter category="Personal Documents" documents={documents} />
        )}

        {activeTab === "HAAD" &&
          ["Clinicians", "Dental Assistant"].includes(
            employee.department || ""
          ) && (
            <DocumentCenter
              category="HAAD"
              documents={documents}
            />
          )}
      </main>
    </div>
  );
}

function DocumentCenter({
  category,
  documents,
}: {
  category: string;
  documents: any[];
}) {
  const rows = documents.filter((doc: any) => doc.category === category);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-10">
      <h2 className="text-xl font-bold text-[#3f4447] mb-2">{category}</h2>
      <p className="text-gray-500 text-sm mb-6">
        View-only access. You can preview and download documents.
      </p>

      <div className="overflow-x-auto border rounded-xl">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="bg-[#d2b241] text-white">
              <th className="p-3 text-left">Document Name</th>
              <th className="p-3 text-left">Date of Issue</th>
              <th className="p-3 text-left">Date of Expiry</th>
              <th className="p-3 text-left">Remaining Days</th>
              <th className="p-3 text-left">Preview</th>
              <th className="p-3 text-left">Download</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((doc: any) => {
                const info = staffDocExpiryInfo(doc.expiry_date);

                return (
                  <tr key={doc.id} className="border-b hover:bg-[#f7f4ec]">
                    <td className="p-3 font-semibold">{doc.document_name}</td>
                    <td className="p-3">{doc.issue_date || "-"}</td>
                    <td className="p-3">{doc.expiry_date || "No Expiry"}</td>
                    <td className="p-3">
                      <span className={`${info.className} px-3 py-1 rounded-full font-semibold`}>
                        {info.text}
                      </span>
                    </td>
                    <td className="p-3">
                      {doc.file_data ? (
                        <button
                          onClick={() => previewDoc(doc)}
                          className="text-[#d2b241] font-bold"
                        >
                          Preview
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-3">
                      {doc.file_data ? (
                        <a
                          href={doc.file_data}
                          download={doc.file_name || doc.document_name}
                          className="text-[#d2b241] font-bold"
                        >
                          Download
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="p-5 text-center text-gray-500">
                  No {category.toLowerCase()} uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Staff can only preview and download documents. Upload and delete are Admin-only.
      </p>
    </section>
  );
}

function staffDocExpiryInfo(expiryDate: string | null) {
  if (!expiryDate) {
    return { text: "No Expiry", className: "bg-gray-100 text-gray-700" };
  }

  const today = new Date();
  const expiry = new Date(expiryDate);
  const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { text: `${Math.abs(days)} days expired`, className: "bg-red-200 text-red-900" };
  if (days <= 30) return { text: `${days} days`, className: "bg-red-100 text-red-700" };
  if (days <= 60) return { text: `${days} days`, className: "bg-orange-100 text-orange-700" };
  if (days <= 90) return { text: `${days} days`, className: "bg-yellow-100 text-yellow-700" };

  return { text: `${days} days`, className: "bg-green-100 text-green-700" };
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
      <h3 className="text-2xl font-bold text-[#3f4447] mt-2">
        {value}
      </h3>
    </button>
  );
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
        <div className="mb-10">
          <div className="text-4xl font-black tracking-widest">
            <span className="text-white">IC</span>
            <span className="text-[#d2b241]">D</span>
            <span className="text-white">E</span>
          </div>
          <div className="text-sm text-white/90 mt-3">HR Management Portal</div>
          <div className="w-24 h-[3px] bg-[#d2b241] mt-3 rounded-full"></div>
          <div className="text-xs text-white/60 mt-3">@2026 V.1.1</div>
        </div>

        <nav className="space-y-3">
          {items.map(([name, href]) => (
            <a
              key={name}
              href={href}
              className={`block px-4 py-3 rounded-xl ${
                active === name ? "bg-[#d2b241] font-semibold" : "hover:bg-white/10"
              }`}
            >
              {name}
            </a>
          ))}
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