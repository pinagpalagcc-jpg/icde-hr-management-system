import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import {
  requireAdmin,
  requireSession,
} from "@/lib/session";

function numberValue(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

async function loadEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "basic_salary, accommodation_allowance, transportation_allowance"
    )
    .eq("id", employeeId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function adjustAllowances(
  employeeId: string,
  accommodationDifference: number,
  transportationDifference: number
) {
  const employee =
    await loadEmployee(employeeId);

  const accommodation = Math.max(
    0,
    numberValue(
      employee?.accommodation_allowance
    ) + accommodationDifference
  );

  const transportation = Math.max(
    0,
    numberValue(
      employee?.transportation_allowance
    ) + transportationDifference
  );

  const { error } = await supabase
    .from("employees")
    .update({
      accommodation_allowance:
        accommodation,
      transportation_allowance:
        transportation,
    })
    .eq("id", employeeId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    basic_salary: numberValue(
      employee?.basic_salary
    ),
    accommodation_allowance:
      accommodation,
    transportation_allowance:
      transportation,
    gross_total:
      numberValue(
        employee?.basic_salary
      ) +
      accommodation +
      transportation,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const session = await requireSession();

    const employeeId =
      request.nextUrl.searchParams.get(
        "employee_id"
      );

    if (!employeeId) {
      return NextResponse.json(
        {
          error:
            "Employee ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      session.role !== "Admin" &&
      String(session.userId) !==
        String(employeeId)
    ) {
      return NextResponse.json(
        {
          error:
            "You can only view your own salary increments.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("salary_increments")
      .select("*")
      .eq("employee_id", employeeId)
      .order("year", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

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
          "Unable to load salary increments.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const body = await request.json();

    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const year = Number(body.year);

    const month = String(
      body.month || ""
    ).trim();

    const previousGross = numberValue(
      body.previous_salary
    );

    const incrementAmount = numberValue(
      body.increment_amount
    );

    const newGross =
      previousGross + incrementAmount;

    const incrementType = String(
      body.increment_type || ""
    ).trim();

    const notes = String(
      body.notes || ""
    ).trim();

    if (
      !employeeId ||
      !Number.isInteger(year) ||
      !month
    ) {
      return NextResponse.json(
        {
          error:
            "Employee, year and month are required.",
        },
        { status: 400 }
      );
    }

    if (incrementAmount <= 0) {
      return NextResponse.json(
        {
          error:
            "Increment must be greater than zero.",
        },
        { status: 400 }
      );
    }

    if (!incrementType) {
      return NextResponse.json(
        {
          error:
            "Increment type is required.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("salary_increments")
      .insert({
        employee_id: employeeId,
        year,
        month,
        previous_salary:
          previousGross,
        increment_amount:
          incrementAmount,
        new_salary: newGross,
        increment_type:
          incrementType,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const halfIncrement =
      incrementAmount / 2;

    try {
      const employeeTotals =
        await adjustAllowances(
          employeeId,
          halfIncrement,
          halfIncrement
        );

      return NextResponse.json(
        {
          ...data,
          employee_totals:
            employeeTotals,
        },
        { status: 201 }
      );
    } catch (adjustmentError) {
      await supabase
        .from("salary_increments")
        .delete()
        .eq("id", data.id);

      throw adjustmentError;
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to save salary increment.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const body = await request.json();

    const id = String(
      body.id || ""
    ).trim();

    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const year = Number(body.year);

    const month = String(
      body.month || ""
    ).trim();

    const previousGross = numberValue(
      body.previous_salary
    );

    const incrementAmount = numberValue(
      body.increment_amount
    );

    const newGross =
      previousGross + incrementAmount;

    const incrementType = String(
      body.increment_type || ""
    ).trim();

    const notes = String(
      body.notes || ""
    ).trim();

    if (!id || !employeeId) {
      return NextResponse.json(
        {
          error:
            "Increment record is required.",
        },
        { status: 400 }
      );
    }

    if (incrementAmount <= 0) {
      return NextResponse.json(
        {
          error:
            "Increment must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const {
      data: existingRecord,
      error: existingError,
    } = await supabase
      .from("salary_increments")
      .select("*")
      .eq("id", id)
      .eq("employee_id", employeeId)
      .single();

    if (
      existingError ||
      !existingRecord
    ) {
      return NextResponse.json(
        {
          error:
            existingError?.message ||
            "Increment record not found.",
        },
        { status: 404 }
      );
    }

    const oldIncrement = numberValue(
      existingRecord.increment_amount
    );

    const { data, error } = await supabase
      .from("salary_increments")
      .update({
        year,
        month,
        previous_salary:
          previousGross,
        increment_amount:
          incrementAmount,
        new_salary: newGross,
        increment_type:
          incrementType,
        notes: notes || null,
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

    const allowanceDifference =
      (incrementAmount -
        oldIncrement) /
      2;

    try {
      const employeeTotals =
        await adjustAllowances(
          employeeId,
          allowanceDifference,
          allowanceDifference
        );

      return NextResponse.json({
        ...data,
        employee_totals:
          employeeTotals,
      });
    } catch (adjustmentError) {
      await supabase
        .from("salary_increments")
        .update({
          year: existingRecord.year,
          month: existingRecord.month,
          previous_salary:
            existingRecord.previous_salary,
          increment_amount:
            existingRecord.increment_amount,
          new_salary:
            existingRecord.new_salary,
          increment_type:
            existingRecord.increment_type,
          notes:
            existingRecord.notes,
        })
        .eq("id", id);

      throw adjustmentError;
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to edit salary increment.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const id =
      request.nextUrl.searchParams.get(
        "id"
      );

    const employeeId =
      request.nextUrl.searchParams.get(
        "employee_id"
      );

    if (!id || !employeeId) {
      return NextResponse.json(
        {
          error:
            "Increment ID and employee ID are required.",
        },
        { status: 400 }
      );
    }

    const {
      data: deletingRecord,
      error: fetchError,
    } = await supabase
      .from("salary_increments")
      .select("*")
      .eq("id", id)
      .eq("employee_id", employeeId)
      .single();

    if (
      fetchError ||
      !deletingRecord
    ) {
      return NextResponse.json(
        {
          error:
            fetchError?.message ||
            "Increment record not found.",
        },
        { status: 404 }
      );
    }

    const incrementAmount =
      numberValue(
        deletingRecord.increment_amount
      );

    const { error } = await supabase
      .from("salary_increments")
      .delete()
      .eq("id", id)
      .eq("employee_id", employeeId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    try {
      const halfIncrement =
        incrementAmount / 2;

      const employeeTotals =
        await adjustAllowances(
          employeeId,
          -halfIncrement,
          -halfIncrement
        );

      return NextResponse.json({
        success: true,
        employee_totals:
          employeeTotals,
      });
    } catch (adjustmentError) {
      await supabase
        .from("salary_increments")
        .insert(deletingRecord);

      throw adjustmentError;
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unable to delete salary increment.",
      },
      { status: 500 }
    );
  }
}
