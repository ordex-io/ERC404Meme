// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@solidstate/contracts/access/ownable/Ownable.sol";
import {AutomationBaseStorage} from "../AutomationBaseStorage.sol";
import {IAutomationBase} from "../IAutomationBase.sol";
import {DNABaseStorage} from "../../../dna/DNABaseStorage.sol";
import {VRFConsumerV2} from "../../vrf/VRFConsumerV2.sol";
import {AutomationVRFStorage} from "./AutomationVRFStorage.sol";

struct VRFParams {
    address vrfCoordinator;
    bytes32 keyHash;
    uint64 subscriptionId;
    uint16 requestConfirmations;
    uint32 callbackGasLimit;
    uint32 numWords;
}

contract AutomationVRF is IAutomationBase, VRFConsumerV2, Ownable {
    error NoAutomationRegister();
    event NftsRevealed(uint256 nftRevealCounter, uint256 time);

    constructor(
        address automationRegistry_,
        VRFParams memory randomParams_
    ) VRFConsumerV2(randomParams_.vrfCoordinator) {
        // Automation Registry for calls
        AutomationBaseStorage.layout().automationRegistry = automationRegistry_;

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

    function reveal() external {
        // This prevent calls for others than the registry
        if (msg.sender != AutomationBaseStorage.layout().automationRegistry) {
            revert NoAutomationRegister();
        }

        AutomationVRFStorage.Layout memory l = AutomationVRFStorage.layout();

        // uint256 requestId = _vrfCoordinator().requestRandomWords(
        _vrfCoordinator().requestRandomWords(
            l.keyHash,
            l.subscriptionId,
            l.requestConfirmations,
            l.callbackGasLimit,
            l.numWords
        );
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        // // This prevent calls for others than the registry
        // if (msg.sender != AutomationStorage.layout().automationRegistry) {
        //     revert NoAutomationRegister();
        // }
        // uint256[] memory words = new uint256[](1);
        // words[0] = uint256(blockhash(block.number - 1));
        // // Save the words on DNA storage AND get the counter ID about where are
        // // stored on the DNA mapping
        // uint256 counterID = DNABaseStorage.saveWords(words);
        // emit NftsRevealed(counterID, block.timestamp);
    }
}
