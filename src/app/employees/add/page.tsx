export default function AddEmployeePage() {
  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <aside className="w-72 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
        <div>
          <div className="text-3xl font-bold tracking-widest mb-10">
            IC<span className="text-[#d2b241]">D</span>E
          </div>

          <nav className="space-y-3">
            <a href="/dashboard" className="block px-4 py-3 rounded-xl hover:bg-white/10">Dashboard</a>
            <a href="/employees" className="block px-4 py-3 rounded-xl bg-[#d2b241] font-semibold">Employees</a>
            <a className="block px-4 py-3 rounded-xl hover:bg-white/10">Leave Requests</a>
            <a className="block px-4 py-3 rounded-xl hover:bg-white/10">Document Expiry</a>
            <a className="block px-4 py-3 rounded-xl hover:bg-white/10">Reports</a>
          </nav>
        </div>

        <button className="w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10 transition-all">
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-8">
        <a href="/employees" className="text-[#d2b241] font-semibold">← Back to Employees</a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1>
          <p className="text-gray-500">Step 1 of 4 — Basic Information</p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-4 gap-3 text-center">
            <Step title="Basic Information" active />
            <Step title="Employment" />
            <Step title="Contact" />
            <Step title="Documents" />
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-[#3f4447] mb-6">Basic Information</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Employee ID" value="ICDE-004" />
              <Field label="First Name" placeholder="Enter first name" />
              <Field label="Middle Name" placeholder="Optional" />
              <Field label="Last Name" placeholder="Enter last name" />
              <Field label="Date of Birth" type="date" />
              <Select label="Gender" options={["Male", "Female"]} />
              <Field label="Nationality" placeholder="Enter nationality" />
              <Select label="Marital Status" options={["Single", "Married", "Divorced", "Widowed"]} />
              <Field label="Blood Group" placeholder="Optional" />
            </div>

            <div className="bg-[#f7f4ec] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
              <div className="w-36 h-36 rounded-2xl bg-[#3f4447] text-white flex items-center justify-center text-4xl font-bold mb-4">
                Photo
              </div>
              <label className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold cursor-pointer">
                Upload Photo
                <input type="file" className="hidden" />
              </label>
              <p className="text-gray-500 text-sm mt-3">Passport size photo recommended</p>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <a href="/employees" className="px-6 py-3 rounded-xl border font-semibold">Cancel</a>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl border font-semibold">Save Draft</button>
              <a href="/employees/add/employment" className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">
                Next →
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Step({ title, active = false }: { title: string; active?: boolean }) {
  return (
    <div className={`rounded-xl py-3 font-semibold ${active ? "bg-[#d2b241] text-white" : "bg-[#f7f4ec] text-[#3f4447]"}`}>
      {title}
    </div>
  );
}

function Field({ label, placeholder, type = "text", value }: { label: string; placeholder?: string; type?: string; value?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-600">{label}</label>
      <input type={type} defaultValue={value} readOnly={!!value} className="mt-2 w-full border rounded-xl px-4 py-3 outline-none bg-white" placeholder={placeholder} />
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
