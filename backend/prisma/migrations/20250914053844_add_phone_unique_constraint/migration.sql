/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `farmers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "farmers_phone_key" ON "public"."farmers"("phone");
