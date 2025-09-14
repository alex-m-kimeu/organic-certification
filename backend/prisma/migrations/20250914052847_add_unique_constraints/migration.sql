/*
  Warnings:

  - A unique constraint covering the columns `[farmerId,farmName]` on the table `farms` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[farmId,name]` on the table `fields` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "farms_farmerId_farmName_key" ON "public"."farms"("farmerId", "farmName");

-- CreateIndex
CREATE UNIQUE INDEX "fields_farmId_name_key" ON "public"."fields"("farmId", "name");
