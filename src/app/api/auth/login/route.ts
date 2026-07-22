import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { createSession } from "@/lib/session";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

function normalizeRole(value: unknown): "Admin" | "Staff" {
  return String(value || "").toLowerCase() === "admin"
    ? "Admin"
    : "Staff";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const username = String(
      body.username || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password || ""
    );

    if (!username || !password) {
      return NextResponse.json(
        {
          error:
            "Username and password are required.",
        },
        { status: 400 }
      );
    }

    const { data: employee, error } =
      await supabase
        .from("employees")
        .select(
          "id, login_username, login_password, user_role, must_change_password, status, failed_login_attempts, locked_until"
        )
        .ilike("login_username", username)
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Unable to verify login." },
        { status: 500 }
      );
    }

    if (
      !employee ||
      employee.status === "Inactive"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    const now = new Date();

    if (employee.locked_until) {
      const lockedUntil =
        new Date(employee.locked_until);

      if (lockedUntil.getTime() > now.getTime()) {
        const remainingMinutes = Math.max(
          1,
          Math.ceil(
            (lockedUntil.getTime() -
              now.getTime()) /
              60000
          )
        );

        return NextResponse.json(
          {
            error:
              `Too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
          },
          { status: 429 }
        );
      }
    }

    const storedPassword = String(
      employee.login_password || ""
    );

    const passwordMatches =
      storedPassword.startsWith("$2")
        ? await bcrypt.compare(
            password,
            storedPassword
          )
        : password === storedPassword;

    if (!passwordMatches) {
      const failedAttempts =
        Number(
          employee.failed_login_attempts || 0
        ) + 1;

      if (
        failedAttempts >=
        MAX_FAILED_ATTEMPTS
      ) {
        const lockedUntil = new Date(
          now.getTime() +
            LOCK_MINUTES * 60 * 1000
        ).toISOString();

        await supabase
          .from("employees")
          .update({
            failed_login_attempts: 0,
            locked_until: lockedUntil,
          })
          .eq("id", employee.id);

        return NextResponse.json(
          {
            error:
              "Too many failed attempts. Account locked for 15 minutes.",
          },
          { status: 429 }
        );
      }

      await supabase
        .from("employees")
        .update({
          failed_login_attempts:
            failedAttempts,
          locked_until: null,
        })
        .eq("id", employee.id);

      return NextResponse.json(
        {
          error:
            "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    await supabase
      .from("employees")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("id", employee.id);

    const role = normalizeRole(
      employee.user_role
    );

    await createSession({
      userId: employee.id,
      role,
      username:
        employee.login_username || username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: employee.id,
        role,
        mustChangePassword:
          Boolean(
            employee.must_change_password
          ),
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to complete login.",
      },
      { status: 500 }
    );
  }
}
