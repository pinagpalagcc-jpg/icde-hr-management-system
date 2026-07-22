import {
  NextRequest,
  NextResponse,
} from "next/server";

import bcrypt from "bcryptjs";

import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/session";

export async function POST(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const body = await request.json();

    const employeeId = String(
      body.employeeId || ""
    ).trim();

    const newPassword = String(
      body.newPassword || ""
    );

    const confirmPassword = String(
      body.confirmPassword || ""
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

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (
      newPassword !== confirmPassword
    ) {
      return NextResponse.json(
        {
          error:
            "Passwords do not match.",
        },
        { status: 400 }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    const { data, error } =
      await supabase
        .from("employees")
        .update({
          login_password:
            passwordHash,
          must_change_password: true,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .eq("id", employeeId)
        .select(
          "id, login_username"
        )
        .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: data,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    return NextResponse.json(
      {
        error:
          message === "UNAUTHORIZED"
            ? "Please log in again."
            : "Admin access is required.",
      },
      {
        status:
          message === "UNAUTHORIZED"
            ? 401
            : 403,
      }
    );
  }
}
