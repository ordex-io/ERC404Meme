// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseStorage} from "../../dna/DNABaseStorage.sol";
import {AutomationVRF, VRFParams, AutomationVRFStorage, AutomationBaseStorage} from "../../automation/vrf/AutomationVRF.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title AutomationVRFMock
 * @notice Expose the words and request params saved for the Automation VRF.
 */
contract AutomationVRFMock is AutomationVRF {
    constructor(
        address caller_,
        uint96 minPending_,
        uint128 minWait_,
        uint128 maxWait_,
        VRFParams memory randomParams_
    ) {
        __AutomationVRF_init(
            caller_,
            minPending_,
            minWait_,
            maxWait_,
            randomParams_
        );
    }

    function getWordsByPointer(
        uint256 pointer_
    ) external view returns (uint256[] memory) {
        return DNABaseStorage.layout().wordsByCounter[pointer_];
    }

    function getVrfCoordinator()
        public
        view
        returns (VRFCoordinatorV2Interface)
    {
        return _vrfCoordinator();
    }

    function getAutomationRegistry() public view returns (address) {
        return AutomationBaseStorage.layout().automationRegistry;
    }

    function getKeyHash() public view returns (bytes32) {
        return AutomationVRFStorage.layout().keyHash;
    }

    function getSubscriptionId() public view returns (uint64) {
        return AutomationVRFStorage.layout().subscriptionId;
    }

    function getRequestConfirmations() public view returns (uint16) {
        return AutomationVRFStorage.layout().requestConfirmations;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return AutomationVRFStorage.layout().callbackGasLimit;
    }

    function getNumWords() public view returns (uint32) {
        return AutomationVRFStorage.layout().numWords;
    }

    function increasePendingReveal() external {
        DNABaseStorage.layout().pendingReveals += 1;
    }
}
