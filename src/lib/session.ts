import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "icde_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export type SessionRole = "Admin" | "Staff";

export type SessionPayload = {
  userId: string;
  role: SessionRole;
  username: string;
  isImpersonating?: boolean;
  originalAdminId?: string;
  originalAdminUsername?: string;
};

function getSessionSecret() {
  const value = process.env.ICDE_SESSION_SECRET;

  if (!value || value.length < 32) {
    throw new Error(
      "ICDE_SESSION_SECRET is missing or too short."
    );
  }

  return new TextEncoder().encode(value);
}

export async function createSession(
  payload: SessionPayload
) {
  const token = await new SignJWT({
    userId: payload.userId,
    role: payload.role,
    username: payload.username,
    isImpersonating:
      Boolean(payload.isImpersonating),
    originalAdminId:
      payload.originalAdminId || "",
    originalAdminUsername:
      payload.originalAdminUsername || "",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(
      `${SESSION_DURATION_SECONDS}s`
    )
    .sign(getSessionSecret());

  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    }
  );
}

export async function readSession(): Promise<
  SessionPayload | null
> {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    SESSION_COOKIE_NAME
  )?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
      }
    );

    const userId = String(
      payload.userId || ""
    );

    const username = String(
      payload.username || ""
    );

    const role =
      payload.role === "Admin"
        ? "Admin"
        : payload.role === "Staff"
        ? "Staff"
        : null;

    if (!userId || !username || !role) {
      return null;
    }

    return {
      userId,
      username,
      role,
      isImpersonating:
        payload.isImpersonating === true,
      originalAdminId: String(
        payload.originalAdminId || ""
      ),
      originalAdminUsername: String(
        payload.originalAdminUsername || ""
      ),
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    "",
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    }
  );
}

export async function requireSession() {
  const session = await readSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireSession();

  if (
    session.role !== "Admin" ||
    session.isImpersonating
  ) {
    throw new Error("FORBIDDEN");
  }

  return session;
}
