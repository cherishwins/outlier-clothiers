/**
 * Order statuses written by settleOrder. `paid` means the money reached the
 * escrow contract (a buySlot() for this order was confirmed on chain).
 * `paid_unescrowed` means the payment was received but no buySlot() was
 * confirmed: as far as the server knows the money is in the shop's wallet,
 * outside escrow, and the operator has to reconcile it (check the chain, retry
 * the slot, or refund). The admin dashboard lists these on their own.
 * Order.status is a plain String column, so no migration is involved.
 */
export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  PAID_UNESCROWED: "paid_unescrowed",
} as const
