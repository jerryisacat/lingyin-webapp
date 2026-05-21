import { getPresignedUrl } from "@/lib/storage";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const redirect = searchParams.get("redirect");

  if (!key) {
    return NextResponse.json({ error: "Missing 'key' parameter" }, { status: 400 });
  }

  try {
    const signedUrl = await getPresignedUrl(key, 3600);

    // When redirect=true, the user gets a 302 redirect to the signed CloudFlare URL
    if (redirect === "true") {
      return NextResponse.redirect(signedUrl);
    }

    // Otherwise return the signed URL as JSON (for programmatic use)
    return NextResponse.json({ url: signedUrl });
  } catch {
    return NextResponse.json({ error: "Failed to generate image URL" }, { status: 500 });
  }
}
