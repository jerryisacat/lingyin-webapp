import { Prisma } from "@prisma/client"

export function handlePrismaError(error: unknown): {
  status: number
  message: string
} {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return { status: 409, message: "该记录已存在" }
      case "P2025":
        return { status: 404, message: "记录不存在" }
      case "P2003":
        return { status: 400, message: "关联数据不存在" }
      default:
        console.error("[Prisma] Unhandled error code:", error.code, error.message)
        return { status: 500, message: "服务器内部错误" }
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return { status: 400, message: "请求数据格式不正确" }
  }

  console.error("[Prisma] Unexpected error:", error)
  return { status: 500, message: "服务器内部错误" }
}
