import {
  NextRequest,
  NextResponse,
} from "next/server";
import { requireSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

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

  console.error(
    "INTERNAL CHAT ERROR:",
    error
  );

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Unable to complete chat request.",
    },
    { status: 500 }
  );
}

async function getOrCreateConversation({
  currentUserId,
  contactId,
  contactRole,
}: {
  currentUserId: string;
  contactId: string;
  contactRole: "Admin" | "Staff";
}) {
  const supabaseServer =
    getSupabaseServer();

  if (contactRole === "Admin") {
    if (currentUserId === contactId) {
      throw new Error(
        "You cannot start a conversation with yourself."
      );
    }

    const [adminOneId, adminTwoId] =
      [currentUserId, contactId].sort();

    const { data: existing, error: findError } =
      await supabaseServer
        .from("internal_chat_conversations")
        .select("*")
        .eq("conversation_type", "AdminAdmin")
        .eq("admin_one_id", adminOneId)
        .eq("admin_two_id", adminTwoId)
        .maybeSingle();

    if (findError) {
      throw new Error(findError.message);
    }

    if (existing) {
      return existing;
    }

    const { data, error } =
      await supabaseServer
        .from("internal_chat_conversations")
        .insert({
          conversation_type: "AdminAdmin",
          employee_id: null,
          admin_one_id: adminOneId,
          admin_two_id: adminTwoId,
        })
        .select()
        .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  const { data: existing, error: findError } =
    await supabaseServer
      .from("internal_chat_conversations")
      .select("*")
      .eq("conversation_type", "AdminStaff")
      .eq("employee_id", contactId)
      .maybeSingle();

  if (findError) {
    throw new Error(findError.message);
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabaseServer
    .from("internal_chat_conversations")
    .insert({
      conversation_type: "AdminStaff",
      employee_id: contactId,
      admin_one_id: null,
      admin_two_id: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function GET(
  request: NextRequest
) {
  try {
    const session = await requireSession();
    const supabaseServer =
      getSupabaseServer();

    const summaryRequested =
      request.nextUrl.searchParams.get(
        "summary"
      ) === "unread";

    if (summaryRequested) {
      if (session.role !== "Admin") {
        return NextResponse.json(
          {
            error:
              "Unread employee summaries are available only to Admin.",
          },
          { status: 403 }
        );
      }

      const {
        data: conversations,
        error: conversationsError,
      } = await supabaseServer
        .from(
          "internal_chat_conversations"
        )
        .select(
          "id, employee_id, conversation_type, admin_one_id, admin_two_id, updated_at"
        );

      if (conversationsError) {
        throw new Error(
          conversationsError.message
        );
      }

      const conversationRows =
        conversations || [];

      if (!conversationRows.length) {
        return NextResponse.json({
          unread_counts: {},
          last_activity: {},
        });
      }

      const conversationIds =
        conversationRows.map(
          (conversation) =>
            conversation.id
        );

      const {
        data: unreadMessages,
        error: unreadError,
      } = await supabaseServer
        .from(
          "internal_chat_messages"
        )
        .select("conversation_id")
        .in(
          "conversation_id",
          conversationIds
        )
        .eq("sender_role", "Staff")
        .eq("seen_by_admin", false)
        .eq("hidden_by_admin", false);

      if (unreadError) {
        throw new Error(
          unreadError.message
        );
      }

      const {
        data: activityMessages,
        error: activityError,
      } = await supabaseServer
        .from(
          "internal_chat_messages"
        )
        .select(
          "conversation_id, created_at"
        )
        .in(
          "conversation_id",
          conversationIds
        )
        .order(
          "created_at",
          { ascending: false }
        );

      if (activityError) {
        throw new Error(
          activityError.message
        );
      }

      const contactByConversation =
        new Map<string, string>();

      const lastActivity: Record<
        string,
        string
      > = {};

      for (const conversation of conversationRows) {
        let contactId = "";

        if (
          conversation.conversation_type ===
          "AdminAdmin"
        ) {
          if (
            conversation.admin_one_id ===
            session.userId
          ) {
            contactId =
              conversation.admin_two_id || "";
          } else if (
            conversation.admin_two_id ===
            session.userId
          ) {
            contactId =
              conversation.admin_one_id || "";
          }
        } else {
          contactId =
            conversation.employee_id || "";
        }

        if (!contactId) {
          continue;
        }

        contactByConversation.set(
          conversation.id,
          contactId
        );


      }

      for (
        const activityMessage of
        activityMessages || []
      ) {
        const contactId =
          contactByConversation.get(
            activityMessage.conversation_id
          );

        if (
          !contactId ||
          !activityMessage.created_at ||
          lastActivity[contactId]
        ) {
          continue;
        }

        lastActivity[contactId] =
          activityMessage.created_at;
      }

      const unreadCounts: Record<
        string,
        number
      > = {};

      for (
        const unreadMessage of
        unreadMessages || []
      ) {
        const contactId =
          contactByConversation.get(
            unreadMessage.conversation_id
          );

        if (!contactId) {
          continue;
        }

        unreadCounts[contactId] =
          (unreadCounts[contactId] || 0) + 1;
      }

      return NextResponse.json({
        unread_counts: unreadCounts,
        last_activity: lastActivity,
      });
    }

    const requestedContactId =
      request.nextUrl.searchParams.get(
        "contact_id"
      ) ||
      request.nextUrl.searchParams.get(
        "employee_id"
      );

    const requestedContactRole =
      String(
        request.nextUrl.searchParams.get(
          "contact_role"
        ) || "Staff"
      ).toLowerCase() === "admin"
        ? "Admin"
        : "Staff";

    const contactId =
      session.role === "Admin"
        ? String(requestedContactId || "").trim()
        : session.userId;

    const contactRole =
      session.role === "Admin"
        ? requestedContactRole
        : "Staff";

    if (!contactId) {
      return NextResponse.json(
        {
          error:
            "Contact ID is required.",
        },
        { status: 400 }
      );
    }

    const conversation =
      await getOrCreateConversation({
        currentUserId: session.userId,
        contactId,
        contactRole,
      });

    const hiddenColumn =
      session.role === "Admin"
        ? "hidden_by_admin"
        : "hidden_by_employee";

    const { data: messages, error } =
      await supabaseServer
        .from("internal_chat_messages")
        .select("*")
        .eq(
          "conversation_id",
          conversation.id
        )
        .eq(hiddenColumn, false)
        .order("created_at", {
          ascending: true,
        });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (session.role === "Admin") {
      await supabaseServer
        .from("internal_chat_messages")
        .update({
          seen_by_admin: true,
        })
        .eq(
          "conversation_id",
          conversation.id
        )
        .eq("sender_role", "Staff");
    } else {
      await supabaseServer
        .from("internal_chat_messages")
        .update({
          seen_by_employee: true,
        })
        .eq(
          "conversation_id",
          conversation.id
        )
        .eq("sender_role", "Admin");
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
    });
  } catch (error) {
    return securityError(error);
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const session = await requireSession();
    const supabaseServer =
      getSupabaseServer();
    const body = await request.json();

    const requestedContactId = String(
      body.contact_id ||
      body.employee_id ||
      ""
    ).trim();

    const requestedContactRole =
      String(
        body.contact_role || "Staff"
      ).toLowerCase() === "admin"
        ? "Admin"
        : "Staff";

    const contactId =
      session.role === "Admin"
        ? requestedContactId
        : session.userId;

    const contactRole =
      session.role === "Admin"
        ? requestedContactRole
        : "Staff";

    if (!contactId) {
      return NextResponse.json(
        {
          error:
            "Contact ID is required.",
        },
        { status: 400 }
      );
    }

    const messageText = String(
      body.message_text || ""
    ).trim();

    const attachmentName = String(
      body.attachment_name || ""
    ).trim();

    const attachmentUrl = String(
      body.attachment_url || ""
    ).trim();

    const attachmentType = String(
      body.attachment_type || ""
    ).trim();

    const replyToMessageId = String(
      body.reply_to_message_id || ""
    ).trim();

    if (!messageText && !attachmentUrl) {
      return NextResponse.json(
        {
          error:
            "Enter a message or attach a document.",
        },
        { status: 400 }
      );
    }

    const conversation =
      await getOrCreateConversation({
        currentUserId: session.userId,
        contactId,
        contactRole,
      });

    if (replyToMessageId) {
      const {
        data: replyMessage,
        error: replyMessageError,
      } = await supabaseServer
        .from("internal_chat_messages")
        .select("id, conversation_id")
        .eq("id", replyToMessageId)
        .maybeSingle();

      if (replyMessageError) {
        throw new Error(
          replyMessageError.message
        );
      }

      if (
        !replyMessage ||
        replyMessage.conversation_id !==
          conversation.id
      ) {
        return NextResponse.json(
          {
            error:
              "The original reply message is unavailable.",
          },
          { status: 400 }
        );
      }
    }

    const { data, error } =
      await supabaseServer
        .from("internal_chat_messages")
        .insert({
          conversation_id:
            conversation.id,
          sender_id: session.userId,
          sender_role: session.role,
          message_text:
            messageText || null,
          attachment_name:
            attachmentName || null,
          attachment_url:
            attachmentUrl || null,
          attachment_type:
            attachmentType || null,
          reply_to_message_id:
            replyToMessageId || null,
          seen_by_admin:
            session.role === "Admin",
          seen_by_employee:
            session.role === "Staff",
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
    const session = await requireSession();
    const supabaseServer =
      getSupabaseServer();

    const body = await request.json();

    const messageId = String(
      body.message_id || ""
    ).trim();

    const action = String(
      body.action || ""
    ).trim();

    if (!messageId) {
      return NextResponse.json(
        {
          error:
            "Message ID is required.",
        },
        { status: 400 }
      );
    }

    if (action !== "delete_for_me") {
      return NextResponse.json(
        {
          error:
            "Unsupported message action.",
        },
        { status: 400 }
      );
    }

    const {
      data: message,
      error: messageError,
    } = await supabaseServer
      .from("internal_chat_messages")
      .select(
        "id, conversation_id"
      )
      .eq("id", messageId)
      .maybeSingle();

    if (messageError) {
      throw new Error(
        messageError.message
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Message not found.",
        },
        { status: 404 }
      );
    }

    const {
      data: conversation,
      error: conversationError,
    } = await supabaseServer
      .from(
        "internal_chat_conversations"
      )
      .select("employee_id")
      .eq(
        "id",
        message.conversation_id
      )
      .maybeSingle();

    if (conversationError) {
      throw new Error(
        conversationError.message
      );
    }

    if (!conversation) {
      return NextResponse.json(
        {
          error:
            "Conversation not found.",
        },
        { status: 404 }
      );
    }

    const allowed =
      session.role === "Admin" ||
      (
        session.role === "Staff" &&
        conversation.employee_id ===
          session.userId
      );

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "You cannot hide this message.",
        },
        { status: 403 }
      );
    }

    const hiddenColumn =
      session.role === "Admin"
        ? "hidden_by_admin"
        : "hidden_by_employee";

    const { error: updateError } =
      await supabaseServer
        .from("internal_chat_messages")
        .update({
          [hiddenColumn]: true,
        })
        .eq("id", messageId);

    if (updateError) {
      throw new Error(
        updateError.message
      );
    }

    return NextResponse.json({
      success: true,
      action: "delete_for_me",
    });
  } catch (error) {
    return securityError(error);
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const session = await requireSession();
    const supabaseServer =
      getSupabaseServer();

    const messageId = String(
      request.nextUrl.searchParams.get(
        "message_id"
      ) || ""
    ).trim();

    if (!messageId) {
      return NextResponse.json(
        {
          error:
            "Message ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: message, error: messageError } =
      await supabaseServer
        .from("internal_chat_messages")
        .select(
          "id, sender_id, sender_role, conversation_id, attachment_url"
        )
        .eq("id", messageId)
        .maybeSingle();

    if (messageError) {
      throw new Error(
        messageError.message
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Message not found.",
        },
        { status: 404 }
      );
    }

    const { data: conversation, error: conversationError } =
      await supabaseServer
        .from("internal_chat_conversations")
        .select("employee_id")
        .eq(
          "id",
          message.conversation_id
        )
        .maybeSingle();

    if (conversationError) {
      throw new Error(
        conversationError.message
      );
    }

    if (!conversation) {
      return NextResponse.json(
        {
          error:
            "Conversation not found.",
        },
        { status: 404 }
      );
    }

    const allowed =
      session.role === "Admin" ||
      (
        session.role === "Staff" &&
        message.sender_id === session.userId &&
        conversation.employee_id ===
          session.userId
      );

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "You cannot delete this message.",
        },
        { status: 403 }
      );
    }

    if (message.attachment_url) {
      const {
        count: attachmentReferenceCount,
        error: referenceError,
      } = await supabaseServer
        .from("internal_chat_messages")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "attachment_url",
          message.attachment_url
        )
        .neq("id", message.id);

      if (referenceError) {
        throw new Error(
          referenceError.message
        );
      }

      if (
        !attachmentReferenceCount ||
        attachmentReferenceCount === 0
      ) {
        const { error: storageError } =
          await supabaseServer.storage
            .from("internal-chat")
            .remove([
              message.attachment_url,
            ]);

        if (storageError) {
          console.error(
            "CHAT FILE DELETE ERROR:",
            storageError
          );
        }
      }
    }

    const { error: deleteError } =
      await supabaseServer
        .from("internal_chat_messages")
        .delete()
        .eq("id", messageId);

    if (deleteError) {
      throw new Error(
        deleteError.message
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return securityError(error);
  }
}

