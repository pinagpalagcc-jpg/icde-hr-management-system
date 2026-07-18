"use client";

type EmployeeExportRow = {
  employeeId: string;
  name: string;
  department: string;
  position: string;
  phone: string;
  joiningDate: string;
  status: string;
};

export default function ExportEmployeesButton({
  employees,
  fileName,
}: {
  employees: EmployeeExportRow[];
  fileName: string;
}) {
  async function exportToExcel() {
    if (!employees.length) {
      alert("No employee records are available to export.");
      return;
    }

    const XLSX = await import("xlsx");

    const rows = employees.map((employee) => ({
      "Employee ID": employee.employeeId,
      Name: employee.name,
      Department: employee.department,
      Position: employee.position,
      Phone: employee.phone,
      "Joining Date": employee.joiningDate,
      Status: employee.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 32 },
      { wch: 22 },
      { wch: 25 },
      { wch: 20 },
      { wch: 16 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Employees"
    );

    XLSX.writeFile(
      workbook,
      `${fileName}.xlsx`
    );
  }

  return (
    <button
      type="button"
      onClick={exportToExcel}
      className="bg-green-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
    >
      Export to Excel
    </button>
  );
}
