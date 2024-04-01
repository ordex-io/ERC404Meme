// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFConsumerBaseV2Upgradeable, VRFCoordinatorV2Interface} from "./chainlink/VRFConsumerBaseV2Upgradeable.sol";
import {RandomBaseStorage} from "./RandomBaseStorage.sol";

struct RandomInitParams {
    address vrfCoordinator;
    bytes32 keyHash;
    uint64 subscriptionId;
    uint16 requestConfirmations;
    uint32 callbackGasLimit;
    uint32 numWords;
}

abstract contract Random is VRFConsumerBaseV2Upgradeable {
    function getKeyHash() public view returns (bytes32) {
        return RandomBaseStorage.layout().keyHash;
    }

    function getSubscriptionId() public view returns (uint64) {
        return RandomBaseStorage.layout().subscriptionId;
    }

    function getRequestConfirmations() public view returns (uint16) {
        return RandomBaseStorage.layout().requestConfirmations;
    }

    function getCallbackGasLimit() public view returns (uint32) {
        return RandomBaseStorage.layout().callbackGasLimit;
    }

    function getNumWords() public view returns (uint32) {
        return RandomBaseStorage.layout().numWords;
    }

    function getCoordinator() public view returns (VRFCoordinatorV2Interface) {
        return _coordinator();
    }

    // TODO: Some variables should be dynamic, depending on network
    function __RandomBase_init(
        RandomInitParams memory initParams_
    ) internal onlyInitializing {
        __VRFConsumerBaseV2Upgradeable_init(initParams_.vrfCoordinator);

        RandomBaseStorage.layout().keyHash = initParams_.keyHash;
        RandomBaseStorage.layout().subscriptionId = initParams_.subscriptionId;
        RandomBaseStorage.layout().requestConfirmations = initParams_
            .requestConfirmations;
        RandomBaseStorage.layout().callbackGasLimit = initParams_
            .callbackGasLimit;
        RandomBaseStorage.layout().numWords = initParams_.numWords;
    }

    /**
     * The ihnerit contract should store and handle the request ID
     */
    function _requestRandom() internal returns (uint256) {
        return
            _coordinator().requestRandomWords(
                getKeyHash(),
                getSubscriptionId(),
                getRequestConfirmations(),
                getCallbackGasLimit(),
                getNumWords()
            );
    }
}
