// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAutomationBase} from "../IAutomationBase.sol";
import {IVRFConsumerV2} from "./chainlink/IVRFConsumerV2.sol";

struct VRFParams {
    address vrfCoordinator;
    bytes32 keyHash;
    uint64 subscriptionId;
    uint16 requestConfirmations;
    uint32 callbackGasLimit;
    uint32 numWords;
}

interface IAutomationVRF is IAutomationBase, IVRFConsumerV2 {
    function __AutomationVRF_init(
        address caller_,
        uint96 minPending_,
        uint256 maxWaiting_,
        VRFParams memory randomParams_
    ) external;
}
