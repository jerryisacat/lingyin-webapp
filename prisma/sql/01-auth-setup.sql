-- ============================================
-- 玲音日记 — Supabase 初始化 SQL
-- 在 Supabase SQL Editor 中手动执行
-- ============================================

-- 1. 创建 public.User 行触发器 (Prisma ↔ Supabase Auth 同步)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public."User" (id, email) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. 启用 Row Level Security
-- ============================================
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Entry" ENABLE ROW LEVEL SECURITY;

-- 3. User 表 RLS 策略
-- ============================================

-- 用户只能读取自己的行
CREATE POLICY "Users can read own row"
ON public."User"
FOR SELECT
USING (auth.uid() = id);

-- 用户只能更新自己的行
CREATE POLICY "Users can update own row"
ON public."User"
FOR UPDATE
USING (auth.uid() = id);

-- 4. Entry 表 RLS 策略
-- ============================================

-- 用户只能读取自己的日记
CREATE POLICY "Users can read own entries"
ON public."Entry"
FOR SELECT
USING (auth.uid() = "userId");

-- 用户只能插入自己的日记
CREATE POLICY "Users can insert own entries"
ON public."Entry"
FOR INSERT
WITH CHECK (auth.uid() = "userId");

-- 用户只能更新自己的日记
CREATE POLICY "Users can update own entries"
ON public."Entry"
FOR UPDATE
USING (auth.uid() = "userId");

-- 用户只能删除自己的日记
CREATE POLICY "Users can delete own entries"
ON public."Entry"
FOR DELETE
USING (auth.uid() = "userId");
