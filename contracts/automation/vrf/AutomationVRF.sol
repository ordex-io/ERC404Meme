// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationBaseStorage} from "../AutomationBaseStorage.sol";
import {AutomationBase} from "../AutomationBase.sol";
import {DNABaseStorage} from "../../dna/DNABaseStorage.sol";
import {VRFConsumerV2} from "./chainlink/VRFConsumerV2.sol";
import {AutomationVRFStorage} from "./AutomationVRFStorage.sol";
import {IAutomationVRF, VRFParams} from "./IAutomationVRF.sol";

contract AutomationVRF is AutomationBase, IAutomationVRF, VRFConsumerV2 {
    function __AutomationVRF_init(
        address automationRegistry_,
        VRFParams memory randomParams_
    )
        public
        reinitializer(4) // reinitializer using 4 (4th contract calling his init)
    {
        // Init the VRF (this function already have the initializer, so it would fail the whole tx)
        __VRFConsumerV2_init(randomParams_.vrfCoordinator);

        // Automation Registry for calls
        __AutomationBase_Init(automationRegistry_);

        // VRF params for VRF request calls
        AutomationVRFStorage.layout().keyHash = randomParams_.keyHash;

        AutomationVRFStorage.layout().subscriptionId = randomParams_
            .subscriptionId;

        AutomationVRFStorage.layout().requestConfirmations = randomParams_
            .requestConfirmations;

        AutomationVRFStorage.layout().callbackGasLimit = randomParams_
            .callbackGasLimit;

        AutomationVRFStorage.layout().numWords = randomParams_.numWords;
    }

    function reveal() external override {
        AutomationBaseStorage.onlyAutoRegistry();

        // Check if waiting
        DNABaseStorage.checkWaiting();

        AutomationVRFStorage.Layout memory l = AutomationVRFStorage.layout();

        uint256 requestId = _vrfCoordinator().requestRandomWords(
            l.keyHash,
            l.subscriptionId,
            l.requestConfirmations,
            l.callbackGasLimit,
            l.numWords
        );

        emit RevealCalled(requestId, block.number);
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        // Save the words on DNA storage AND get the counter ID about where are
        // stored on the DNA mapping
        uint256 counterId = DNABaseStorage.saveWords(randomWords);
        emit NftsRevealed(requestId, counterId, block.number);
    }
}
