export default function AddEmployeeEmploymentPage() {
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
        <a href="/employees/add" className="text-[#d2b241] font-semibold">← Back to Basic Information</a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1>
          <p className="text-gray-500">Step 2 of 4 — Employment Information</p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-4 gap-3 text-center">
            <Step title="Basic Information" done />
            <Step title="Employment" active />
            <Step title="Contact" />
            <Step title="Documents" />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-6">Employment Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select label="Department" options={["Doctors", "Nurses", "Front Office", "Back Office", "Admin", "House Keeping"]} />
            <Field label="Position" placeholder="Enter position" />
            <Field label="Reporting Manager" placeholder="Enter reporting manager" />
            <Select label="Employment Type" options={["Full Time", "Part Time", "Contract", "Probation"]} />
            <Field label="Date of Joining" type="date" />
            <Field label="Contract Start Date" type="date" />
            <Field label="Contract End Date" type="date" />
            <Field label="Annual Ticket Due Date" type="date" />
            <Field label="Basic Salary" placeholder="AED 0.00" />
            <Field label="Other Benefits" placeholder="AED 0.00" />
          </div>

          <div className="flex justify-between mt-8">
            <a href="/employees/add" className="px-6 py-3 rounded-xl border font-semibold">Previous</a>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl border font-semibold">Save Draft</button>
              <a href="/employees/add/contact" className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">
                Next →
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Step({ title, active = false, done = false }: { title: string; active?: boolean; done?: boolean }) {
  return (
    <div className={`rounded-xl py-3 font-semibold ${active || done ? "bg-[#d2b241] text-white" : "bg-[#f7f4ec] text-[#3f4447]"}`}>
      {title}
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <input type={type} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" placeholder={placeholder} />
    </div>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <select className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white">
        <option>Select</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
