# FlashCargo contracts

`src/FlashCargo.sol` is the drop escrow: buyers deposit USDC with
`buySlot()` and get an ERC-721 receipt per slot. The owner can `releaseFunds()`
a drop that reached its target **before its deadline** (100% of that drop's
deposits, in one transfer). After the deadline, or after `cancelDrop()`, each
receipt holder can `claimRefund()` their deposit instead. Release and refund
are mutually exclusive.

There is no partial release, no holdback until delivery, and no
`confirmDelivery()`. `markFulfilled()` and `claimOrder()` are bookkeeping and
move no funds.

## Fixed escrow bugs (October 2026)

Two bugs let a drop be both refunded and released, with the release paid out
of other drops' deposits:

1. `claimRefund()` never decremented the drop's `raisedAmount`, so after every
   buyer refunded, the drop still looked fully funded.
2. `releaseFunds()` had no deadline check, so once the deadline passed both
   paths were open at the same time. Buyers could refund, then the owner could
   release the stale `raisedAmount`, taking it from the contract's balance —
   that is, from other drops.

`claimRefund()` now subtracts the refunded amount, and `releaseFunds()` reverts
with `Deadline passed` from the deadline on. `test/FlashCargo.t.sol` covers
refund-then-release, release-after-deadline, a cancelled drop, and that a
release moves exactly one drop's deposits; the first three fail against the
old source.

### The deployed contracts still have the bugs

Contracts are immutable. The FlashCargo instances in `lib/contracts.ts`
(Base mainnet `0xe6ec66d9b2caf0873bdf1499791c5d6f8a83f956`, Base Sepolia
`0x298930319B3c17e3A83Ed12E338B6d2D58752dFE`) were deployed from the old
source: their runtime bytecode matches it, not this one. Neither has ever had
a drop (`nextDropId()` is 0 on both, checked 2026-10-06). **Do not create
drops on them.** Redeploy from this source (`out/FlashCargo.sol/FlashCargo.json` has
been rebuilt from it, and is what `scripts/deploy-cdp.ts` reads), then update
the addresses in `lib/contracts.ts`.

## Known limitation

Slots bought by the shop's CDP wallet on a buyer's behalf (the Coinbase,
Telegram and x402 rails) mint the receipt to the CDP wallet, because
`buySlot()` mints to `msg.sender`. Refunds for those slots therefore land in
the shop's wallet, not the buyer's.

## Build and test

Foundry, solc 0.8.28 (pinned in `foundry.toml`).

```shell
forge build
forge test
```
