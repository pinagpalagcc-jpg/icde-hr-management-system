import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

const BALANCE_DEDUCTING_LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
];

function shouldUpdateLeaveBalance(leaveType: string | null | undefined) {
  return BALANCE_DEDUCTING_LEAVE_TYPES.includes(String(leaveType || "").trim());
}

function employeeName(employee: any) {
  return `${employee?.first_name || ""} ${employee?.middle_name || ""} ${employee?.last_name || ""}`
    .replace(/\s+/g, " ")
    .trim() || "Employee";
}

function employeeEmail(employee: any) {
  return employee?.email || employee?.work_email || employee?.personal_email || employee?.employee_email || "";
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch leave request" }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  return updateLeaveRequest(req, params.id);
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
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

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
    if (!existingRequest) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

    const { data: updatedRequest, error: updateError } = await supabase
      .from("leave_requests")
      .update({ ...body })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    const newStatus = String(body.status || updatedRequest?.status || "").trim();
    const oldStatus = String(existingRequest.status || "").trim();
    const leaveType = String(existingRequest.leave_type || updatedRequest?.leave_type || "").trim();
    const totalDays = Number(existingRequest.total_days || updatedRequest?.total_days || 0);

    let employee: any = null;

    if (existingRequest.employee_id) {
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("id", existingRequest.employee_id)
        .single();

      employee = data;
    }

    if (
      newStatus === "Approved" &&
      oldStatus !== "Approved" &&
      shouldUpdateLeaveBalance(leaveType) &&
      totalDays > 0 &&
      existingRequest.employee_id
    ) {
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

    if ((newStatus === "Approved" || newStatus === "Rejected") && oldStatus !== newStatus && employee) {
      const to = employeeEmail(employee);

      if (to) {
        try {
          await sendEmail({
            to,
            subject: `Your ${leaveType} request has been ${newStatus}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>ICDE HR Management</h2>
                <p>Dear ${employeeName(employee)},</p>
                <p>Your <strong>${leaveType}</strong> request has been <strong>${newStatus}</strong>.</p>
                <p><strong>Total Days:</strong> ${totalDays || "-"}</p>
                <p>Please login to the HR portal for more details.</p>
                <br/>
                <p>Regards,<br/>ICDE HR Team</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.log("Leave email notification failed:", emailError);
        }
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update leave request" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const { error } = await supabase.from("leave_requests").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete leave request" }, { status: 500 });
  }
}
