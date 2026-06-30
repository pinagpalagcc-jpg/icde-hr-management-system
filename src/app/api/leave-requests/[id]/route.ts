import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);
  const body = await req.json();

  const { data: oldLeave, error: oldError } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (oldError) return NextResponse.json({ error: oldError.message }, { status: 500 });

  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.rejection_reason !== undefined) updateData.rejection_reason = body.rejection_reason;

  const { data: leave, error } = await supabase
    .from("leave_requests")
    .update(updateData)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const newlyApproved =
    oldLeave.status !== "Approved" &&
    leave.status === "Approved" &&
    leave.employee_id;

  if (newlyApproved) {
    const days = Number(leave.total_days || 0);

    const { data: employee, error: empReadError } = await supabase
      .from("employees")
      .select("leaves_used,balance_leaves")
      .eq("id", leave.employee_id)
      .single();

    if (empReadError) {
      return NextResponse.json({ error: empReadError.message }, { status: 500 });
    }

    const currentUsed = Number(employee?.leaves_used || 0);
    const currentBalance = Number(employee?.balance_leaves ?? 30);

    const { error: empUpdateError } = await supabase
      .from("employees")
      .update({
        leaves_used: currentUsed + days,
        balance_leaves: Math.max(currentBalance - days, 0),
      })
      .eq("id", leave.employee_id);

    if (empUpdateError) {
      return NextResponse.json({ error: empUpdateError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    leave,
    message:
      leave.status === "Approved"
        ? "Leave approved and balance updated."
        : "Leave request updated.",
  });
}
