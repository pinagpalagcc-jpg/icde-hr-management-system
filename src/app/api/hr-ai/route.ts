import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

type Employee = {
  id: string;
  employee_code: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  department: string | null;
  position: string | null;
  joining_date: string | null;
  status: string | null;
};

type Department = {
  id: string;
  name: string;
  is_active: boolean | null;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[?.,!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function employeeLine(employee: Employee) {
  return `${fullName(employee) || "Unnamed Employee"} (${employee.employee_code || "No ID"}) — ${employee.position || "No position"}, ${employee.department || "No department"}`;
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
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
    const originalQuestion = String(body.message || "").trim();

    if (!originalQuestion) {
      return NextResponse.json(
        { error: "Please enter an HR question." },
        { status: 400 }
      );
    }

    const question = normalize(originalQuestion);
    const supabase = getSupabaseServer();

    const [employeeResult, departmentResult] =
      await Promise.all([
        supabase
          .from("employees")
          .select(
            "id,employee_code,first_name,middle_name,last_name,department,position,joining_date,status"
          )
          .order("first_name", { ascending: true }),

        supabase
          .from("departments")
          .select("id,name,is_active")
          .order("name", { ascending: true }),
      ]);

    if (employeeResult.error) {
      throw new Error(employeeResult.error.message);
    }

    if (departmentResult.error) {
      throw new Error(departmentResult.error.message);
    }

    const employees =
      (employeeResult.data || []) as Employee[];

    const departments =
      (departmentResult.data || []) as Department[];

    const inactiveEmployees = employees.filter((employee) =>
      includesAny(normalize(employee.status || ""), [
        "inactive",
        "deactivated",
        "terminated",
      ])
    );

    const activeEmployees = employees.filter(
      (employee) => !inactiveEmployees.includes(employee)
    );

    if (
      includesAny(question, [
        "how many employees",
        "total employees",
        "number of employees",
        "employee count",
      ])
    ) {
      return NextResponse.json({
        answer: `There are ${employees.length} employees in the HR system. ${activeEmployees.length} are active and ${inactiveEmployees.length} are inactive.`,
      });
    }

    if (
      includesAny(question, [
        "how many active",
        "total active",
        "active employees",
      ])
    ) {
      return NextResponse.json({
        answer: `There are ${activeEmployees.length} active employees.`,
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
        answer: inactiveEmployees.length
          ? `${inactiveEmployees.length} inactive employee(s):\n\n${inactiveEmployees
              .map(employeeLine)
              .join("\n")}`
          : "No inactive employees were found.",
      });
    }

    if (
      includesAny(question, [
        "list departments",
        "show departments",
        "all departments",
        "department list",
      ])
    ) {
      return NextResponse.json({
        answer: departments.length
          ? `There are ${departments.length} departments:\n\n${departments
              .map(
                (department, index) =>
                  `${index + 1}. ${department.name}`
              )
              .join("\n")}`
          : "No departments were found.",
      });
    }

    if (
      includesAny(question, [
        "how many departments",
        "total departments",
        "number of departments",
      ])
    ) {
      return NextResponse.json({
        answer: `There are ${departments.length} departments.`,
      });
    }

    const matchedDepartment = departments.find((department) =>
      question.includes(normalize(department.name))
    );

    if (matchedDepartment) {
      const matches = employees.filter(
        (employee) =>
          normalize(employee.department || "") ===
          normalize(matchedDepartment.name)
      );

      return NextResponse.json({
        answer: matches.length
          ? `${matches.length} employee(s) are in ${matchedDepartment.name}:\n\n${matches
              .map(employeeLine)
              .join("\n")}`
          : `No employees were found in ${matchedDepartment.name}.`,
      });
    }

    const positionTerms = [
      "doctor",
      "dentist",
      "clinician",
      "receptionist",
      "dental assistant",
      "orthodontist",
      "hygienist",
      "cleaner",
      "accountant",
      "manager",
      "technician",
      "clerk",
    ];

    const positionTerm = positionTerms.find((term) =>
      question.includes(term)
    );

    if (positionTerm) {
      const matches = employees.filter((employee) => {
        const position = normalize(employee.position || "");
        const department = normalize(employee.department || "");

        if (
          positionTerm === "doctor" ||
          positionTerm === "clinician"
        ) {
          return (
            position.includes("dentist") ||
            department.includes("clinician")
          );
        }

        return (
          position.includes(positionTerm) ||
          department.includes(positionTerm)
        );
      });

      return NextResponse.json({
        answer: matches.length
          ? `${matches.length} matching employee(s):\n\n${matches
              .map(employeeLine)
              .join("\n")}`
          : `No employees matching "${positionTerm}" were found.`,
      });
    }

    if (
      includesAny(question, [
        "joined this month",
        "hired this month",
      ])
    ) {
      const now = new Date();

      const matches = employees.filter((employee) => {
        if (!employee.joining_date) return false;

        const joiningDate = new Date(
          `${employee.joining_date}T00:00:00`
        );

        return (
          joiningDate.getFullYear() === now.getFullYear() &&
          joiningDate.getMonth() === now.getMonth()
        );
      });

      return NextResponse.json({
        answer: matches.length
          ? `${matches.length} employee(s) joined this month:\n\n${matches
              .map(employeeLine)
              .join("\n")}`
          : "No employees joined this month.",
      });
    }

    return NextResponse.json({
      answer:
        "Phase 1 currently supports employee totals, active or inactive employees, departments, positions, and employees who joined this month.",
    });
  } catch (error) {
    return securityError(error);
  }
}
