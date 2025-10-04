// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {BetterPlay} from "../src/BetterPlay.sol";

contract Deploy is Script {
    function run() external returns (address) {
        vm.startBroadcast();
        BetterPlay betterPlay = new BetterPlay(msg.sender);
        vm.stopBroadcast();
        return address(betterPlay);
    }
}