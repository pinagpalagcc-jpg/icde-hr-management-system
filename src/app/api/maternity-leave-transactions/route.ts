import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAdmin,
  requireSession,
} from "@/lib/session";

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

async function updateEmployeeTotals(employeeId: string) {
  const { data, error } = await supabase
    .from("maternity_leave_transactions")
    .select("total_leaves, used_leaves")
    .eq("employee_id", employeeId);

  if (error) {
    throw new Error(error.message);
  }

  const totalLeaves = (data || []).reduce(
    (sum, transaction) =>
      sum + numberValue(transaction.total_leaves),
    0
  );

  const usedLeaves = (data || []).reduce(
    (sum, transaction) =>
      sum + numberValue(transaction.used_leaves),
    0
  );

  const balanceLeaves = totalLeaves - usedLeaves;

  const { error: employeeError } = await supabase
    .from("employees")
    .update({
      maternity_leave_total: totalLeaves,
      maternity_leave_used: usedLeaves,
      maternity_leave_balance: balanceLeaves,
    })
    .eq("id", employeeId);

  if (employeeError) {
    throw new Error(employeeError.message);
  }

  return {
    maternity_leave_total: totalLeaves,
    maternity_leave_used: usedLeaves,
    maternity_leave_balance: balanceLeaves,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const employeeId =
      request.nextUrl.searchParams.get("employee_id");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    if (
      session.role !== "Admin" &&
      String(session.userId) !== String(employeeId)
    ) {
      return NextResponse.json(
        {
          error:
            "You can only view your own leave ledger.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("maternity_leave_transactions")
      .select("*")
      .eq("employee_id", employeeId)
      .order("period_year", { ascending: true })
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const periodBalances = new Map<number, number>();

    const transactions = (data || []).map((transaction) => {
      const periodYear = Number(transaction.period_year);
      const previousBalance =
        periodBalances.get(periodYear) || 0;

      const totalLeaves = numberValue(
        transaction.total_leaves
      );

      const usedLeaves = numberValue(
        transaction.used_leaves
      );

      const calculatedBalance =
        previousBalance + totalLeaves - usedLeaves;

      periodBalances.set(periodYear, calculatedBalance);

      return {
        ...transaction,
        total_leaves: totalLeaves,
        used_leaves: usedLeaves,
        calculated_balance: calculatedBalance,
      };
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Maternity Leave Register.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const periodYear = Number(body.period_year);

    const transactionDate = String(
      body.transaction_date || ""
    ).trim();

    const detail = String(body.detail || "").trim();

    const entryType = String(
      body.entry_type || ""
    ).trim();

    const totalLeaves = numberValue(body.total_leaves);
    const usedLeaves = numberValue(body.used_leaves);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(periodYear) ||
      periodYear < 1900 ||
      periodYear > 2200
    ) {
      return NextResponse.json(
        { error: "A valid leave period is required." },
        { status: 400 }
      );
    }

    if (!transactionDate) {
      return NextResponse.json(
        { error: "Transaction date is required." },
        { status: 400 }
      );
    }

    if (!detail) {
      return NextResponse.json(
        { error: "Detail is required." },
        { status: 400 }
      );
    }

    if (
      ![
        "ENTITLEMENT",
        "LEAVE_USED",
        "ENCASHMENT",
        "ADJUSTMENT",
      ].includes(entryType)
    ) {
      return NextResponse.json(
        { error: "Invalid transaction type." },
        { status: 400 }
      );
    }

    if (
      entryType === "ENTITLEMENT" &&
      totalLeaves <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Total leaves must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (
      ["LEAVE_USED", "ENCASHMENT"].includes(entryType) &&
      usedLeaves <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Used leaves must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const { data: existingPeriod, error: existingError } =
      await supabase
        .from("maternity_leave_transactions")
        .select("total_leaves, used_leaves")
        .eq("employee_id", employeeId)
        .eq("period_year", periodYear);

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    const currentPeriodTotal = (
      existingPeriod || []
    ).reduce(
      (sum, transaction) =>
        sum + numberValue(transaction.total_leaves),
      0
    );

    const currentPeriodUsed = (
      existingPeriod || []
    ).reduce(
      (sum, transaction) =>
        sum + numberValue(transaction.used_leaves),
      0
    );

    const newPeriodBalance =
      currentPeriodTotal +
      totalLeaves -
      currentPeriodUsed -
      usedLeaves;

    if (newPeriodBalance < 0) {
      return NextResponse.json(
        {
          error:
            `Period ${periodYear} has insufficient Maternity Leave balance.`,
        },
        { status: 400 }
      );
    }

    const { data: transaction, error: insertError } =
      await supabase
        .from("maternity_leave_transactions")
        .insert({
          employee_id: employeeId,
          period_year: periodYear,
          transaction_date: transactionDate,
          detail,
          total_leaves: totalLeaves,
          used_leaves: usedLeaves,
          entry_type: entryType,
          leave_request_id:
            body.leave_request_id || null,
          remarks: body.remarks || null,
        })
        .select()
        .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const employeeTotals =
      await updateEmployeeTotals(employeeId);

    return NextResponse.json(
      {
        transaction,
        employee_totals: employeeTotals,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save Maternity Leave transaction.",
      },
      { status: 500 }
    );
  }
}
