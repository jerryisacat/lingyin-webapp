import { getUser, jsonError, jsonOk } from "@/lib/api-helpers";
import { uploadImage } from "@/lib/storage";
import { NextRequest } from "next/server";

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_TYPES = Object.keys(EXT_MAP);
const MAX_SIZE = 10 * 1024 * 1024;

function generateFilename(ext: string): string {
  const ts = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `IMG_${ts}_${random}.${ext}`;
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return jsonError("Unauthorized", 401);

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

  const mediaFile = await uploadImage(
    user.id,
    buffer,
    filename,
    file.type
  );

  return jsonOk(mediaFile, 201);
}