import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

const BALANCE_DEDUCTING_LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
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
if (
  newStatus === "Approved" &&
  oldStatus !== "Approved" &&
  totalDays > 0 &&
  existingRequest.employee_id
) {
  let balanceUpdate: Record<string, number> | null = null;
  let holidayTransactionId: string | null = null;

  if (leaveType === "Paternity Leave") {
    balanceUpdate = {
      paternity_leave_used:
        Number(employee?.paternity_leave_used || 0) + totalDays,
      paternity_leave_balance:
        Number(employee?.paternity_leave_balance ?? 15) - totalDays,
    };
  }

  if (leaveType === "Maternity Leave") {
    balanceUpdate = {
      maternity_leave_used:
        Number(employee?.maternity_leave_used || 0) + totalDays,
      maternity_leave_balance:
        Number(employee?.maternity_leave_balance ?? 45) - totalDays,
    };
  }

  if (leaveType === "Holiday Credit Leave") {
    const { data: creditTransactions, error: creditFetchError } =
      await supabase
        .from("holiday_credit_transactions")
        .select("earned_days, used_days")
        .eq("employee_id", existingRequest.employee_id);

    if (creditFetchError) {
      return NextResponse.json(
        { error: creditFetchError.message },
        { status: 500 }
      );
    }

    const totalEarned = (creditTransactions || []).reduce(
      (sum, transaction) =>
        sum + Number(transaction.earned_days || 0),
      0
    );

    const currentUsed = (creditTransactions || []).reduce(
      (sum, transaction) =>
        sum + Number(transaction.used_days || 0),
      0
    );

    const newUsed = currentUsed + totalDays;
    const newBalance = totalEarned - newUsed;

    if (newBalance < 0) {
      return NextResponse.json(
        {
          error:
            "Holiday Credit balance is insufficient for this leave request.",
        },
        { status: 400 }
      );
    }

    const transactionDate = new Date()
      .toISOString()
      .slice(0, 10);

    const { data: usedTransaction, error: usedTransactionError } =
      await supabase
        .from("holiday_credit_transactions")
        .insert({
          employee_id: existingRequest.employee_id,
          transaction_date: transactionDate,
          remarks:
            existingRequest.reason ||
            "Holiday Credit Leave Approved",
          from_date: existingRequest.start_date || null,
          to_date: existingRequest.end_date || null,
          earned_days: 0,
          used_days: totalDays,
          balance_after: newBalance,
          entry_type: "Used",
          leave_request_id: existingRequest.id,
          created_by: "Admin Approval",
        })
        .select("id")
        .single();

    if (usedTransactionError) {
      return NextResponse.json(
        { error: usedTransactionError.message },
        { status: 500 }
      );
    }

    holidayTransactionId = usedTransaction.id;

    balanceUpdate = {
      credit_leave_earned: totalEarned,
      credit_leave_used: newUsed,
      credit_leave_balance: newBalance,
    };
  }

  if (leaveType === "Unpaid Leave") {
    balanceUpdate = {
      unpaid_leave_used:
        Number(employee?.unpaid_leave_used || 0) + totalDays,
    };
  }

  if (balanceUpdate) {
    const { error: separateBalanceError } = await supabase
      .from("employees")
      .update(balanceUpdate)
      .eq("id", existingRequest.employee_id);

    if (separateBalanceError) {
      if (holidayTransactionId) {
        await supabase
          .from("holiday_credit_transactions")
          .delete()
          .eq("id", holidayTransactionId);
      }

      return NextResponse.json(
        { error: separateBalanceError.message },
        { status: 500 }
      );
    }
  }
}
    if ((newStatus === "Approved" || newStatus === "Rejected") && oldStatus !== newStatus && employee) {
      const name = employeeName(employee);
      const title = `Leave Request ${newStatus}`;
      const message = `Your ${leaveType} request has been ${newStatus}.`;

      try {
        await createNotification(
          existingRequest.employee_id,
          title,
          message,
          "Leave"
        );
      } catch (notificationError) {
        console.log("In-app notification failed:", notificationError);
      }

      const to = employeeEmail(employee);

      if (to) {
        try {
          await sendEmail({
            to,
            subject: `Your ${leaveType} request has been ${newStatus}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>ICDE HR Management</h2>
                <p>Dear ${name},</p>
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
