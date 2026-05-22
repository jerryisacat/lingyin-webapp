"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email"

function generateToken(): string {
  return crypto.randomUUID()
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export async function registerAction(
  _prevState: ActionResult<{ email: string }> | null,
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const email = formData.get("email") as string | null
  const password = formData.get("password") as string | null
  const confirmPassword = formData.get("confirmPassword") as string | null

  if (!email || !password || !confirmPassword) {
    return { ok: false, error: "请填写所有字段" }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    return { ok: false, error: "邮箱格式不正确" }
  }

  if (password.length < 8) {
    return { ok: false, error: "密码至少需要 8 个字符" }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "两次密码输入不一致" }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return { ok: false, error: "该邮箱已被注册" }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const token = generateToken()

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nickname: email.split("@")[0],
        verificationTokens: {
          create: {
            token,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
      },
    })

    await sendVerificationEmail({
      to: email,
      token,
      baseUrl: getBaseUrl(),
    })

    return { ok: true, data: { email: user.email } }
  } catch (err) {
    console.error("registerAction error:", err)
    return { ok: false, error: "注册失败，请稍后再试" }
  }
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token) {
    return { ok: false, error: "缺少验证令牌" }
  }

  try {
    const record = await prisma.verificationToken.findUnique({
      where: { token },
    })

    if (!record) {
      return { ok: false, error: "验证链接无效" }
    }

    if (record.expiresAt < new Date()) {
      await prisma.verificationToken.delete({ where: { token } })
      return { ok: false, error: "验证链接已过期，请重新注册" }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ])

    return { ok: true }
  } catch (err) {
    console.error("verifyEmailAction error:", err)
    return { ok: false, error: "验证失败，请稍后再试" }
  }
}

export async function forgotPasswordAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string | null

  if (!email) {
    return { ok: false, error: "请输入邮箱地址" }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    return { ok: false, error: "邮箱格式不正确" }
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return { ok: true }
    }

    const token = generateToken()

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    await sendPasswordResetEmail({
      to: email,
      token,
      baseUrl: getBaseUrl(),
    })

    return { ok: true }
  } catch (err) {
    console.error("forgotPasswordAction error:", err)
    return { ok: false, error: "发送失败，请稍后再试" }
  }
}

export async function resetPasswordAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const token = formData.get("token") as string | null
  const password = formData.get("password") as string | null
  const confirmPassword = formData.get("confirmPassword") as string | null

  if (!token) {
    return { ok: false, error: "缺少重置令牌" }
  }

  if (!password || !confirmPassword) {
    return { ok: false, error: "请填写所有字段" }
  }

  if (password.length < 8) {
    return { ok: false, error: "密码至少需要 8 个字符" }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: "两次密码输入不一致" }
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!record) {
      return { ok: false, error: "重置链接无效" }
    }

    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } })
      return { ok: false, error: "重置链接已过期，请重新申请" }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { token } }),
    ])

    return { ok: true }
  } catch (err) {
    console.error("resetPasswordAction error:", err)
    return { ok: false, error: "重置失败，请稍后再试" }
  }
}
