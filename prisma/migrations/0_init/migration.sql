-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Drop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_url" TEXT,
    "pallet_cost" DOUBLE PRECISION NOT NULL,
    "box_price" DOUBLE PRECISION NOT NULL,
    "boxes_needed" INTEGER NOT NULL,
    "boxes_sold" INTEGER NOT NULL DEFAULT 0,
    "funding_deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'funding',
    "manifest" JSONB NOT NULL,
    "images" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "contract_address" TEXT,

    CONSTRAINT "Drop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "drop_id" TEXT NOT NULL,
    "customer_wallet" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_name" TEXT,
    "shipping_address" JSONB NOT NULL,
    "shipping_cost" DOUBLE PRECISION NOT NULL,
    "tracking_number" TEXT,
    "shipping_label_url" TEXT,
    "carrier" TEXT,
    "payment_method" TEXT NOT NULL,
    "payment_amount" DOUBLE PRECISION NOT NULL,
    "payment_currency" TEXT NOT NULL,
    "payment_tx_hash" TEXT,
    "receipt_nft_id" TEXT,
    "receipt_nft_tx" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "customer_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pallet" (
    "id" TEXT NOT NULL,
    "viatrading_id" TEXT,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_url" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "manifest" JSONB NOT NULL,
    "condition_grade" TEXT NOT NULL,
    "units" INTEGER NOT NULL,
    "retail_value_min" DOUBLE PRECISION NOT NULL,
    "retail_value_max" DOUBLE PRECISION NOT NULL,
    "photos" TEXT[],
    "inspection_video" TEXT,
    "status" TEXT NOT NULL DEFAULT 'listed',
    "purchased_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "wallet_address" TEXT NOT NULL,
    "telegram_id" TEXT,
    "email" TEXT,
    "membership_tier" TEXT NOT NULL DEFAULT 'public',
    "referral_code" TEXT NOT NULL,
    "referred_by" TEXT,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "X402Payment" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "payer" TEXT NOT NULL,
    "pay_to" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "drop_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount_units" BIGINT NOT NULL,
    "authorization" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'authorized',
    "tx_hash" TEXT,
    "order_id" TEXT,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "X402Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_drop_id_idx" ON "Order"("drop_id");

-- CreateIndex
CREATE INDEX "Order_customer_wallet_idx" ON "Order"("customer_wallet");

-- CreateIndex
CREATE INDEX "Order_tracking_number_idx" ON "Order"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_wallet_address_key" ON "User"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegram_id_key" ON "User"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_referral_code_key" ON "User"("referral_code");

-- CreateIndex
CREATE INDEX "User_referral_code_idx" ON "User"("referral_code");

-- CreateIndex
CREATE UNIQUE INDEX "X402Payment_nonce_key" ON "X402Payment"("nonce");

-- CreateIndex
CREATE INDEX "X402Payment_status_idx" ON "X402Payment"("status");

-- CreateIndex
CREATE INDEX "X402Payment_drop_id_idx" ON "X402Payment"("drop_id");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_drop_id_fkey" FOREIGN KEY ("drop_id") REFERENCES "Drop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

