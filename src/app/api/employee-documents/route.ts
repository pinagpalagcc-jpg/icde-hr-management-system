import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  requireAdmin,
  requireSession,
} from "@/lib/session";

function securityError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please log in." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      { error: "Admin access is required." },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: "Unable to complete request." },
    { status: 500 }
  );
}

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(
      request.url
    );

    const requestedEmployeeId =
      searchParams.get("employee_id");

    if (!requestedEmployeeId) {
      if (session.role !== "Admin") {
        return NextResponse.json(
          {
            error:
              "Staff can only view their own documents.",
          },
          { status: 403 }
        );
      }

      const { data, error } = await supabase
        .from("employee_documents")
        .select("*")
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
    }

    if (
      session.role !== "Admin" &&
      session.userId !== requestedEmployeeId
    ) {
      return NextResponse.json(
        {
          error:
            "You can only view your own documents.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("employee_documents")
      .select("*")
      .eq(
        "employee_id",
        requestedEmployeeId
      )
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
  } catch (error) {
    return securityError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const employeeId = String(
      body.employee_id || ""
    ).trim();

    const documentName = String(
      body.document_name || ""
    ).trim();

    if (!employeeId || !documentName) {
      return NextResponse.json(
        {
          error:
            "Employee and document name are required.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("employee_documents")
      .insert([
        {
          ...body,
          employee_id: employeeId,
          document_name: documentName,
        },
      ])
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
