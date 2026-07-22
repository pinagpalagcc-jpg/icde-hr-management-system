import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/session";

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

export async function PATCH(
  request: Request,
  context: {
    params:
      | Promise<{ id: string }>
      | { id: string };
  }
) {
  try {
    await requireAdmin();

    const params = await Promise.resolve(
      context.params
    );

    const body = await request.json();

    const updateData: Record<string, any> =
      {};

    const allowedFields = [
      "document_name",
      "category",
      "issue_date",
      "expiry_date",
      "not_applicable",
      "file_name",
      "file_type",
      "file_data",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (
      updateData.document_name !==
      undefined
    ) {
      updateData.document_name = String(
        updateData.document_name
      ).trim();
    }

    const { data, error } = await supabase
      .from("employee_documents")
      .update(updateData)
      .eq("id", params.id)
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

export async function DELETE(
  _request: Request,
  context: {
    params:
      | Promise<{ id: string }>
      | { id: string };
  }
) {
  try {
    await requireAdmin();

    const params = await Promise.resolve(
      context.params
    );

    const { error } = await supabase
      .from("employee_documents")
      .delete()
      .eq("id", params.id);

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
