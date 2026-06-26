import { supabase } from "@/lib/supabase";

export const departments = ["Doctors", "Nurses", "Front Office", "Back Office", "Admin", "House Keeping"];

export async function getEmployees() {
  const { data, error } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export function fullName(e: any) {
  return `${e.first_name || ""} ${e.middle_name || ""} ${e.last_name || ""}`.replace(/\s+/g, " ").trim();
}

export function daysRemaining(dateValue: string | null) {
  if (!dateValue) return null;
  const today = new Date();
  const expiry = new Date(dateValue);
  const diff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}
