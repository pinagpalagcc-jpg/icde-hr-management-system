import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

const PERIOD_DEDUCTING_LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
];

function requiresAnnualPeriod(leaveType: string) {
  return PERIOD_DEDUCTING_LEAVE_TYPES.includes(leaveType);
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function employeeName(employee: any) {
  return (
    `${employee?.first_name || ""} ${
      employee?.middle_name || ""
    } ${employee?.last_name || ""}`
      .replace(/\s+/g, " ")
      .trim() || "Employee"
  );
}

function employeeEmail(employee: any) {
  return (
    employee?.email ||
    employee?.work_email ||
    employee?.personal_email ||
    employee?.employee_email ||
    ""
  );
}

async function updateAnnualEmployeeTotals(employeeId: string) {
  const { data, error } = await supabase
    .from("annual_leave_transactions")
    .select("total_leaves, used_leaves")
    .eq("employee_id", employeeId);

  if (error) throw new Error(error.message);

  const totalLeaves = (data || []).reduce(
    (sum, item) => sum + numberValue(item.total_leaves),
    0
  );

  const leavesUsed = (data || []).reduce(
    (sum, item) => sum + numberValue(item.used_leaves),
    0
  );

  const balanceLeaves = totalLeaves - leavesUsed;

  const { error: employeeError } = await supabase
    .from("employees")
    .update({
      total_leaves: totalLeaves,
      leaves_used: leavesUsed,
      balance_leaves: balanceLeaves,
    })
    .eq("id", employeeId);

  if (employeeError) throw new Error(employeeError.message);

  return {
    total_leaves: totalLeaves,
    leaves_used: leavesUsed,
    balance_leaves: balanceLeaves,
  };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unable to load leave request." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateLeaveRequest(req, id);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return updateLeaveRequest(req, id);
}

async function updateLeaveRequest(req: Request, id: string) {
  try {
    const body = await req.json();

    const { data: existingRequest, error: fetchError } =
      await supabase
        .from("leave_requests")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 }
      );
    }

    const effectiveRequest = {
      ...existingRequest,
      ...body,
    };

    const oldStatus = String(existingRequest.status || "").trim();
    const newStatus = String(effectiveRequest.status || "").trim();
    const leaveType = String(effectiveRequest.leave_type || "").trim();
    const employeeId = String(effectiveRequest.employee_id || "");
    const totalDays = numberValue(effectiveRequest.total_days);

    const annualPeriodYear =
      effectiveRequest.annual_period_year !== null &&
      effectiveRequest.annual_period_year !== undefined &&
      effectiveRequest.annual_period_year !== ""
        ? Number(effectiveRequest.annual_period_year)
        : null;

    const isNewApproval =
      newStatus === "Approved" &&
      oldStatus !== "Approved";

    let employee: any = null;
    let employeeTotals: any = null;
    let annualTransactionId: string | null = null;
    let holidayTransactionId: string | null = null;

    if (employeeId) {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      employee = data;
    }

    if (
      isNewApproval &&
      requiresAnnualPeriod(leaveType)
    ) {
      if (!annualPeriodYear) {
        return NextResponse.json(
          {
            error:
              "Please select the leave period before approval.",
          },
          { status: 400 }
        );
      }

      if (totalDays <= 0) {
        return NextResponse.json(
          {
            error:
              "Approved leave days must be greater than zero.",
          },
          { status: 400 }
        );
      }

      const { data: periodTransactions, error: periodError } =
        await supabase
          .from("annual_leave_transactions")
          .select("total_leaves, used_leaves")
          .eq("employee_id", employeeId)
          .eq("period_year", annualPeriodYear);

      if (periodError) {
        return NextResponse.json(
          { error: periodError.message },
          { status: 500 }
        );
      }

      const periodTotal = (periodTransactions || []).reduce(
        (sum, item) => sum + numberValue(item.total_leaves),
        0
      );

      const periodUsed = (periodTransactions || []).reduce(
        (sum, item) => sum + numberValue(item.used_leaves),
        0
      );

      const periodBalance = periodTotal - periodUsed;

      if (totalDays > periodBalance) {
        return NextResponse.json(
          {
            error:
              `Period ${annualPeriodYear} has only ${periodBalance} day(s) available.`,
          },
          { status: 400 }
        );
      }

      const { data: duplicate } = await supabase
        .from("annual_leave_transactions")
        .select("id")
        .eq("leave_request_id", id)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "This leave request has already been posted to the Annual Leave Register.",
          },
          { status: 400 }
        );
      }

      const newPeriodBalance = periodBalance - totalDays;

      const { data: transaction, error: insertError } =
        await supabase
          .from("annual_leave_transactions")
          .insert({
            employee_id: employeeId,
            period_year: annualPeriodYear,
            transaction_date:
              effectiveRequest.start_date ||
              new Date().toISOString().slice(0, 10),
            detail:
              effectiveRequest.reason
                ? `${leaveType} Approved — ${effectiveRequest.reason}`
                : `${leaveType} Approved`,
            total_leaves: 0,
            used_leaves: totalDays,
            balance_after: newPeriodBalance,
            entry_type: "LEAVE_USED",
            leave_category: leaveType,
            leave_request_id: id,
            remarks:
              `${leaveType} from ${
                effectiveRequest.start_date || "-"
              } to ${effectiveRequest.end_date || "-"}`,
          })
          .select("id")
          .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      annualTransactionId = transaction.id;

      try {
        employeeTotals =
          await updateAnnualEmployeeTotals(employeeId);
      } catch (error: any) {
        await supabase
          .from("annual_leave_transactions")
          .delete()
          .eq("id", annualTransactionId);

        return NextResponse.json(
          {
            error:
              error.message ||
              "Unable to update Annual Leave totals.",
          },
          { status: 500 }
        );
      }
    }

    if (
      isNewApproval &&
      leaveType === "Paternity Leave"
    ) {
      const newUsed =
        numberValue(employee?.paternity_leave_used) +
        totalDays;

      const newBalance =
        numberValue(employee?.paternity_leave_balance ?? 15) -
        totalDays;

      if (newBalance < 0) {
        return NextResponse.json(
          { error: "Paternity Leave balance is insufficient." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("employees")
        .update({
          paternity_leave_used: newUsed,
          paternity_leave_balance: newBalance,
        })
        .eq("id", employeeId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    if (
      isNewApproval &&
      leaveType === "Maternity Leave"
    ) {
      const newUsed =
        numberValue(employee?.maternity_leave_used) +
        totalDays;

      const newBalance =
        numberValue(employee?.maternity_leave_balance ?? 45) -
        totalDays;

      if (newBalance < 0) {
        return NextResponse.json(
          { error: "Maternity Leave balance is insufficient." },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("employees")
        .update({
          maternity_leave_used: newUsed,
          maternity_leave_balance: newBalance,
        })
        .eq("id", employeeId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    if (
      isNewApproval &&
      leaveType === "Holiday Credit Leave"
    ) {
      const { data: transactions, error } = await supabase
        .from("holiday_credit_transactions")
        .select("earned_days, used_days")
        .eq("employee_id", employeeId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      const totalEarned = (transactions || []).reduce(
        (sum, item) => sum + numberValue(item.earned_days),
        0
      );

      const currentUsed = (transactions || []).reduce(
        (sum, item) => sum + numberValue(item.used_days),
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

      const { data: transaction, error: insertError } =
        await supabase
          .from("holiday_credit_transactions")
          .insert({
            employee_id: employeeId,
            transaction_date:
              effectiveRequest.start_date ||
              new Date().toISOString().slice(0, 10),
            remarks:
              effectiveRequest.reason ||
              "Holiday Credit Leave Approved",
            from_date: effectiveRequest.start_date || null,
            to_date: effectiveRequest.end_date || null,
            earned_days: 0,
            used_days: totalDays,
            balance_after: newBalance,
            entry_type: "Used",
            leave_request_id: id,
            created_by: "Admin Approval",
          })
          .select("id")
          .single();

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      holidayTransactionId = transaction.id;

      const { error: updateError } = await supabase
        .from("employees")
        .update({
          credit_leave_earned: totalEarned,
          credit_leave_used: newUsed,
          credit_leave_balance: newBalance,
        })
        .eq("id", employeeId);

      if (updateError) {
        await supabase
          .from("holiday_credit_transactions")
          .delete()
          .eq("id", holidayTransactionId);

        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    if (
      isNewApproval &&
      leaveType === "Unpaid Leave"
    ) {
      const { error } = await supabase
        .from("employees")
        .update({
          unpaid_leave_used:
            numberValue(employee?.unpaid_leave_used) +
            totalDays,
        })
        .eq("id", employeeId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }

    const cleanBody = {
      ...body,
      annual_period_year:
        requiresAnnualPeriod(leaveType)
          ? annualPeriodYear
          : null,
    };

    const { data: updatedRequest, error: updateError } =
      await supabase
        .from("leave_requests")
        .update(cleanBody)
        .eq("id", id)
        .select("*")
        .single();

    if (updateError) {
      if (annualTransactionId) {
        await supabase
          .from("annual_leave_transactions")
          .delete()
          .eq("id", annualTransactionId);
      }

      if (holidayTransactionId) {
        await supabase
          .from("holiday_credit_transactions")
          .delete()
          .eq("id", holidayTransactionId);
      }

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    if (
      ["Approved", "Rejected"].includes(newStatus) &&
      oldStatus !== newStatus &&
      employee
    ) {
      let notificationMessage =
        `Your ${leaveType} request has been ${newStatus}.`;

      if (
        newStatus === "Approved" &&
        requiresAnnualPeriod(leaveType) &&
        annualPeriodYear
      ) {
        notificationMessage +=
          ` Leave period used: ${annualPeriodYear}.`;
      }

      try {
        await createNotification(
          employeeId,
          `Leave Request ${newStatus}`,
          notificationMessage,
          "Leave"
        );
      } catch (error) {
        console.log("In-app notification failed:", error);
      }

      const to = employeeEmail(employee);

      if (to) {
        try {
          await sendEmail({
            to,
            subject:
              `Your ${leaveType} request has been ${newStatus}`,
            html: `
              <div style="font-family:Arial,sans-serif;line-height:1.6">
                <h2>ICDE HR Management</h2>
                <p>Dear ${employeeName(employee)},</p>
                <p>Your <strong>${leaveType}</strong> request has been <strong>${newStatus}</strong>.</p>
                <p><strong>Total Days:</strong> ${totalDays || "-"}</p>
                ${
                  newStatus === "Approved" &&
                  requiresAnnualPeriod(leaveType) &&
                  annualPeriodYear
                    ? `<p><strong>Leave Period Used:</strong> ${annualPeriodYear}</p>`
                    : ""
                }
                <p>Regards,<br/>ICDE HR Team</p>
              </div>
            `,
          });
        } catch (error) {
          console.log("Leave email failed:", error);
        }
      }
    }

    return NextResponse.json({
      ...updatedRequest,
      employee_totals: employeeTotals,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.message || "Failed to update leave request.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete leave request." },
      { status: 500 }
    );
  }
}
