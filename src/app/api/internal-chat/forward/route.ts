import {
  NextRequest,
  NextResponse,
} from "next/server";

import { requireSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest
) {
  try {
    const session = await requireSession();

    if (session.role !== "Admin") {
      return NextResponse.json(
        {
          error:
            "Only Admin can forward messages to employees.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const sourceMessageId = String(
      body.source_message_id || ""
    ).trim();

    const employeeIds = Array.isArray(
      body.employee_ids
    )
      ? Array.from(
          new Set(
            body.employee_ids
              .map((value: unknown) =>
                String(value || "").trim()
              )
              .filter(Boolean)
          )
        )
      : [];

    if (!sourceMessageId) {
      return NextResponse.json(
        {
          error:
            "Source message is required.",
        },
        { status: 400 }
      );
    }

    if (!employeeIds.length) {
      return NextResponse.json(
        {
          error:
            "Select at least one employee.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getSupabaseServer();

    const {
      data: sourceMessage,
      error: sourceMessageError,
    } = await supabase
      .from("internal_chat_messages")
      .select(
        "id, message_text, attachment_name, attachment_url, attachment_type"
      )
      .eq("id", sourceMessageId)
      .maybeSingle();

    if (sourceMessageError) {
      throw new Error(
        sourceMessageError.message
      );
    }

    if (!sourceMessage) {
      return NextResponse.json(
        {
          error:
            "The original message is unavailable.",
        },
        { status: 404 }
      );
    }

    if (
      !sourceMessage.message_text &&
      !sourceMessage.attachment_url
    ) {
      return NextResponse.json(
        {
          error:
            "This message has nothing to forward.",
        },
        { status: 400 }
      );
    }

    const {
      data: validEmployees,
      error: employeesError,
    } = await supabase
      .from("employees")
      .select("id, status")
      .in("id", employeeIds);

    if (employeesError) {
      throw new Error(
        employeesError.message
      );
    }

    const validEmployeeIds = (
      validEmployees || []
    )
      .filter(
        (employee) =>
          employee.status !== "Inactive"
      )
      .map((employee) => employee.id);

    if (
      validEmployeeIds.length !==
      employeeIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more selected employees are unavailable.",
        },
        { status: 400 }
      );
    }

    const conversationIds: string[] = [];

    for (const employeeId of validEmployeeIds) {
      const {
        data: existingConversation,
        error: findError,
      } = await supabase
        .from(
          "internal_chat_conversations"
        )
        .select("id")
        .eq("employee_id", employeeId)
        .maybeSingle();

      if (findError) {
        throw new Error(
          findError.message
        );
      }

      if (existingConversation) {
        conversationIds.push(
          existingConversation.id
        );
        continue;
      }

      const {
        data: createdConversation,
        error: createError,
      } = await supabase
        .from(
          "internal_chat_conversations"
        )
        .insert({
          employee_id: employeeId,
        })
        .select("id")
        .single();

      if (createError) {
        throw new Error(
          createError.message
        );
      }

      conversationIds.push(
        createdConversation.id
      );
    }

    const forwardedRows =
      conversationIds.map(
        (conversationId) => ({
          conversation_id:
            conversationId,
          sender_id: session.userId,
          sender_role: "Admin",
          message_text:
            sourceMessage.message_text ||
            null,
          attachment_name:
            sourceMessage.attachment_name ||
            null,
          attachment_url:
            sourceMessage.attachment_url ||
            null,
          attachment_type:
            sourceMessage.attachment_type ||
            null,
          reply_to_message_id: null,
          forwarded_from_message_id:
            sourceMessage.id,
          seen_by_admin: true,
          seen_by_employee: false,
        })
      );

    const {
      data: forwardedMessages,
      error: insertError,
    } = await supabase
      .from("internal_chat_messages")
      .insert(forwardedRows)
      .select();

    if (insertError) {
      throw new Error(
        insertError.message
      );
    }

    return NextResponse.json(
      {
        success: true,
        forwarded_count:
          forwardedMessages?.length || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        {
          error: "Please log in.",
        },
        { status: 401 }
      );
    }

    if (message === "FORBIDDEN") {
      return NextResponse.json(
        {
          error: "Access denied.",
        },
        { status: 403 }
      );
    }

    console.error(
      "CHAT FORWARD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to forward message.",
      },
      { status: 500 }
    );
  }
}
