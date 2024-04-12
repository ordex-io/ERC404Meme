// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseStorage} from "../../dna/DNABaseStorage.sol";
import {AutomationNonVRF} from "../../automation/non-vrf/AutomationNonVRF.sol";

/**
 * @title AutomationNonVRFMock
 * @notice Expose the words saved for the Automation Non-VRF
 */
contract AutomationNonVRFMock is AutomationNonVRF {
    constructor(
        address automationRegistry_
    ) AutomationNonVRF(automationRegistry_) {}

    function getWordsByPointer(
        uint256 pointer_
    ) external view returns (uint256[] memory) {
        return DNABaseStorage.layout().wordsByCounter[pointer_];
    }
}
