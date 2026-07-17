import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  context: {
    params:
      | Promise<{ id: string }>
      | { id: string };
  }
) {
  try {
    const params = await Promise.resolve(
      context.params
    );

    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (
      body.document_name !== undefined
    ) {
      updateData.document_name =
        String(body.document_name).trim();
    }

    if (body.file_name !== undefined) {
      updateData.file_name =
        body.file_name;
    }

    if (body.file_type !== undefined) {
      updateData.file_type =
        body.file_type;
    }

    if (body.file_data !== undefined) {
      updateData.file_data =
        body.file_data;
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
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to update document.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params);

  const { error } = await supabase
    .from("employee_documents")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
