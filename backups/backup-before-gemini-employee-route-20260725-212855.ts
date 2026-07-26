import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

type Employee = {
  id: string;
  employee_code?: string | null;
  employee_id?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  department?: string | null;
  position?: string | null;
  employment_type?: string | null;
  joining_date?: string | null;
  contract_end_date?: string | null;
  annual_ticket_due?: string | null;
  mobile_number?: string | null;
  email?: string | null;
  uae_address?: string | null;
  status?: string | null;
  basic_salary?: number | string | null;
  accommodation_allowance?: number | string | null;
  transportation_allowance?: number | string | null;
  total_leaves?: number | string | null;
  unpaid_leave_used?: number | string | null;
  credit_leave_earned?: number | string | null;
  credit_leave_used?: number | string | null;
  credit_leave_balance?: number | string | null;
  paternity_leave_total?: number | string | null;
  paternity_leave_used?: number | string | null;
  paternity_leave_balance?: number | string | null;
  maternity_leave_total?: number | string | null;
  maternity_leave_used?: number | string | null;
  maternity_leave_balance?: number | string | null;
};

type Department = {
  id: string;
  name: string;
  is_active: boolean | null;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[?.,!'"()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function fullName(employee: Employee) {
  return [
    employee.first_name,
    employee.middle_name,
    employee.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function employeeCode(employee: Employee) {
  return (
    employee.employee_code ||
    employee.employee_id ||
    "No ID"
  );
}

function employeeLine(employee: Employee) {
  return [
    `${fullName(employee) || "Unnamed Employee"} (${employeeCode(employee)})`,
    employee.position || "No position",
    employee.department || "No department",
    employee.status || "Available",
  ].join(" — ");
}

function formatEmployeeList(
  employees: Employee[],
  heading: string
) {
  if (!employees.length) {
    return `No employees were found for ${heading.toLowerCase()}.`;
  }

  return [
    `${heading}: ${employees.length} employee(s) found.`,
    "",
    ...employees.map(
      (employee, index) =>
        `${index + 1}. ${employeeLine(employee)}`
    ),
  ].join("\n");
}

function employeeProfile(employee: Employee) {
  return [
    `Employee Profile: ${fullName(employee) || "Unnamed Employee"}`,
    "",
    `Employee ID: ${employeeCode(employee)}`,
    `Department: ${employee.department || "-"}`,
    `Position: ${employee.position || "-"}`,
    `Status: ${employee.status || "Available"}`,
    `Employment Type: ${employee.employment_type || "-"}`,
    `Joining Date: ${employee.joining_date || "-"}`,
    `Contract End Date: ${employee.contract_end_date || "-"}`,
    `Gender: ${employee.gender || "-"}`,
    `Nationality: ${employee.nationality || "-"}`,
    `Date of Birth: ${employee.date_of_birth || "-"}`,
    `Mobile: ${employee.mobile_number || "-"}`,
    `Email: ${employee.email || "-"}`,
    `UAE Address: ${employee.uae_address || "-"}`,
  ].join("\n");
}

function securityError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please log in." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Admin access is required." },
      { status: 403 }
    );
  }

  console.error("HR AI error:", error);

  return NextResponse.json(
    { error: "Unable to answer the HR question." },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const originalQuestion = String(
      body.message || ""
    ).trim();

    if (!originalQuestion) {
      return NextResponse.json(
        { error: "Please enter an HR question." },
        { status: 400 }
      );
    }

    const question = normalize(originalQuestion);

    if (
      question.includes("employee name") ||
      originalQuestion.includes("[employee name]")
    ) {
      return NextResponse.json({
        answer:
          "Please replace [employee name] with the employee’s actual name or Employee ID. Example: Show the profile of Ahmed Khan.",
      });
    }

    const supabase = getSupabaseServer();

    const [employeeResult, departmentResult] =
      await Promise.all([
        supabase
          .from("employees")
          .select("*")
          .order("first_name", {
            ascending: true,
          }),

        supabase
          .from("departments")
          .select("id,name,is_active")
          .order("name", {
            ascending: true,
          }),
      ]);

    if (employeeResult.error) {
      throw new Error(
        employeeResult.error.message
      );
    }

    if (departmentResult.error) {
      throw new Error(
        departmentResult.error.message
      );
    }

    const employees =
      (employeeResult.data || []) as Employee[];

    const departments =
      (departmentResult.data || []) as Department[];

    const inactiveEmployees = employees.filter(
      (employee) =>
        includesAny(
          normalize(employee.status || ""),
          [
            "inactive",
            "deactivated",
            "terminated",
          ]
        )
    );

    const activeEmployees = employees.filter(
      (employee) =>
        !inactiveEmployees.some(
          (inactive) =>
            inactive.id === employee.id
        )
    );

    const departmentNames = Array.from(
      new Set(
        employees
          .map((employee) =>
            String(
              employee.department || ""
            ).trim()
          )
          .filter(Boolean)
      )
    ).sort((a, b) =>
      a.localeCompare(b)
    );

    const matchedEmployee = [...employees]
      .sort(
        (a, b) =>
          fullName(b).length -
          fullName(a).length
      )
      .find((employee) => {
        const name = normalize(
          fullName(employee)
        );

        const code = normalize(
          employeeCode(employee)
        );

        return (
          (name.length >= 4 &&
            question.includes(name)) ||
          (code &&
            code !== "no id" &&
            question.includes(code))
        );
      });

    if (matchedEmployee) {
      if (
        includesAny(question, [
          "salary",
          "basic salary",
          "allowance",
          "compensation",
        ])
      ) {
        return NextResponse.json({
          answer: [
            `Salary Information: ${fullName(matchedEmployee)}`,
            "",
            `Basic Salary: ${matchedEmployee.basic_salary ?? "-"}`,
            `Accommodation Allowance: ${matchedEmployee.accommodation_allowance ?? "-"}`,
            `Transportation Allowance: ${matchedEmployee.transportation_allowance ?? "-"}`,
          ].join("\n"),
        });
      }

      if (
        includesAny(question, [
          "email",
          "mobile",
          "phone",
          "contact",
          "address",
        ])
      ) {
        return NextResponse.json({
          answer: [
            `Contact Information: ${fullName(matchedEmployee)}`,
            "",
            `Mobile: ${matchedEmployee.mobile_number || "-"}`,
            `Email: ${matchedEmployee.email || "-"}`,
            `UAE Address: ${matchedEmployee.uae_address || "-"}`,
          ].join("\n"),
        });
      }

      return NextResponse.json({
        answer: employeeProfile(
          matchedEmployee
        ),
      });
    }

    if (
      includesAny(question, [
        "department wise",
        "department-wise",
        "by department",
        "employees per department",
        "employee count by department",
        "department summary",
      ])
    ) {
      const lines = departmentNames.map(
        (department) => {
          const count = employees.filter(
            (employee) =>
              normalize(
                employee.department || ""
              ) === normalize(department)
          ).length;

          return `${department}: ${count}`;
        }
      );

      return NextResponse.json({
        answer: [
          "Employee Summary by Department",
          "",
          ...lines,
          "",
          `Total Employees: ${employees.length}`,
        ].join("\n"),
      });
    }

    if (
      includesAny(question, [
        "how many employees",
        "total employees",
        "number of employees",
        "employee count",
      ])
    ) {
      return NextResponse.json({
        answer: [
          `Total Employees: ${employees.length}`,
          `Active Employees: ${activeEmployees.length}`,
          `Inactive Employees: ${inactiveEmployees.length}`,
        ].join("\n"),
      });
    }

    if (
      includesAny(question, [
        "active employees",
        "how many active",
        "total active",
      ])
    ) {
      return NextResponse.json({
        answer: formatEmployeeList(
          activeEmployees,
          "Active Employees"
        ),
      });
    }

    if (
      includesAny(question, [
        "inactive employees",
        "deactivated employees",
        "terminated employees",
      ])
    ) {
      return NextResponse.json({
        answer: formatEmployeeList(
          inactiveEmployees,
          "Inactive Employees"
        ),
      });
    }

    if (
      includesAny(question, [
        "list departments",
        "show departments",
        "all departments",
        "department list",
        "how many departments",
        "total departments",
      ])
    ) {
      return NextResponse.json({
        answer: [
          `Total Departments: ${departmentNames.length}`,
          "",
          ...departmentNames.map(
            (department, index) =>
              `${index + 1}. ${department}`
          ),
        ].join("\n"),
      });
    }

    const matchedDepartment =
      departmentNames.find(
        (department) =>
          question.includes(
            normalize(department)
          )
      );

    if (matchedDepartment) {
      const matches = employees.filter(
        (employee) =>
          normalize(
            employee.department || ""
          ) ===
          normalize(matchedDepartment)
      );

      return NextResponse.json({
        answer: formatEmployeeList(
          matches,
          `Employees in ${matchedDepartment}`
        ),
      });
    }

    const doctorPositionTerms = [
      "dentist",
      "orthodontist",
      "endodontist",
      "periodontist",
      "pedodontist",
      "prosthodontist",
      "oral surgeon",
      "maxillofacial",
    ];

    if (
      includesAny(question, [
        "doctor",
        "doctors",
        "dentist",
        "dentists",
      ])
    ) {
      const doctors = employees.filter(
        (employee) => {
          const position = normalize(
            employee.position || ""
          );

          return doctorPositionTerms.some(
            (term) =>
              position.includes(term)
          );
        }
      );

      return NextResponse.json({
        answer: formatEmployeeList(
          doctors,
          "Doctors"
        ),
      });
    }

    const positionTerms = Array.from(
      new Set(
        employees
          .map((employee) =>
            normalize(
              employee.position || ""
            )
          )
          .filter(Boolean)
      )
    ).sort(
      (a, b) => b.length - a.length
    );

    const matchedPosition =
      positionTerms.find((position) =>
        question.includes(position)
      );

    if (matchedPosition) {
      const matches = employees.filter(
        (employee) =>
          normalize(
            employee.position || ""
          ) === matchedPosition
      );

      return NextResponse.json({
        answer: formatEmployeeList(
          matches,
          `Employees with position ${matchedPosition}`
        ),
      });
    }

    if (
      includesAny(question, [
        "joined this month",
        "hired this month",
      ])
    ) {
      const now = new Date();

      const matches = employees.filter(
        (employee) => {
          if (!employee.joining_date) {
            return false;
          }

          const joiningDate = new Date(
            `${employee.joining_date}T00:00:00`
          );

          return (
            joiningDate.getFullYear() ===
              now.getFullYear() &&
            joiningDate.getMonth() ===
              now.getMonth()
          );
        }
      );

      return NextResponse.json({
        answer: formatEmployeeList(
          matches,
          "Employees Who Joined This Month"
        ),
      });
    }

    if (
      includesAny(question, [
        "list all employees",
        "show all employees",
        "employee list",
      ])
    ) {
      return NextResponse.json({
        answer: formatEmployeeList(
          employees,
          "All Employees"
        ),
      });
    }

    return NextResponse.json({
      answer:
        "The Employees module is connected. You can ask about employee totals, active or inactive employees, departments, positions, doctors, joining dates, contact details, salary details, or search an employee by name or Employee ID.",
    });
  } catch (error) {
    return securityError(error);
  }
}
