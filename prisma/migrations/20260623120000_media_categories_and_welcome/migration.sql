ALTER TABLE "BusinessSetting" ADD COLUMN "welcomeText" JSONB;
ALTER TABLE "BusinessSetting" ADD COLUMN "welcomeSubText" JSONB;

CREATE TABLE "MediaCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MediaCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MediaCategory_slug_key" ON "MediaCategory"("slug");

ALTER TABLE "Media" ADD COLUMN "categoryId" TEXT;
CREATE INDEX "Media_categoryId_idx" ON "Media"("categoryId");

ALTER TABLE "Media" ADD CONSTRAINT "Media_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "MediaCategory"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
