-- DropIndex
DROP INDEX "tenants_name_key";

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "cgst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "sgst_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_charges" DECIMAL(10,2) NOT NULL DEFAULT 0;
