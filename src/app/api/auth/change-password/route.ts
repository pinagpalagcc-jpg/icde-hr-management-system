import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const newPassword = String(
      body.newPassword || ""
    );

    const confirmPassword = String(
      body.confirmPassword || ""
    );

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      12
    );

    const { error } = await supabase
      .from("employees")
      .update({
        login_password: passwordHash,
        must_change_password: false,
      })
      .eq("id", session.userId);

    if (error) {
      return NextResponse.json(
        { error: "Unable to change password." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      role: session.role,
    });
  } catch (error: any) {
    const message = String(error?.message || "");

    return NextResponse.json(
      {
        error:
          message === "UNAUTHORIZED"
            ? "Your session has expired. Please log in again."
            : "Unable to change password.",
      },
      {
        status:
          message === "UNAUTHORIZED" ? 401 : 500,
      }
    );
  }
}
