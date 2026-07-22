import { NextResponse } from "next/server";

import {
  createSession,
  requireSession,
} from "@/lib/session";

export async function POST() {
  try {
    const session =
      await requireSession();

    if (
      !session.isImpersonating ||
      !session.originalAdminId ||
      !session.originalAdminUsername
    ) {
      return NextResponse.json(
        {
          error:
            "No Admin testing session is active.",
        },
        { status: 403 }
      );
    }

    await createSession({
      userId:
        session.originalAdminId,
      role: "Admin",
      username:
        session.originalAdminUsername,
    });

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to restore Admin session.",
      },
      { status: 401 }
    );
  }
}
