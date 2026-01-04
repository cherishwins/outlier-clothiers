// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/FlashCargo.sol";

contract DeployFlashCargo is Script {
    // USDC on Base Mainnet
    address constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    // USDC on Base Sepolia (for testing)
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy to mainnet with mainnet USDC
        // Change to USDC_BASE_SEPOLIA for testnet
        FlashCargo flashCargo = new FlashCargo(USDC_BASE);

        console.log("FlashCargo deployed to:", address(flashCargo));

        vm.stopBroadcast();
    }
}

contract CreateDrop is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address flashCargoAddress = vm.envAddress("FLASH_CARGO_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        FlashCargo flashCargo = FlashCargo(flashCargoAddress);

        // Create Drop #1: Luxury Mix
        // Target: $186,218 = 186218 * 10^6 = 186218000000
        // Duration: 14 days
        // Base slot price: $15 = 15000000
        // Total slots: 10000

        uint256 dropId = flashCargo.createDrop(
            186218000000,  // $186,218 target
            14,             // 14 days
            15000000,       // $15 base price
            10000,          // 10,000 slots
            "ipfs://QmManifestHash"  // Replace with actual manifest IPFS hash
        );

        console.log("Drop created with ID:", dropId);

        vm.stopBroadcast();
    }
}
