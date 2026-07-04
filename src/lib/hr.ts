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

export async function getEmployees() {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
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

  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
  return (data || []).map((l: any) => l.employee_id).filter(Boolean);
}

export function displayStatus(employee: any, activeLeaveIds: string[] = []) {
  if (activeLeaveIds.includes(employee.id)) return "On Leave";
  return employee.status || "Available";
}
