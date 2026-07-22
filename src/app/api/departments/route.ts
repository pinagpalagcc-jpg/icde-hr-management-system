import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabase } from "@/lib/supabase";
import {
  requireAdmin,
  requireSession,
} from "@/lib/session";

function securityError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "";

  if (message === "UNAUTHORIZED") {
    return NextResponse.json(
      { error: "Please log in." },
      { status: 401 }
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        error:
          "Admin access is required.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      error:
        "Unable to complete department request.",
    },
    { status: 500 }
  );
}

export async function GET() {
  try {
    await requireSession();

    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name", {
        ascending: true,
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

export async function POST(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const body = await request.json();

    const name = String(
      body.name || ""
    ).trim();

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Department name is required.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("departments")
      .insert({
        name,
        is_active: true,
      })
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

export async function PATCH(
  request: NextRequest
) {
  try {
    await requireAdmin();

    const body = await request.json();

    const id = String(
      body.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Department ID is required.",
        },
        { status: 400 }
      );
    }

    const updateData: {
      name?: string;
      is_active?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name = String(
        body.name || ""
      ).trim();

      if (!name) {
        return NextResponse.json(
          {
            error:
              "Department name is required.",
          },
          { status: 400 }
        );
      }

      updateData.name = name;
    }

    if (
      body.is_active !== undefined
    ) {
      updateData.is_active =
        Boolean(body.is_active);
    }

    const { data, error } = await supabase
      .from("departments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return securityError(error);
  }
}
