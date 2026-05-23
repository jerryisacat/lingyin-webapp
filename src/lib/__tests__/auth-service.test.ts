import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  },
}))

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}))

const { registerUser } = await import("../auth-service")
const { prisma } = await import("@/lib/db")

describe("registerUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects short password", async () => {
    const result = await registerUser({
      email: "test@example.com",
      password: "short",
      confirmPassword: "short",
    })
    expect(result.ok).toBe(false)
    expect(result).toHaveProperty("error")
  })

  it("rejects mismatched passwords", async () => {
    const result = await registerUser({
      email: "test@example.com",
      password: "123456789012",
      confirmPassword: "different1234",
    })
    expect(result.ok).toBe(false)
  })

  it("rejects invalid email", async () => {
    const result = await registerUser({
      email: "not-an-email",
      password: "123456789012",
      confirmPassword: "123456789012",
    })
    expect(result.ok).toBe(false)
  })

  it("registers successfully", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
    } as never)

    const result = await registerUser({
      email: "test@example.com",
      password: "123456789012",
      confirmPassword: "123456789012",
    })
    expect(result.ok).toBe(true)
  })
})
