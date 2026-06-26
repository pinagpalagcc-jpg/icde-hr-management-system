export default function AddEmployeeContactPage() {
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
        <a href="/employees/add/employment" className="text-[#d2b241] font-semibold">← Back to Employment</a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1>
          <p className="text-gray-500">Step 3 of 4 — Contact Information</p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-4 gap-3 text-center">
            <Step title="Basic Information" done />
            <Step title="Employment" done />
            <Step title="Contact" active />
            <Step title="Documents" />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-6">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Mobile Number" placeholder="+971 50 000 0000" />
            <Field label="Email Address" placeholder="employee@icde.com" />
            <Field label="UAE Residence Address" placeholder="Enter UAE address" />
            <Field label="Home Country Address" placeholder="Enter home country address" />
            <Field label="Emergency Contact Name" placeholder="Enter emergency contact name" />
            <Field label="Emergency Contact Number" placeholder="+971 50 000 0000" />
            <Select label="Relationship" options={["Father", "Mother", "Spouse", "Brother", "Sister", "Friend", "Other"]} />
            <Field label="Alternative Contact Number" placeholder="Optional" />
          </div>

          <div className="flex justify-between mt-8">
            <a href="/employees/add/employment" className="px-6 py-3 rounded-xl border font-semibold">Previous</a>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl border font-semibold">Save Draft</button>
              <a href="/employees/add/documents" className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">
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

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <input className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" placeholder={placeholder} />
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
