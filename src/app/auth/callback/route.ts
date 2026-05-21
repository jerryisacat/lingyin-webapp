import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // DEBUG: collect cookie names and values present at callback time
  const allCookies = request.cookies.getAll();
  const debugCookies = allCookies.map(c => c.name).join(",");
  const rawCookieHeader = request.headers.get("cookie") || "(none)";

  // DEBUG: log the actual code verifier cookie value
  const codeVerifierCookie = request.cookies.get(
    "sb-pndfkxcrqvfhvhvxxwjg-auth-token-code-verifier"
  );
  console.log("[callback] code verifier cookie:", codeVerifierCookie ? {
    name: codeVerifierCookie.name,
    valueLength: codeVerifierCookie.value?.length || 0,
    valuePreview: codeVerifierCookie.value?.substring(0, 50) + "..."
  } : "NOT FOUND");

  // Create a response early so we can attach session cookies to it
  let response = NextResponse.redirect(`${origin}/`);

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const val = request.cookies.get(name)?.value;
          if (name.includes("code-verifier")) {
            console.log("[callback] get cookie:", name, "value:", val ? `length=${val.length}` : "undefined");
          }
          return val;
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
    const debug = `debug_ncookies=${allCookies.length}&debug_names=${encodeURIComponent(debugCookies)}&debug_cv_len=${codeVerifierCookie?.value?.length || 0}&raw_cookie=${encodeURIComponent(rawCookieHeader.substring(0, 300))}`;
    console.error("[callback] exchangeCodeForSession error:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}&${debug}`
    );
  }

  // Return the response that now has session cookies attached
  return response;
}
