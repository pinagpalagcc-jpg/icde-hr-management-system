import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BALANCE_DEDUCTING_LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
];

function shouldUpdateLeaveBalance(leaveType: string | null | undefined) {
  return BALANCE_DEDUCTING_LEAVE_TYPES.includes(String(leaveType || "").trim());
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch leave request" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  return updateLeaveRequest(req, params.id);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  return updateLeaveRequest(req, params.id);
}

async function updateLeaveRequest(req: Request, id: string) {
  try {
    const body = await req.json();

    const { data: existingRequest, error: fetchError } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existingRequest) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const updateData: any = {
      ...body,
    };

    const { data: updatedRequest, error: updateError } = await supabase
      .from("leave_requests")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const newStatus = String(body.status || updatedRequest?.status || "").trim();
    const oldStatus = String(existingRequest.status || "").trim();
    const leaveType = String(existingRequest.leave_type || updatedRequest?.leave_type || "").trim();
    const totalDays = Number(existingRequest.total_days || updatedRequest?.total_days || 0);

    if (
      newStatus === "Approved" &&
      oldStatus !== "Approved" &&
      shouldUpdateLeaveBalance(leaveType) &&
      totalDays > 0 &&
      existingRequest.employee_id
    ) {
      const { data: employee, error: employeeFetchError } = await supabase
        .from("employees")
        .select("leaves_used,balance_leaves")
        .eq("id", existingRequest.employee_id)
        .single();

      if (employeeFetchError) {
        return NextResponse.json({ error: employeeFetchError.message }, { status: 500 });
      }

      const currentLeavesUsed = Number(employee?.leaves_used || 0);
      const currentBalanceLeaves = Number(employee?.balance_leaves || 0);

      const { error: employeeUpdateError } = await supabase
        .from("employees")
        .update({
          leaves_used: currentLeavesUsed + totalDays,
          balance_leaves: currentBalanceLeaves - totalDays,
        })
        .eq("id", existingRequest.employee_id);

      if (employeeUpdateError) {
        return NextResponse.json({ error: employeeUpdateError.message }, { status: 500 });
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update leave request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete leave request" },
      { status: 500 }
    );
  }
}