import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(request: NextRequest) {
  try {
    const employeeId = request.nextUrl.searchParams.get("employee_id");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("holiday_credit_transactions")
      .select("*")
      .eq("employee_id", employeeId)
      .order("transaction_date", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    let runningBalance = 0;

    const transactions = (data || []).map((transaction) => {
      const earned = numberValue(transaction.earned_days);
      const used = numberValue(transaction.used_days);

      runningBalance += earned - used;

      return {
        ...transaction,
        earned_days: earned,
        used_days: used,
        balance_after: runningBalance,
      };
    });

    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to load Holiday Credit transactions.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const employeeId = String(body.employee_id || "").trim();
    const transactionDate = String(
      body.transaction_date || ""
    ).trim();
    const fromDate = String(body.from_date || "").trim() || null;
    const toDate = String(body.to_date || "").trim() || null;
    const remarks = String(body.remarks || "").trim();
    const earnedDays = numberValue(body.earned_days);

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    if (!transactionDate) {
      return NextResponse.json(
        { error: "Transaction date is required." },
        { status: 400 }
      );
    }

    if (!remarks) {
      return NextResponse.json(
        { error: "Remarks are required." },
        { status: 400 }
      );
    }

    if (earnedDays <= 0) {
      return NextResponse.json(
        { error: "Earned days must be greater than zero." },
        { status: 400 }
      );
    }

    if (fromDate && toDate && toDate < fromDate) {
      return NextResponse.json(
        { error: "To date cannot be earlier than From date." },
        { status: 400 }
      );
    }

    const { data: existingTransactions, error: existingError } =
      await supabase
        .from("holiday_credit_transactions")
        .select("earned_days, used_days")
        .eq("employee_id", employeeId);

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    const currentEarned = (existingTransactions || []).reduce(
      (total, transaction) =>
        total + numberValue(transaction.earned_days),
      0
    );

    const currentUsed = (existingTransactions || []).reduce(
      (total, transaction) =>
        total + numberValue(transaction.used_days),
      0
    );

    const newTotalEarned = currentEarned + earnedDays;
    const newBalance = newTotalEarned - currentUsed;

    const { data: transaction, error: insertError } =
      await supabase
        .from("holiday_credit_transactions")
        .insert({
          employee_id: employeeId,
          transaction_date: transactionDate,
          remarks,
          from_date: fromDate,
          to_date: toDate,
          earned_days: earnedDays,
          used_days: 0,
          balance_after: newBalance,
          entry_type: "Earned",
          created_by: String(body.created_by || "Admin"),
        })
        .select()
        .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const { error: employeeUpdateError } = await supabase
      .from("employees")
      .update({
        credit_leave_earned: newTotalEarned,
        credit_leave_used: currentUsed,
        credit_leave_balance: newBalance,
      })
      .eq("id", employeeId);

    if (employeeUpdateError) {
      await supabase
        .from("holiday_credit_transactions")
        .delete()
        .eq("id", transaction.id);

      return NextResponse.json(
        { error: employeeUpdateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to add earned Holiday Credit.",
      },
      { status: 500 }
    );
  }
}
