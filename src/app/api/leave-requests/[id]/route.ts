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

  if (leave?.status === "Approved" && leave?.employee_id) {
    const { error: empError } = await supabase
      .from("employees")
      .update({ status: "On Leave" })
      .eq("id", leave.employee_id);

    if (empError) {
      return NextResponse.json({ error: empError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    leave,
    message:
      leave?.status === "Approved"
        ? "Leave approved and employee status changed to On Leave."
        : "Leave request updated.",
  });
}
