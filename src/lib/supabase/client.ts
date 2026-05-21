import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize } from "cookie";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const parsed = parse(document.cookie);
          return parsed[name];
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
          // Use the same `cookie` package that @supabase/ssr uses internally,
          // ensuring identical encoding/decoding behavior.
          document.cookie = serialize(name, value, {
            path: options?.path || "/",
            sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
            secure: options?.secure,
            maxAge: options?.maxAge,
            domain: options?.domain,
          });
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
          document.cookie = serialize(name, "", {
            path: options?.path || "/",
            sameSite: (options?.sameSite as "lax" | "strict" | "none") || "lax",
            maxAge: 0,
            domain: options?.domain,
          });
        },
      },
    }
  );
}
