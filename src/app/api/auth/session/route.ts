import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export async function GET() {
  const session = await readSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,

    userId: session.userId,
    role: session.role,
    username: session.username,

    user: {
      userId: session.userId,
      role: session.role,
      username: session.username,
    },
  });
}
