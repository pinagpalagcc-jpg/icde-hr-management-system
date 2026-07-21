import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
    balance = roundMoney(
      balance +
        numberValue(transaction.loan_received) -
        numberValue(transaction.amount_paid)
    );

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const rows = Array.isArray(body.rows)
      ? body.rows
      : [];

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    if (!rows.length) {
      return NextResponse.json(
        { error: "No loan rows were provided." },
        { status: 400 }
      );
    }

    const { data: latestEntry, error: latestError } =
      await supabase
        .from("employee_loan_ledger")
        .select("transaction_date, balance_after")
        .eq("employee_id", employeeId)
        .order("transaction_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (latestError) {
      return NextResponse.json(
        { error: latestError.message },
        { status: 500 }
      );
    }

    const latestDate =
      latestEntry?.transaction_date?.slice(0, 10) ||
      "";

    let runningBalance = numberValue(
      latestEntry?.balance_after
    );

    const normalizedRows = rows
      .map((row: any, index: number) => ({
        rowNumber: index + 2,
        transaction_date: String(
          row.transaction_date || ""
        ).slice(0, 10),
        detail: String(row.detail || "").trim(),
        received: roundMoney(
          numberValue(row.received)
        ),
        paid: roundMoney(
          numberValue(row.paid)
        ),
        suppliedBalance: roundMoney(
          numberValue(row.balance)
        ),
      }))
      .sort((first: any, second: any) =>
        first.transaction_date.localeCompare(
          second.transaction_date
        )
      );

    const errors: string[] = [];
    const insertRows: any[] = [];

    for (const row of normalizedRows) {
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          row.transaction_date
        )
      ) {
        errors.push(
          `Row ${row.rowNumber}: Invalid date.`
        );
        continue;
      }

      if (
        latestDate &&
        row.transaction_date < latestDate
      ) {
        errors.push(
          `Row ${row.rowNumber}: Date cannot be earlier than the latest existing ledger date (${latestDate}).`
        );
        continue;
      }

      if (!row.detail) {
        errors.push(
          `Row ${row.rowNumber}: Description is required.`
        );
        continue;
      }

      if (row.received < 0 || row.paid < 0) {
        errors.push(
          `Row ${row.rowNumber}: Received and Paid cannot be negative.`
        );
        continue;
      }

      if (
        (row.received > 0 && row.paid > 0) ||
        (row.received <= 0 && row.paid <= 0)
      ) {
        errors.push(
          `Row ${row.rowNumber}: Enter an amount in either Received or Paid, but not both.`
        );
        continue;
      }

      runningBalance = roundMoney(
        runningBalance +
          row.received -
          row.paid
      );

      if (runningBalance < 0) {
        errors.push(
          `Row ${row.rowNumber}: Paid amount creates a negative balance.`
        );
        continue;
      }

      if (
        Math.abs(
          runningBalance -
            row.suppliedBalance
        ) > 0.01
      ) {
        errors.push(
          `Row ${row.rowNumber}: Balance should be ${runningBalance.toFixed(
            2
          )}, not ${row.suppliedBalance.toFixed(2)}.`
        );
        continue;
      }

      insertRows.push({
        employee_id: employeeId,
        transaction_date:
          row.transaction_date,
        detail: row.detail,
        entry_type:
          row.received > 0
            ? "LOAN_RECEIVED"
            : "INSTALLMENT_DEDUCTION",
        loan_received: row.received,
        amount_paid: row.paid,
        balance_after: runningBalance,
        remarks: "Bulk Excel Import",
      });
    }

    if (errors.length) {
      return NextResponse.json(
        {
          error:
            "The Excel file contains invalid rows.",
          errors,
        },
        { status: 400 }
      );
    }

    const { error: insertError } =
      await supabase
        .from("employee_loan_ledger")
        .insert(insertRows);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    const finalBalance =
      await recalculateLedger(employeeId);

    return NextResponse.json({
      success: true,
      imported: insertRows.length,
      final_balance: finalBalance,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to import loan entries.",
      },
      { status: 500 }
    );
  }
}
