import {
  NextRequest,
  NextResponse,
} from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import {
  requireAdmin,
  requireSession,
} from "@/lib/session";

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

export async function GET(
  _request: NextRequest,
  context: any
) {
  try {
    const session = await requireSession();
    const { id } = await context.params;

    if (
      session.role !== "Admin" &&
      session.userId !== id
    ) {
      return NextResponse.json(
        {
          error:
            "You can only view your own employee profile.",
        },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      removePassword(data)
    );
  } catch (error) {
    return securityError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    await requireAdmin();

    const { id } = await context.params;
    const body = await request.json();

    const updatePayload = {
      ...body,
    };

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "login_password"
      )
    ) {
      const newPassword = String(
        body.login_password || ""
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

      updatePayload.login_password =
        await bcrypt.hash(newPassword, 12);

      updatePayload.must_change_password =
        true;
    }

    const { data, error } = await supabase
      .from("employees")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      removePassword(data)
    );
  } catch (error) {
    return securityError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: any
) {
  try {
    await requireAdmin();

    const { id } = await context.params;

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return securityError(error);
  }
}
