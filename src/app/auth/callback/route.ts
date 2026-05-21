import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // DEBUG: collect cookie names present at callback time
  const debugCookies = request.cookies.getAll().map(c => c.name).join(",");
  const rawCookieHeader = request.headers.get("cookie") || "(none)";

  // Create a response early so we can attach session cookies to it
  let response = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Write to both request (in-memory) and response (set-cookie header)
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: "", ...options });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const debug = `debug_ncookies=${request.cookies.getAll().length}&debug_names=${encodeURIComponent(debugCookies)}&raw_cookie=${encodeURIComponent(rawCookieHeader.substring(0, 200))}`;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}&${debug}`
    );
  }

  // Return the response that now has session cookies attached
  return response;
}
