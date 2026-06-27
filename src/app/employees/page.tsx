import { getEmployees } from "@/lib/hr";

const departments = ["Doctors", "Nurses", "Front Office", "Back Office", "Admin", "House Keeping"];

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const params = await searchParams;
  const selectedDepartment = params.department || "";
  const employees = await getEmployees();

  const filteredEmployees = selectedDepartment
    ? employees.filter((e) => e.department === selectedDepartment)
    : [];

  return (
    <div className="min-h-screen bg-[#f7f4ec] flex">
      <Sidebar active="Employees" />

      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-3xl font-bold text-[#3f4447]">Employees</h1>
        <p className="text-gray-500 mb-8">Select a department to view employee records</p>

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {departments.map((department) => {
            const count = employees.filter((e) => e.department === department).length;
            const active = selectedDepartment === department;

            return (
              <a
                key={department}
                href={`/employees?department=${encodeURIComponent(department)}`}
                className={`rounded-2xl shadow-sm px-4 py-4 text-center font-bold border-t-4 border-[#d2b241] hover:shadow-lg transition-all min-h-[96px] flex flex-col items-center justify-center ${
                  active ? "bg-[#d2b241] text-white" : "bg-white text-[#3f4447]"
                }`}
              >
                <div>{department}</div>
                <div className={`text-2xl mt-2 ${active ? "text-white" : "text-[#3f4447]"}`}>
                  {count}
                </div>
              </a>
            );
          })}
        </section>

        {!selectedDepartment ? (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
            <h2 className="text-xl font-bold text-[#3f4447]">Choose Department</h2>
            <p className="text-gray-500 mt-3">
              Click Doctors, Nurses, Front Office, Back Office, Admin, or House Keeping to view employees.
            </p>
            <a href="/employees/add" className="inline-block mt-8 bg-[#d2b241] text-white px-6 py-3 rounded-xl font-bold">
              Add Employee
            </a>
          </section>
        ) : (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-[#3f4447]">
                {selectedDepartment} Employees
              </h2>
              <a href="/employees/add" className="bg-[#d2b241] text-white px-5 py-3 rounded-xl font-bold">
                Add Employee
              </a>
            </div>

            <div className="overflow-x-auto">
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
                  {filteredEmployees.length ? (
                    filteredEmployees.map((e) => {
                      const fullName = `${e.first_name || ""} ${e.middle_name || ""} ${e.last_name || ""}`.replace(/\s+/g, " ").trim();

                      return (
                        <tr key={e.id} className="border-b hover:bg-[#f7f4ec]">
                          <td className="p-3 font-semibold">{e.employee_code}</td>
                          <td className="p-3">
                            <a href={`/employees/${e.id}`} className="text-[#d2b241] font-bold">
                              {fullName}
                            </a>
                          </td>
                          <td className="p-3">{e.department}</td>
                          <td className="p-3">{e.position}</td>
                          <td className="p-3">{e.mobile_number}</td>
                          <td className="p-3">{e.joining_date}</td>
                          <td className="p-3">
                            <span className={`${e.status === "Inactive" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} px-3 py-1 rounded-full font-semibold`}>
                              {e.status || "Active"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No employees found in {selectedDepartment}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Sidebar({ active }: { active: string }) {
  const items = [
    ["Dashboard", "/dashboard"],
    ["Employees", "/employees"],
    ["Leave Requests", "/leave-requests"],
    ["Document Expiry", "/document-expiry"],
    ["Reports", "/reports"],
  ];

  return (
    <aside className="w-72 shrink-0 bg-[#3f4447] text-white p-6 hidden md:flex flex-col justify-between">
      <div>
        

        
        <div className="mb-10 flex justify-center"><img src="/icde-logo.png" alt="ICDE Logo" className="w-44 h-auto object-contain" /></div>
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

      <a href="/login" className="block text-center w-full rounded-2xl border border-white/25 py-4 text-white font-semibold hover:bg-white/10">
        Sign Out
      </a>
    </aside>
  );
}
