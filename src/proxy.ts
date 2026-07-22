import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_ROUTES = [
  "/dashboard",
  "/employees",
  "/leave-requests",
  "/document-expiry",
  "/reports",
  "/departments",
];

const STAFF_ROUTES = [
  "/staff",
];

function getSecret() {
  const secret = process.env.ICDE_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("Session secret is missing.");
  }

  return new TextEncoder().encode(secret);
}

async function readRole(request: NextRequest) {
  const token = request.cookies.get("icde_session")?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      getSecret(),
      {
        algorithms: ["HS256"],
      }
    );

    return payload.role === "Admin"
      ? "Admin"
      : payload.role === "Staff"
      ? "Staff"
      : null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isAdminRoute = ADMIN_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  const isStaffRoute = STAFF_ROUTES.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );

  if (!isAdminRoute && !isStaffRoute) {
    return NextResponse.next();
  }

  const role = await readRole(request);

  if (!role) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  if (isAdminRoute && role !== "Admin") {
    return NextResponse.redirect(
      new URL("/staff", request.url)
    );
  }

  if (isStaffRoute && role !== "Staff") {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/employees/:path*",
    "/leave-requests/:path*",
    "/document-expiry/:path*",
    "/reports/:path*",
    "/departments/:path*",
    "/staff/:path*",
  ],
};
