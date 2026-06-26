export default function EmployeesPage() {
  const employees = [
    { id: "ICDE-001", name: "Dr. Ahmad Khan", department: "Doctors", position: "Dentist", phone: "+971 50 000 0001", joining: "2024-01-15", status: "Active" },
    { id: "ICDE-002", name: "Nurse Maria", department: "Nurses", position: "Registered Nurse", phone: "+971 50 000 0002", joining: "2023-08-10", status: "Active" },
    { id: "ICDE-003", name: "Fatima Ali", department: "Front Office", position: "Receptionist", phone: "+971 50 000 0003", joining: "2025-02-01", status: "Active" }
  ];

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
        <h1 className="text-3xl font-bold text-[#3f4447]">Employees</h1>
        <p className="text-gray-500 mb-8">Manage employee records by department</p>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {["Doctors", "Nurses", "Front Office", "Back Office", "Admin", "House Keeping"].map((d) => (
            <button key={d} className="bg-white rounded-2xl p-4 shadow-sm border-t-4 border-[#d2b241] hover:shadow-lg hover:-translate-y-1 transition-all text-center">
              <p className="text-sm font-semibold text-[#3f4447]">{d}</p>
            </button>
          ))}
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-[#3f4447]">Employee List</h2>
            <a href="/employees/add" className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-semibold">Add Employee</a>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#3f4447] text-white">
                <th className="p-3 text-left">Employee ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Position</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Joining Date</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b hover:bg-[#f7f4ec]">
                  <td className="p-3 font-semibold">{e.id}</td>
                  <td className="p-3 font-bold text-[#d2b241] cursor-pointer"><a href={`/employees/${e.id}`}>{e.name}</a></td>
                  <td className="p-3">{e.department}</td>
                  <td className="p-3">{e.position}</td>
                  <td className="p-3">{e.phone}</td>
                  <td className="p-3">{e.joining}</td>
                  <td className="p-3">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
