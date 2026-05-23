# #10 Stripe 订阅支付 — 开发心得

> 供后续 Agent 开发 #11-#15（Stream C 后续）参考。

## Stripe SDK v22 类型系统

Stripe v22 (`^22.1.1`) 废弃了旧版 `Stripe.Invoice` / `Stripe.Subscription` / `Stripe.Event` 等 namespace 类型。新版使用 **interface 导出**：

```typescript
// ❌ v21 旧写法（不可用）
import Stripe from "stripe";
const event: Stripe.Event = ...;
const invoice: Stripe.Invoice = event.data.object;

// ✅ v22 新写法
import Stripe from "stripe";
const event: Stripe.Event = ...; // 仍可用
await handler(event.data.object as unknown as Record<string, unknown>);
```

**Webhook handler 必须用 `Record<string, unknown>` 做运行时访问**，因为 `event.data.object` 的 TypeScript 类型是一个 70+ 类型的联合体，直接断言会报 TS2352。

## Stripe v22 API 字段变更

| 旧字段（v21） | 新字段（v22） |
|---|---|
| `Invoice.subscription` (string) | 需通过 `subscription_details` 或额外 retrieve |
| `Subscription.current_period_start` | → `billing_cycle_anchor` |
| `Subscription.current_period_end` | 不存在（用 `cancel_at` + items 推断） |

## 开发环境

### 本地 Webhook 转发（必需）

```bash
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

终端输出的 `whsec_xxx` → 填入 `.env` 的 `STRIPE_WEBHOOK_SECRET`。必须保持该终端运行。

### Stripe 环境变量（共 5 个）

```bash
STRIPE_SECRET_KEY="sk_test_..."                    # 服务端
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."   # 客户端（必加 NEXT_PUBLIC_）
STRIPE_WEBHOOK_SECRET="whsec_..."                  # CLI 获取
STRIPE_PRICE_BASIC_MONTHLY="price_xxx"             # Stripe Dashboard → Products
STRIPE_PRICE_ADVANCED_MONTHLY="price_xxx"
```

**陷阱**：`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 必须带 `NEXT_PUBLIC_` 前缀，否则前端 `loadStripe()` 拿不到。

### 本地开发 URL

`.env` 的 `NEXT_PUBLIC_SITE_URL` **必须**是 `http://localhost:3000`，不是生产域名。否则 Stripe Checkout 成功后会重定向到 404。

## 数据库

### Schema 新字段迁移

如果 Prisma schema 有新增字段但数据库没有对应列（报 `PrismaClientKnownRequestError: column does not exist`）：

```bash
npx prisma db push        # 开发环境：直接同步 schema → DB
npx prisma migrate dev ... # 生产环境：生成迁移文件
```

### 订阅相关表

- `Subscription` 表：独立的订阅记录（stripeId, status, plan, period）
- `User.subscription` 字段：冗余存储当前 plan（`"free" | "basic" | "advanced"`），方便快速查询
- `Invoice` 表：付款记录

`upsertSubscription()` 同时更新 `Subscription` 表和 `User.subscription` 字段。

## 支付流程

```
用户点升级 → POST /api/subscription/checkout
  → Stripe Checkout Session（metadata: userId + plan）
  → 支付成功 → webhook checkout.session.completed
  → upsertSubscription(userId, plan, "active")
  → User.subscription 从 "free" → "basic/advanced"
```

**Checkout metadata 是 webhook 和 session 之间的桥梁** — `userId` 和 `plan` 必须在 metadata 中传递。

## 支付方式

开发测试模式只支持 `["card"]`。`alipay` 需要生产环境激活，测试模式会导致 session 创建失败。

**测试卡号**：`4242 4242 4242 4242`，任意未来日期 + CVC。

## Stripe Customer Portal

`POST /api/subscription/portal` 需要先通过 email 查找 customer：

```typescript
const customer = await stripe.customers.list({ email: user.email, limit: 1 });
const session = await stripe.billingPortal.sessions.create({
  customer: customer.data[0]?.id,
  return_url: `${appUrl}/subscription`,
});
```

如果用户从未创建过 Stripe customer（首次订阅前），portal 调用会失败。

## 取消订阅

取消后必须将 `User.subscription` 降级回 `"free"`：

```typescript
await prisma.subscription.update({ where: { userId }, data: { status: "canceled", canceledAt: new Date() } });
await prisma.user.update({ where: { id: userId }, data: { subscription: "free" } });
```

## 文件清单

```
src/lib/stripe.ts                          — Stripe 实例 + 环境变量
src/lib/subscription-service.ts            — DB CRUD
src/app/api/subscription/checkout/route.ts — 创建 Checkout
src/app/api/subscription/webhook/route.ts  — 5 种事件处理器
src/app/api/subscription/status/route.ts   — 查询订阅状态
src/app/api/subscription/portal/route.ts   — Customer Portal
src/app/api/pricing/route.ts               — 套餐定价
src/components/SubscriptionPlans.tsx        — 套餐卡片 UI
src/app/subscription/page.tsx              — 订阅管理页
src/types/index.ts                         — 新增 Sub/Pricing 类型
config/billing-pricing.json                — 定价配置
```

## 给后续 Stream C Agent 的建议

1. **#11（免费版额度）** 需要在 `src/app/api/ai/generate/route.ts` 和 `rewrite/route.ts` 中调用 `getUserSubscription()` 判断 tier，然后调用配额 guard
2. **#12（统一 API Key）** 需要在 `src/lib/api-key-guard.ts` 中新增 `getApiKeyForUser()` — 付费用户返回系统 `OPENROUTER_API_KEY`，免费用户用自有 Key
3. **Stripe 环境变量不是必需的** — `isStripeConfigured()` 返回 false 时 API 返回 503，不影响其他功能
4. 本地测试始终记得先启动 `stripe listen`
