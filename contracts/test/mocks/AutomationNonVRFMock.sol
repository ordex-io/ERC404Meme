// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseStorage} from "../../dna/DNABaseStorage.sol";
import {AutomationNonVRF} from "../../automation/non-vrf/AutomationNonVRF.sol";

/**
 * @title AutomationNonVRFMock
 * @notice Expose the words saved for the Automation Non-VRF
 */
contract AutomationNonVRFMock is AutomationNonVRF {
    function getWordsByPointer(
        uint256 pointer_
    ) external view returns (uint256[] memory) {
        return DNABaseStorage.layout().wordsByCounter[pointer_];
    }

    function mock_reveal() external {
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
