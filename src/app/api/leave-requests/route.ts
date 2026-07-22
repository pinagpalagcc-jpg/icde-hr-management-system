import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireSession,
} from "@/lib/session";

function removeEmployeePassword(item: any) {
  if (!item?.employees) return item;

  const {
    login_password: _loginPassword,
    ...safeEmployee
  } = item.employees;

  return {
    ...item,
    employees: safeEmployee,
  };
}

function securityError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please log in." },
      { status: 401 }
    );
  }

  return NextResponse.json(
    { error: "Unable to complete request." },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const session = await requireSession();

    let query = supabase
      .from("leave_requests")
      .select("*, employees(*)")
      .order("created_at", {
        ascending: false,
      });

    if (session.role !== "Admin") {
      query = query.eq(
        "employee_id",
        session.userId
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      (data || []).map(
        removeEmployeePassword
      )
    );
  } catch (error) {
    return securityError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const requestedEmployeeId = String(
      body.employee_id || ""
    );

    if (
      session.role !== "Admin" &&
      requestedEmployeeId &&
      requestedEmployeeId !== session.userId
    ) {
      return NextResponse.json(
        {
          error:
            "You can only submit leave for yourself.",
        },
        { status: 403 }
      );
    }

    const insertPayload =
      session.role === "Admin"
        ? body
        : {
            ...body,
            employee_id: session.userId,
            status: "Pending",
            approved_by: null,
            approved_at: null,
            rejection_reason: null,
          };

    const { data, error } = await supabase
      .from("leave_requests")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      data,
      { status: 201 }
    );
  } catch (error) {
    return securityError(error);
  }
}
