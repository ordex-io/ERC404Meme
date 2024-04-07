// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationBaseStorage} from "../AutomationBaseStorage.sol";
import {IAutomationBase} from "../IAutomationBase.sol";
import {DNABaseStorage} from "../../../dna/DNABaseStorage.sol";

contract AutomationNonVRF is IAutomationBase {
    constructor(address automationRegistry_) {
        AutomationBaseStorage.layout().automationRegistry = automationRegistry_;
    }

    function reveal() external {
        AutomationBaseStorage.onlyAutoRegistry();

        uint256[] memory words = new uint256[](1);
        words[0] = uint256(blockhash(block.number - 1));

        // Save the words on DNA storage AND get the counter ID about where are
        // stored on the DNA mapping
        uint256 counterID = DNABaseStorage.saveWords(words);

        // Using 0 as request Id since it's a NON VRF call.
        emit RevealCalled(0, block.number);
        emit NftsRevealed(0, counterID, block.number);
    }
}
