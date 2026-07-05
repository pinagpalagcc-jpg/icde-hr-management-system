import { supabase } from "@/lib/supabase";

export async function createNotification(
  employeeId: string,
  title: string,
  message: string,
  type = "General"
) {
  return await supabase.from("notifications").insert({
    employee_id: employeeId,
    title,
    message,
    type,
  });
}
