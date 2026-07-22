import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/session";

function removePassword(employee: any) {
  if (!employee) return employee;

  const {
    login_password: _loginPassword,
    ...safeEmployee
  } = employee;

  return safeEmployee;
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

export async function GET() {
  try {
    await requireAdmin();

    const { data, error } = await supabase
      .from("employees")
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

    return NextResponse.json(
      (data || []).map(removePassword)
    );
  } catch (error) {
    return securityError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const temporaryPassword = String(
      body.login_password || ""
    );

    if (
      temporaryPassword &&
      temporaryPassword.length < 8
    ) {
      return NextResponse.json(
        {
          error:
            "Temporary password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const insertPayload = {
      ...body,
      login_password: temporaryPassword
        ? await bcrypt.hash(
            temporaryPassword,
            12
          )
        : null,
      must_change_password:
        Boolean(temporaryPassword),
    };

    const { data, error } = await supabase
      .from("employees")
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
      removePassword(data),
      { status: 201 }
    );
  } catch (error) {
    return securityError(error);
  }
}
