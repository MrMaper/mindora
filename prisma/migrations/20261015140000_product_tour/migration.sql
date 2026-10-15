-- Product section tour (separate from first-run onboarding / first capture).
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "productTourCompletedAt" TIMESTAMP(3);
