// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlashCargo
 * @notice Escrow contract for Flash DAO liquidation crowdfunding
 * @dev Accepts USDC deposits, mints NFT receipts, handles auto-refunds
 *
 * Flow:
 * 1. Admin creates a drop with funding target and deadline
 * 2. Users buy slots (deposit USDC, receive NFT receipt)
 * 3. If target reached: Admin releases funds, NFTs become claim tickets
 * 4. If target NOT reached by deadline: Users can claim full refund
 */
contract FlashCargo is ERC721, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // USDC on Base mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    IERC20 public immutable usdc;

    // Drop status
    enum DropStatus { FUNDING, FUNDED, CANCELLED, FULFILLED }

    struct Drop {
        uint256 targetAmount;      // USDC target (6 decimals)
        uint256 raisedAmount;      // Current raised
        uint256 deadline;          // Funding deadline timestamp
        uint256 slotPrice;         // Price per slot
        uint256 totalSlots;        // Max slots available
        uint256 slotsSold;         // Slots sold
        DropStatus status;
        string manifestUri;        // IPFS/Arweave link to manifest
    }

    struct Slot {
        uint256 dropId;
        uint256 amount;            // USDC paid
        bool refunded;
        bool claimed;
    }

    // State
    uint256 public nextDropId;
    uint256 public nextTokenId;

    mapping(uint256 => Drop) public drops;
    mapping(uint256 => Slot) public slots;  // tokenId => Slot
    mapping(uint256 => uint256[]) public dropTokens;  // dropId => tokenIds

    // Tiered pricing (first X slots at base price, next at +30%, rest at +60%)
    uint256 public constant TIER1_SLOTS = 500;
    uint256 public constant TIER2_SLOTS = 300;
    uint256 public constant TIER1_MULTIPLIER = 100;  // 100% = base price
    uint256 public constant TIER2_MULTIPLIER = 130;  // 130% = +30%
    uint256 public constant TIER3_MULTIPLIER = 160;  // 160% = +60%

    // Events
    event DropCreated(uint256 indexed dropId, uint256 targetAmount, uint256 deadline, string manifestUri);
    event SlotPurchased(uint256 indexed dropId, uint256 indexed tokenId, address buyer, uint256 amount);
    event DropFunded(uint256 indexed dropId, uint256 totalRaised);
    event DropCancelled(uint256 indexed dropId);
    event FundsReleased(uint256 indexed dropId, uint256 amount);
    event Refunded(uint256 indexed tokenId, address buyer, uint256 amount);
    event OrderClaimed(uint256 indexed tokenId, address claimer);

    constructor(address _usdc) ERC721("Outlier Clothiers Receipt", "OCR") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @notice Create a new drop/crowdfund
     * @param targetAmount USDC target (6 decimals, e.g., 186218000000 = $186,218)
     * @param durationDays Days until deadline
     * @param baseSlotPrice Base price per slot in USDC (6 decimals)
     * @param totalSlots Total available slots
     * @param manifestUri Link to manifest file
     */
    function createDrop(
        uint256 targetAmount,
        uint256 durationDays,
        uint256 baseSlotPrice,
        uint256 totalSlots,
        string calldata manifestUri
    ) external onlyOwner returns (uint256 dropId) {
        dropId = nextDropId++;

        drops[dropId] = Drop({
            targetAmount: targetAmount,
            raisedAmount: 0,
            deadline: block.timestamp + (durationDays * 1 days),
            slotPrice: baseSlotPrice,
            totalSlots: totalSlots,
            slotsSold: 0,
            status: DropStatus.FUNDING,
            manifestUri: manifestUri
        });

        emit DropCreated(dropId, targetAmount, drops[dropId].deadline, manifestUri);
    }

    /**
     * @notice Release funds after successful funding
     */
    function releaseFunds(uint256 dropId) external onlyOwner nonReentrant {
        Drop storage drop = drops[dropId];
        require(drop.status == DropStatus.FUNDING, "Not funding");
        require(drop.raisedAmount >= drop.targetAmount, "Target not reached");

        drop.status = DropStatus.FUNDED;

        uint256 amount = drop.raisedAmount;
        usdc.safeTransfer(owner(), amount);

        emit FundsReleased(dropId, amount);
        emit DropFunded(dropId, amount);
    }

    /**
     * @notice Mark drop as fulfilled (orders shipped)
     */
    function markFulfilled(uint256 dropId) external onlyOwner {
        require(drops[dropId].status == DropStatus.FUNDED, "Not funded");
        drops[dropId].status = DropStatus.FULFILLED;
    }

    /**
     * @notice Cancel a drop (enables refunds)
     */
    function cancelDrop(uint256 dropId) external onlyOwner {
        Drop storage drop = drops[dropId];
        require(drop.status == DropStatus.FUNDING, "Not funding");
        drop.status = DropStatus.CANCELLED;
        emit DropCancelled(dropId);
    }

    // ============ USER FUNCTIONS ============

    /**
     * @notice Buy a slot in a drop
     * @param dropId The drop to participate in
     * @param quantity Number of slots to buy
     */
    function buySlot(uint256 dropId, uint256 quantity) external nonReentrant {
        Drop storage drop = drops[dropId];
        require(drop.status == DropStatus.FUNDING, "Not funding");
        require(block.timestamp < drop.deadline, "Deadline passed");
        require(drop.slotsSold + quantity <= drop.totalSlots, "Not enough slots");

        uint256 totalCost = 0;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 slotNumber = drop.slotsSold + i;
            uint256 slotCost = getSlotPrice(drop.slotPrice, slotNumber);
            totalCost += slotCost;

            uint256 tokenId = nextTokenId++;
            _mint(msg.sender, tokenId);

            slots[tokenId] = Slot({
                dropId: dropId,
                amount: slotCost,
                refunded: false,
                claimed: false
            });

            dropTokens[dropId].push(tokenId);

            emit SlotPurchased(dropId, tokenId, msg.sender, slotCost);
        }

        drop.slotsSold += quantity;
        drop.raisedAmount += totalCost;

        usdc.safeTransferFrom(msg.sender, address(this), totalCost);
    }

    /**
     * @notice Claim refund for a cancelled/expired drop
     */
    function claimRefund(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");

        Slot storage slot = slots[tokenId];
        require(!slot.refunded, "Already refunded");

        Drop storage drop = drops[slot.dropId];
        bool canRefund = drop.status == DropStatus.CANCELLED ||
            (drop.status == DropStatus.FUNDING && block.timestamp >= drop.deadline);
        require(canRefund, "Refund not available");

        slot.refunded = true;
        usdc.safeTransfer(msg.sender, slot.amount);

        emit Refunded(tokenId, msg.sender, slot.amount);
    }

    /**
     * @notice Mark order as claimed (burn NFT)
     */
    function claimOrder(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");

        Slot storage slot = slots[tokenId];
        require(!slot.claimed, "Already claimed");
        require(drops[slot.dropId].status == DropStatus.FULFILLED, "Not fulfilled");

        slot.claimed = true;
        _burn(tokenId);

        emit OrderClaimed(tokenId, msg.sender);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @notice Calculate slot price based on tier
     */
    function getSlotPrice(uint256 basePrice, uint256 slotNumber) public pure returns (uint256) {
        if (slotNumber < TIER1_SLOTS) {
            return (basePrice * TIER1_MULTIPLIER) / 100;
        } else if (slotNumber < TIER1_SLOTS + TIER2_SLOTS) {
            return (basePrice * TIER2_MULTIPLIER) / 100;
        } else {
            return (basePrice * TIER3_MULTIPLIER) / 100;
        }
    }

    /**
     * @notice Get current price for next slot in a drop
     */
    function getCurrentSlotPrice(uint256 dropId) external view returns (uint256) {
        Drop storage drop = drops[dropId];
        return getSlotPrice(drop.slotPrice, drop.slotsSold);
    }

    /**
     * @notice Get drop details
     */
    function getDrop(uint256 dropId) external view returns (
        uint256 targetAmount,
        uint256 raisedAmount,
        uint256 deadline,
        uint256 slotPrice,
        uint256 totalSlots,
        uint256 slotsSold,
        DropStatus status,
        string memory manifestUri
    ) {
        Drop storage drop = drops[dropId];
        return (
            drop.targetAmount,
            drop.raisedAmount,
            drop.deadline,
            drop.slotPrice,
            drop.totalSlots,
            drop.slotsSold,
            drop.status,
            drop.manifestUri
        );
    }

    /**
     * @notice Get tokens for a drop
     */
    function getDropTokens(uint256 dropId) external view returns (uint256[] memory) {
        return dropTokens[dropId];
    }

    /**
     * @notice Check if user can claim refund
     */
    function canClaimRefund(uint256 tokenId) external view returns (bool) {
        Slot storage slot = slots[tokenId];
        if (slot.refunded) return false;

        Drop storage drop = drops[slot.dropId];
        return drop.status == DropStatus.CANCELLED ||
            (drop.status == DropStatus.FUNDING && block.timestamp >= drop.deadline);
    }

    /**
     * @notice Get funding progress percentage
     */
    function getFundingProgress(uint256 dropId) external view returns (uint256) {
        Drop storage drop = drops[dropId];
        if (drop.targetAmount == 0) return 0;
        return (drop.raisedAmount * 100) / drop.targetAmount;
    }
}
