-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "idNo" TEXT;
ALTER TABLE "Employee" ADD COLUMN "password" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_idNo_key" ON "Employee"("idNo");
