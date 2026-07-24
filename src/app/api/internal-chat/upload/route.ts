import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const BUCKET_NAME = "internal-chat";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
]);

function safeFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-() ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 120);

  return cleaned || "attachment";
}

async function ensureBucket() {
  const supabase = getSupabaseServer();

  const { data, error } =
    await supabase.storage.getBucket(BUCKET_NAME);

  if (data) {
    return;
  }

  if (
    error &&
    !error.message.toLowerCase().includes("not found")
  ) {
    throw new Error(error.message);
  }

  const { error: createError } =
    await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: false,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: Array.from(ALLOWED_TYPES),
      }
    );

  if (
    createError &&
    !createError.message
      .toLowerCase()
      .includes("already exists")
  ) {
    throw new Error(createError.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(uploadedFile.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Use PDF, Word, Excel, JPG or PNG.",
        },
        { status: 400 }
      );
    }

    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "The attachment must not exceed 20 MB.",
        },
        { status: 400 }
      );
    }

    if (uploadedFile.size === 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 }
      );
    }

    await ensureBucket();

    const supabase = getSupabaseServer();

    const originalName = safeFileName(
      uploadedFile.name
    );

    const storagePath = [
      session.role.toLowerCase(),
      session.userId,
      new Date().toISOString().slice(0, 10),
      `${crypto.randomUUID()}-${originalName}`,
    ].join("/");

    const fileBuffer = Buffer.from(
      await uploadedFile.arrayBuffer()
    );

    const { error: uploadError } =
      await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: uploadedFile.type,
          upsert: false,
        });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    return NextResponse.json({
      attachment_name: uploadedFile.name,
      attachment_url: storagePath,
      attachment_type: uploadedFile.type,
      attachment_size: uploadedFile.size,
    });
  } catch (error) {
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

    console.error("CHAT UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload attachment.",
      },
      { status: 500 }
    );
  }
}
