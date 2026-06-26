export default function AddEmployeeDocumentsPage() {
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
        <a href="/employees/add/contact" className="text-[#d2b241] font-semibold">← Back to Contact</a>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-[#3f4447]">Add New Employee</h1>
          <p className="text-gray-500">Step 4 of 4 — Initial Documents</p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-4 gap-3 text-center">
            <Step title="Basic Information" done />
            <Step title="Employment" done />
            <Step title="Contact" done />
            <Step title="Documents" active />
          </div>
        </section>

        <DocumentUploadBox title="Office Documents" examples="Employment Contract, Job Description, Joining Form, NDA" />
        <DocumentUploadBox title="Immigration Documents" examples="Emirates ID, Visa, Labour Card, Work Permit" />
        <DocumentUploadBox title="Degrees & Certificates" examples="CV, Degree, BLS Certificate, Health License" />

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-[#3f4447] mb-3">Final Confirmation</h2>
          <p className="text-gray-500 mb-6">
            After creating this employee, the profile will be created and HR can continue uploading additional documents later.
          </p>

          <div className="flex justify-between">
            <a href="/employees/add/contact" className="px-6 py-3 rounded-xl border font-semibold">Previous</a>
            <div className="flex gap-3">
              <button className="px-6 py-3 rounded-xl border font-semibold">Save Draft</button>
              <a href="/employees" className="px-6 py-3 rounded-xl bg-[#d2b241] text-white font-semibold">
                Create Employee
              </a>
            </div>
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
        <Field label="Document Name" placeholder="Enter document name" />
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
          <button className="w-full bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">
            Add Document
          </button>
        </div>
      </div>
    </section>
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
