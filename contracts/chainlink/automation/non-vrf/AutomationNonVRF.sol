// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationBaseStorage} from "../AutomationBaseStorage.sol";
import {IAutomationBase} from "../IAutomationBase.sol";
import {DNABaseStorage} from "../../../dna/DNABaseStorage.sol";

contract AutomationNonVRF is IAutomationBase {
    error NoAutomationRegister();
    event NftsRevealed(uint256 nftRevealCounter, uint256 time);

    constructor(address automationRegistry_) {
        AutomationBaseStorage.layout().automationRegistry = automationRegistry_;
    }

    function reveal() external {
        // This prevent calls for others than the registry
        if (msg.sender != AutomationBaseStorage.layout().automationRegistry) {
            revert NoAutomationRegister();
        }

        uint256[] memory words = new uint256[](1);
        words[0] = uint256(blockhash(block.number - 1));

        // Save the words on DNA storage AND get the counter ID about where are
        // stored on the DNA mapping
        uint256 counterID = DNABaseStorage.saveWords(words);

        emit NftsRevealed(counterID, block.timestamp);
    }
}
