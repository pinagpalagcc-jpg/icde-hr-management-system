import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { sendEmail } from "@/lib/email";

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
      { error: "Access denied." },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: "Unable to complete request." },
    { status: 500 }
  );
}

export async function POST(
  request: Request,
  context: {
    params:
      | Promise<{ id: string }>
      | { id: string };
  }
) {
  try {
    const session = await requireSession();

    const params = await Promise.resolve(
      context.params
    );

    const body = await request.json();

    const { data: document, error: documentError } =
      await supabase
        .from("employee_documents")
        .select("*")
        .eq("id", params.id)
        .single();

    if (documentError || !document) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    if (
      session.role !== "Admin" &&
      session.userId !== document.employee_id
    ) {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const { data: employee, error: employeeError } =
      await supabase
        .from("employees")
        .select("id,email,first_name,last_name")
        .eq("id", document.employee_id)
        .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    const destinationEmail =
      String(body.email || employee.email || "").trim();

    if (!destinationEmail) {
      return NextResponse.json(
        {
          error:
            "Employee does not have a registered email address.",
        },
        { status: 400 }
      );
    }

    const emailResult = await sendEmail({
      to: destinationEmail,
      subject:
        "ICDE HR Management System – Employee Document",
      html: `
        <p>Dear ${employee.first_name || ""} ${employee.last_name || ""},</p>

        <p>Please find your requested employee document attached.</p>

        <p><strong>Document:</strong> ${document.document_name}</p>

        <p>
        This document was securely sent by the
        ICDE HR Management System.
        </p>

        <p>Please do not reply to this automated email.</p>

        <br/>

        <p>
        Kind Regards,<br/>
        HR Department<br/>
        ICDE
        </p>
      `,
      attachments: [
        {
          filename:
            document.file_name ||
            document.document_name ||
            "document",
          content:
            document.file_data || "",
        },
      ],
    });

    console.log("===== RESEND RESPONSE =====");
    console.dir(emailResult, { depth: null });

    return NextResponse.json({
      success: true,
      message:
        "Document emailed successfully.",
    });
  } catch (error) {
    return securityError(error);
  }
}
