// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {USDC} from "../src/USDC.sol";

contract DeployUSDC is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        USDC usdc = new USDC("USD Coin", "USDC", 1000000, msg.sender);
        vm.stopBroadcast();
        return address(usdc);
    }
}