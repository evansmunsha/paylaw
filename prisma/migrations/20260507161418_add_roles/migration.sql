-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'admin',
ADD COLUMN     "site" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
