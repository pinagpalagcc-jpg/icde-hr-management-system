import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const BUCKET_NAME = "internal-chat";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const messageId = String(
      request.nextUrl.searchParams.get("message_id") ||
        ""
    ).trim();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { data: message, error: messageError } =
      await supabase
        .from("internal_chat_messages")
        .select(
          "id, conversation_id, attachment_url, attachment_name, attachment_type"
        )
        .eq("id", messageId)
        .maybeSingle();

    if (messageError) {
      throw new Error(messageError.message);
    }

    if (!message?.attachment_url) {
      return NextResponse.json(
        { error: "Attachment not found." },
        { status: 404 }
      );
    }

    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("internal_chat_conversations")
      .select("employee_id")
      .eq("id", message.conversation_id)
      .maybeSingle();

    if (conversationError) {
      throw new Error(conversationError.message);
    }

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found." },
        { status: 404 }
      );
    }

    const allowed =
      session.role === "Admin" ||
      conversation.employee_id === session.userId;

    if (!allowed) {
      return NextResponse.json(
        { error: "Access denied." },
        { status: 403 }
      );
    }

    const downloadRequested =
      request.nextUrl.searchParams.get("download") ===
      "1";

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(
        message.attachment_url,
        60,
        downloadRequested
          ? {
              download:
                message.attachment_name ||
                "attachment",
            }
          : undefined
      );

    if (error || !data?.signedUrl) {
      throw new Error(
        error?.message ||
          "Unable to open attachment."
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Please log in." },
        { status: 401 }
      );
    }

    console.error(
      "CHAT ATTACHMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to open attachment.",
      },
      { status: 500 }
    );
  }
}
