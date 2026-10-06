// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {FlashCargo} from "../src/FlashCargo.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// Escrow invariants: a drop's buyers can get their money back, or the owner
/// can take it, never both; and releasing one drop never moves another's.
contract FlashCargoTest is Test {
    MockUSDC internal usdc;
    FlashCargo internal cargo;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    uint256 internal constant SLOT = 100e6; // $100
    uint256 internal constant TARGET = 200e6; // two slots

    function setUp() public {
        usdc = new MockUSDC();
        cargo = new FlashCargo(address(usdc)); // this test contract is the owner

        address[2] memory buyers = [alice, bob];
        for (uint256 i = 0; i < buyers.length; i++) {
            usdc.mint(buyers[i], 1_000e6);
            vm.prank(buyers[i]);
            usdc.approve(address(cargo), type(uint256).max);
        }
    }

    function _createDrop() internal returns (uint256) {
        return cargo.createDrop(TARGET, 1, SLOT, 10, "ipfs://manifest");
    }

    function _raised(uint256 dropId) internal view returns (uint256 raised) {
        (, raised,,,,,,) = cargo.getDrop(dropId);
    }

    function test_FirstDropIdIsZero() public {
        assertEq(_createDrop(), 0);
        assertEq(_createDrop(), 1);
    }

    function test_ReleaseBeforeDeadlinePaysExactlyThatDrop() public {
        uint256 a = _createDrop();
        uint256 b = _createDrop();
        vm.prank(alice);
        cargo.buySlot(a, 2);
        vm.prank(bob);
        cargo.buySlot(b, 1);

        uint256 ownerBefore = usdc.balanceOf(address(this));
        cargo.releaseFunds(a);

        assertEq(usdc.balanceOf(address(this)) - ownerBefore, TARGET);
        assertEq(usdc.balanceOf(address(cargo)), SLOT, "drop b's deposit stays in escrow");

        // A released drop is not refundable.
        vm.warp(block.timestamp + 2 days);
        assertFalse(cargo.canClaimRefund(0));
        vm.prank(alice);
        vm.expectRevert(bytes("Refund not available"));
        cargo.claimRefund(0);
    }

    function test_RefundDecrementsRaisedAmount() public {
        uint256 a = _createDrop();
        vm.prank(alice);
        cargo.buySlot(a, 2);
        assertEq(_raised(a), TARGET);

        cargo.cancelDrop(a);
        vm.prank(alice);
        cargo.claimRefund(0);

        assertEq(_raised(a), SLOT);
        assertEq(usdc.balanceOf(address(cargo)), SLOT);
    }

    /// The audited bug: after the deadline the buyers refund, then the owner
    /// releases the drop's stale raisedAmount, paid out of drop b's deposits.
    function test_RefundThenReleaseCannotTakeOtherDropsFunds() public {
        uint256 a = _createDrop();
        uint256 b = _createDrop();
        vm.prank(alice);
        cargo.buySlot(a, 2); // drop a reaches its target
        vm.prank(bob);
        cargo.buySlot(b, 2);

        vm.warp(block.timestamp + 1 days); // deadline passes, nobody released
        vm.startPrank(alice);
        cargo.claimRefund(0);
        cargo.claimRefund(1);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice), 1_000e6, "alice refunded in full");
        assertEq(_raised(a), 0);

        vm.expectRevert();
        cargo.releaseFunds(a);

        assertEq(usdc.balanceOf(address(cargo)), TARGET, "bob's deposit in drop b is untouched");
        assertEq(_raised(b), TARGET);
    }

    /// After the deadline the drop belongs to the refund path, even if it
    /// reached its target: the owner cannot release it.
    function test_ReleaseAfterDeadlineReverts() public {
        uint256 a = _createDrop();
        vm.prank(alice);
        cargo.buySlot(a, 2);

        vm.warp(block.timestamp + 1 days);
        vm.expectRevert(bytes("Deadline passed"));
        cargo.releaseFunds(a);

        // ...and every buyer can still get their money back.
        assertTrue(cargo.canClaimRefund(0));
        vm.startPrank(alice);
        cargo.claimRefund(0);
        cargo.claimRefund(1);
        vm.stopPrank();
        assertEq(usdc.balanceOf(alice), 1_000e6);
        assertEq(usdc.balanceOf(address(cargo)), 0);
    }

    function test_CancelledDropCannotBeReleased() public {
        uint256 a = _createDrop();
        vm.prank(alice);
        cargo.buySlot(a, 2);
        cargo.cancelDrop(a);

        vm.expectRevert(bytes("Not funding"));
        cargo.releaseFunds(a);
    }

    function test_RefundOnlyOnce() public {
        uint256 a = _createDrop();
        vm.prank(alice);
        cargo.buySlot(a, 1);
        cargo.cancelDrop(a);

        vm.startPrank(alice);
        cargo.claimRefund(0);
        vm.expectRevert(bytes("Already refunded"));
        cargo.claimRefund(0);
        vm.stopPrank();
    }
}
