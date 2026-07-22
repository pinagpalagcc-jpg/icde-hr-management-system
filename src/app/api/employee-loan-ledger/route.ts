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

async function recalculateLedger(employeeId: string) {
  const { data, error } = await supabase
    .from("employee_loan_ledger")
    .select("*")
    .eq("employee_id", employeeId)
    .order("transaction_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  let balance = 0;

  for (const transaction of data || []) {
    balance +=
      numberValue(transaction.loan_received) -
      numberValue(transaction.amount_paid);

    const { error: updateError } = await supabase
      .from("employee_loan_ledger")
      .update({ balance_after: balance })
      .eq("id", transaction.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  return balance;
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
            "You can only view your own loan ledger.",
        },
        { status: 403 }
      );
    }

    await recalculateLedger(employeeId);

    const { data, error } = await supabase
      .from("employee_loan_ledger")
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

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to load employee loan ledger.",
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

    const transactionDate = String(
      body.transaction_date || ""
    ).trim();

    const detail = String(body.detail || "").trim();

    const entryType = String(
      body.entry_type || ""
    ).trim();

    const amount = numberValue(body.amount);
    const remarks = String(body.remarks || "").trim();

    if (!employeeId || !transactionDate || !detail) {
      return NextResponse.json(
        {
          error:
            "Employee, date and detail are required.",
        },
        { status: 400 }
      );
    }

    if (
      !["LOAN_RECEIVED", "INSTALLMENT_DEDUCTION"].includes(
        entryType
      )
    ) {
      return NextResponse.json(
        { error: "Invalid entry type." },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 }
      );
    }

    const { data: latest } = await supabase
      .from("employee_loan_ledger")
      .select("balance_after")
      .eq("employee_id", employeeId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentBalance = numberValue(
      latest?.balance_after
    );

    const newBalance =
      entryType === "LOAN_RECEIVED"
        ? currentBalance + amount
        : currentBalance - amount;

    if (newBalance < 0) {
      return NextResponse.json(
        {
          error:
            "Deduction cannot be greater than the outstanding loan balance.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("employee_loan_ledger")
      .insert({
        employee_id: employeeId,
        transaction_date: transactionDate,
        detail,
        entry_type: entryType,
        loan_received:
          entryType === "LOAN_RECEIVED" ? amount : 0,
        amount_paid:
          entryType === "INSTALLMENT_DEDUCTION"
            ? amount
            : 0,
        balance_after: newBalance,
        remarks: remarks || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    await recalculateLedger(employeeId);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to save loan ledger entry.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();

    const id = String(body.id || "").trim();
    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const transactionDate = String(
      body.transaction_date || ""
    ).trim();

    const detail = String(body.detail || "").trim();

    const entryType = String(
      body.entry_type || ""
    ).trim();

    const amount = numberValue(body.amount);
    const remarks = String(body.remarks || "").trim();

    if (!id || !employeeId) {
      return NextResponse.json(
        { error: "Loan ledger entry is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("employee_loan_ledger")
      .update({
        transaction_date: transactionDate,
        detail,
        entry_type: entryType,
        loan_received:
          entryType === "LOAN_RECEIVED" ? amount : 0,
        amount_paid:
          entryType === "INSTALLMENT_DEDUCTION"
            ? amount
            : 0,
        remarks: remarks || null,
      })
      .eq("id", id)
      .eq("employee_id", employeeId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const balance = await recalculateLedger(employeeId);

    if (balance < 0) {
      return NextResponse.json(
        {
          error:
            "Updated entry creates a negative loan balance.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to update loan ledger entry.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const id =
      request.nextUrl.searchParams.get("id");

    const employeeId =
      request.nextUrl.searchParams.get("employee_id");

    if (!id || !employeeId) {
      return NextResponse.json(
        {
          error:
            "Loan entry ID and employee ID are required.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("employee_loan_ledger")
      .delete()
      .eq("id", id)
      .eq("employee_id", employeeId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    await recalculateLedger(employeeId);

    return NextResponse.json({
      success: true,
      message: "Loan ledger entry deleted successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to delete loan ledger entry.",
      },
      { status: 500 }
    );
  }
}
