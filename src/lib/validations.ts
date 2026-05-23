import { z } from "zod";

export const emailSchema = z.string().email("邮箱格式不正确");

export const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(12, "密码至少需要 12 个字符"),
  confirmPassword: z.string().min(12, "密码至少需要 12 个字符"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "缺少重置令牌"),
  password: z.string().min(12, "密码至少需要 12 个字符"),
  confirmPassword: z.string().min(12, "密码至少需要 12 个字符"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
});

const VALID_TONES = ["warm", "genki", "minimal", "literary"] as const;

export const entriesListSchema = z.object({
  view: z.enum(["calendar"]).optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  markdown: z.string().min(1, "日记内容不能为空"),
  tone: z.enum(VALID_TONES).optional().default("warm"),
  imagePaths: z.array(z.string()).optional().default([]),
  encrypted: z.boolean().optional().default(false),
});

export const updateEntrySchema = z.object({
  markdown: z.string().min(1, "日记内容不能为空"),
  tone: z.enum(VALID_TONES).optional().default("warm"),
  imagePaths: z.array(z.string()).optional().default([]),
  encrypted: z.boolean().optional().default(false),
});

const VALID_PROVIDERS = ["openrouter"] as const;

export const aiGenerateSchema = z.object({
  text: z.string().optional().default(""),
  images: z.array(z.object({
    url: z.string(),
    path: z.string(),
    type: z.literal("image"),
    mime: z.string(),
    size: z.number(),
  })).optional().default([]),
  tone: z.enum(VALID_TONES).optional().default("warm"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  provider: z.enum(VALID_PROVIDERS).optional().default("openrouter"),
});

export const aiRewriteSchema = z.object({
  content: z.string().min(1, "内容不能为空"),
  instruction: z.string().optional(),
  provider: z.enum(VALID_PROVIDERS).optional().default("openrouter"),
});

export const aiTestSchema = z.object({
  provider: z.enum(VALID_PROVIDERS).optional().default("openrouter"),
  apiKey: z.string().optional(),
});

export const saveApiKeySchema = z.object({
  provider: z.enum(VALID_PROVIDERS),
  apiKey: z.string().min(1, "API Key 不能为空"),
  label: z.string().optional(),
});

export const userConfigSchema = z.object({
  tone: z.enum(VALID_TONES),
});

export const encryptionPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "加密密码至少需要 8 位")
    .regex(/[a-zA-Z]/, "密码需包含字母")
    .regex(/[0-9]/, "密码需包含数字"),
});

export const changeEncryptionPasswordSchema = z.object({
  oldPassword: z.string().min(1, "请输入旧密码"),
  newPassword: z
    .string()
    .min(8, "加密密码至少需要 8 位")
    .regex(/[a-zA-Z]/, "密码需包含字母")
    .regex(/[0-9]/, "密码需包含数字"),
});

export const verifyEncryptionPasswordSchema = z.object({
  password: z.string().min(1, "密码不能为空"),
});

export function formatZodError(error: z.ZodError): string {
  return error.errors.map(e => {
    const path = e.path.join(".");
    return path ? `${path}: ${e.message}` : e.message;
  }).join("; ");
}
