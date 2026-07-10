import { supabase } from "@/lib/supabase";

export const departments = [
  "Clinicians",
  "Admin",
  "Front Desk",
  "Dental Assistant",
  "Insurance",
  "House Keeping",
  "Dependants",
];

function employeeIdNumber(employeeCode: string | null | undefined) {
  const matches = String(employeeCode || "").match(/\d+/g);

  if (!matches?.length) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Number(matches.join(""));
}

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*");

  if (error) return [];

  return (data || []).sort((a: any, b: any) => {
    const numberA = employeeIdNumber(a.employee_code);
    const numberB = employeeIdNumber(b.employee_code);

    if (numberA !== numberB) {
      return numberA - numberB;
    }

    return String(a.employee_code || "").localeCompare(
      String(b.employee_code || "")
    );
  });
}

export function fullName(e: any) {
  return `${e.first_name || ""} ${e.middle_name || ""} ${e.last_name || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

export function daysRemaining(dateValue: string | null) {
  if (!dateValue) return null;

  const today = new Date();
  const expiry = new Date(dateValue);

  return Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export async function getActiveLeaveEmployeeIds() {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("leave_requests")
    .select("employee_id")
    .eq("status", "Approved")
    .lte("from_date", today)
    .gte("to_date", today);

  if (error) return [];

  return (data || [])
    .map((leave: any) => leave.employee_id)
    .filter(Boolean);
}

export function displayStatus(
  employee: any,
  activeLeaveIds: string[] = []
) {
  if (activeLeaveIds.includes(employee.id)) {
    return "On Leave";
  }

  return employee.status || "Available";
}