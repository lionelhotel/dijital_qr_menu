-- Add intro media controls for the public menu welcome screen.
ALTER TABLE "BusinessSetting"
ADD COLUMN IF NOT EXISTS "introMediaUrl" TEXT,
ADD COLUMN IF NOT EXISTS "introMediaKind" TEXT DEFAULT 'IMAGE';

-- Extend media kind enum so locally uploaded videos can be stored in the media library.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'VIDEO'
      AND enumtypid = '"MediaKind"'::regtype
  ) THEN
    ALTER TYPE "MediaKind" ADD VALUE 'VIDEO';
  END IF;
END $$;
