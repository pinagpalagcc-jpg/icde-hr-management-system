import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import {
  createSession,
  requireAdmin,
} from "@/lib/session";

export async function POST(
  request: NextRequest
) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();

    const employeeId = String(
      body.employee_id || ""
    ).trim();

    if (!employeeId) {
      return NextResponse.json(
        {
          error: "Employee ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: employee, error } =
      await supabase
        .from("employees")
        .select(
          "id, login_username, status"
        )
        .eq("id", employeeId)
        .single();

    if (error || !employee) {
      return NextResponse.json(
        {
          error:
            "Employee account was not found.",
        },
        { status: 404 }
      );
    }

    if (employee.status === "Inactive") {
      return NextResponse.json(
        {
          error:
            "Inactive employee accounts cannot be tested.",
        },
        { status: 400 }
      );
    }

    await createSession({
      userId: employee.id,
      role: "Staff",
      username:
        employee.login_username ||
        `employee-${employee.id}`,
      isImpersonating: true,
      originalAdminId: admin.userId,
      originalAdminUsername:
        admin.username,
    });

    return NextResponse.json({
      success: true,
      employeeId: employee.id,
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
            ? "Please log in again as Admin."
            : "Only Admin can start employee testing mode.",
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
