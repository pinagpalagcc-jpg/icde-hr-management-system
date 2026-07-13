import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

async function updateEmployeeBasicSalary(
  employeeId: string,
  salary: number
) {
  const { error } = await supabase
    .from("employees")
    .update({ basic_salary: salary })
    .eq("id", employeeId);

  if (error) throw new Error(error.message);
}

export async function GET(request: NextRequest) {
  try {
    const employeeId =
      request.nextUrl.searchParams.get("employee_id");

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("salary_increments")
      .select("*")
      .eq("employee_id", employeeId)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const records = data || [];

    if (records.length > 0) {
      const latestSalary = numberValue(
        records[0].new_salary
      );

      await updateEmployeeBasicSalary(
        employeeId,
        latestSalary
      );
    }

    return NextResponse.json(records);
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const year = Number(body.year);
    const month = String(body.month || "").trim();
    const previousSalary = numberValue(
      body.previous_salary
    );
    const incrementAmount = numberValue(
      body.increment_amount
    );
    const newSalary =
      previousSalary + incrementAmount;

    const incrementType = String(
      body.increment_type || ""
    ).trim();

    const notes = String(body.notes || "").trim();

    if (!employeeId || !Number.isInteger(year) || !month) {
      return NextResponse.json(
        {
          error:
            "Employee, year and month are required.",
        },
        { status: 400 }
      );
    }

    if (!incrementType) {
      return NextResponse.json(
        { error: "Increment type is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("salary_increments")
      .insert({
        employee_id: employeeId,
        year,
        month,
        previous_salary: previousSalary,
        increment_amount: incrementAmount,
        new_salary: newSalary,
        increment_type: incrementType,
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

    await updateEmployeeBasicSalary(
      employeeId,
      newSalary
    );

    return NextResponse.json(data, { status: 201 });
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const year = Number(body.year);
    const month = String(body.month || "").trim();
    const previousSalary = numberValue(
      body.previous_salary
    );
    const incrementAmount = numberValue(
      body.increment_amount
    );
    const newSalary =
      previousSalary + incrementAmount;

    const incrementType = String(
      body.increment_type || ""
    ).trim();

    const notes = String(body.notes || "").trim();

    if (!id || !employeeId) {
      return NextResponse.json(
        { error: "Increment record is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("salary_increments")
      .update({
        year,
        month,
        previous_salary: previousSalary,
        increment_amount: incrementAmount,
        new_salary: newSalary,
        increment_type: incrementType,
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

    await updateEmployeeBasicSalary(
      employeeId,
      newSalary
    );

    return NextResponse.json(data);
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

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    const employeeId =
      request.nextUrl.searchParams.get("employee_id");

    if (!id || !employeeId) {
      return NextResponse.json(
        {
          error:
            "Increment ID and employee ID are required.",
        },
        { status: 400 }
      );
    }

    const { data: deletingRecord, error: fetchError } =
      await supabase
        .from("salary_increments")
        .select("previous_salary")
        .eq("id", id)
        .eq("employee_id", employeeId)
        .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

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

    const { data: latest } = await supabase
      .from("salary_increments")
      .select("new_salary")
      .eq("employee_id", employeeId)
      .order("year", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const restoredSalary = latest
      ? numberValue(latest.new_salary)
      : numberValue(deletingRecord.previous_salary);

    await updateEmployeeBasicSalary(
      employeeId,
      restoredSalary
    );

    return NextResponse.json({
      success: true,
      basic_salary: restoredSalary,
    });
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
