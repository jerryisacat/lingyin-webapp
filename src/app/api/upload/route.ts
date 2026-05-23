import { getSessionUserId as getUser, jsonError, jsonOk } from "@/lib/auth-helpers";
import { uploadImage } from "@/lib/storage";
import { NextRequest } from "next/server";
import { getClientIP, checkRateLimit, rateLimiters, rateLimitError } from "@/lib/rate-limit";

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAGIC_BYTES: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],
};

const ALLOWED_TYPES = Object.keys(EXT_MAP);
const MAX_SIZE = 10 * 1024 * 1024;

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  const expected = MAGIC_BYTES[ext]
  if (!expected) return false
  return expected.every((byte, i) => buffer[i] === byte)
}

function generateFilename(ext: string): string {
  const ts = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `IMG_${ts}_${random}.${ext}`;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

  const ip = getClientIP(request);
  const { success, reset } = await checkRateLimit(rateLimiters.uploadImage, ip);
  if (!success) return rateLimitError(reset);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return jsonError("No file provided");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonError("File type not allowed — use JPG, PNG, or WebP");
  }

  if (file.size > MAX_SIZE) {
    return jsonError("File too large — max 10MB");
  }

  const ext = EXT_MAP[file.type];
  const filename = generateFilename(ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!validateMagicBytes(buffer, ext)) {
    return jsonError("File content does not match declared type");
  }

  const mediaFile = await uploadImage(
    user.id,
    buffer,
    filename,
    file.type
  );

  return jsonOk(mediaFile, 201);
}