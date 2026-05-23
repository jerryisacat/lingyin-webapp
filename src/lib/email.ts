import { Resend } from "resend"

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required")
  }
  return new Resend(apiKey)
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "noreply@lingyin.app"
}

export async function sendVerificationEmail(params: {
  to: string
  token: string
  baseUrl: string
}): Promise<void> {
  const { to, token, baseUrl } = params
  const verifyUrl = `${baseUrl}/verify-email?token=${token}`

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject: "验证你的玲音日记邮箱",
    html: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif">
      <h1 style="color:#f0a8b0">玲音日记</h1>
      <p>感谢注册玲音日记！请点击下方按钮验证你的邮箱：</p>
      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#f0a8b0;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">验证邮箱</a>
      <p style="color:#888;font-size:14px">此链接 24 小时内有效。如果不是你注册的，请忽略此邮件。</p>
    </div>`,
  })

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`)
  }
}

export async function sendPasswordResetEmail(params: {
  to: string
  token: string
  baseUrl: string
}): Promise<void> {
  const { to, token, baseUrl } = params
  // NOTE: Token is passed via URL query param (industry standard). To reduce exposure:
  // token expires in 1 hour, is single-use, and the reset-password page clears it
  // from browser history via replaceState on load.
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  const resend = getResend()
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [to],
    subject: "重置你的玲音日记密码",
    html: `<div style="max-width:600px;margin:0 auto;font-family:sans-serif">
      <h1 style="color:#f0a8b0">玲音日记</h1>
      <p>你请求了密码重置。请点击下方按钮设置新密码：</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#f0a8b0;color:#fff;text-decoration:none;border-radius:8px;margin:16px 0">重置密码</a>
      <p style="color:#888;font-size:14px">此链接 1 小时内有效。如果不是你请求的，请忽略此邮件。</p>
    </div>`,
  })

  if (error) {
    throw new Error(`Failed to send password reset email: ${error.message}`)
  }
}