/*
  Warnings:

  - You are about to drop the column `line3` on the `Address` table. All the data in the column will be lost.
  - Added the required column `country` to the `Address` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Address" DROP COLUMN "line3",
ADD COLUMN     "country" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "depth" DOUBLE PRECISION,
ADD COLUMN     "diameter" DOUBLE PRECISION,
ADD COLUMN     "height" DOUBLE PRECISION,
ADD COLUMN     "weight" DOUBLE PRECISION,
ADD COLUMN     "width" DOUBLE PRECISION;
