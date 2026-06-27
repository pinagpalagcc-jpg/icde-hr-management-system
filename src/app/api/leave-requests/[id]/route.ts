import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const { data: leave, error: leaveError } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (leaveError || !leave) {
    return NextResponse.json({ error: leaveError?.message || "Leave request not found" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.status === "Approved" && leave.status !== "Approved") {
    const { data: employee } = await supabase
      .from("employees")
      .select("*")
      .eq("id", leave.employee_id)
      .single();

    if (employee) {
      const used = Number(employee.leaves_used || 0) + Number(leave.total_days || 0);
      const balance = Math.max(Number(employee.balance_leaves || 0) - Number(leave.total_days || 0), 0);

      await supabase
        .from("employees")
        .update({
          leaves_used: used,
          balance_leaves: balance,
        })
        .eq("id", leave.employee_id);
    }
  }

  return NextResponse.json(data);
}
