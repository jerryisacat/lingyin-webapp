"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setError(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sakura/10">
          <BookOpen className="h-8 w-8 text-sakura" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          登录铃英日记
        </h1>
        <p className="text-sm text-ink-light">
          输入邮箱，我们会发送一个魔法链接
        </p>
      </div>

      {status === "sent" ? (
        <div className="card flex max-w-sm flex-col items-center gap-4 text-center">
          <Mail className="h-10 w-10 text-sakura" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">查看你的邮箱</h2>
          <p className="text-sm text-ink-light">
            我们已向{" "}
            <span className="font-medium text-ink">{email}</span>{" "}
            发送了一个魔法链接。点击链接即可登录。
          </p>
          <p className="text-xs text-ink-light">
            没收到？检查一下垃圾邮件文件夹
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="btn-ghost mt-2 text-sm"
          >
            换一个邮箱
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
              邮箱地址
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              required
              disabled={status === "loading"}
              className="input-field"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading" || !email}
            className="btn-primary flex w-full items-center justify-center gap-2"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                发送中...
              </>
            ) : (
              <>
                发送魔法链接
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
