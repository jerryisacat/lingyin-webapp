import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const match = document.cookie.match(
            new RegExp(`(?:^|; )${name}=([^;]*)`)
          );
          return match ? decodeURIComponent(match[1]) : undefined;
        },
        set(
          name: string,
          value: string,
          options?: {
            sameSite?: string;
            secure?: boolean;
            maxAge?: number;
            domain?: string;
            path?: string;
          }
        ) {
          let cookie = `${name}=${encodeURIComponent(value)}; path=${options?.path || "/"}`;
          if (options?.secure) cookie += "; Secure";
          if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
          if (options?.domain) cookie += `; Domain=${options.domain}`;
          // Use Lax instead of Strict — Strict blocks cookies when user
          // clicks a magic link from an email client (cross-site navigation).
          // Lax still protects against CSRF on cross-site POST requests.
          cookie += `; SameSite=${options?.sameSite || "Lax"}`;
          document.cookie = cookie;
        },
        remove(
          name: string,
          options?: {
            sameSite?: string;
            secure?: boolean;
            domain?: string;
            path?: string;
          }
        ) {
          document.cookie = `${name}=; path=${options?.path || "/"}; SameSite=${options?.sameSite || "Lax"}; Max-Age=0`;
        },
      },
    }
  );
}
