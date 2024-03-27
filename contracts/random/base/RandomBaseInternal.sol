// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFConsumerBaseV2Upgradeable} from "../chainlink/VRFConsumerBaseV2Upgradeable.sol";
import {RandomBaseStorage} from "./RandomBaseStorage.sol";

abstract contract RandomBaseInternal is VRFConsumerBaseV2Upgradeable {
    function __RandomBase_init(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit,
        uint32 _numWords
    ) internal onlyInitializing {
        __VRFConsumerBaseV2Upgradeable_init(_vrfCoordinator);

        RandomBaseStorage.layout().keyHash = _keyHash;
        RandomBaseStorage.layout().subscriptionId = _subscriptionId;
        RandomBaseStorage.layout().requestConfirmations = _requestConfirmations;
        RandomBaseStorage.layout().callbackGasLimit = _callbackGasLimit;
        RandomBaseStorage.layout().numWords = _numWords;
    }

    function _getKeyHash() internal view returns (bytes32) {
        return RandomBaseStorage.layout().keyHash;
    }

    function _getSubscriptionId() internal view returns (uint64) {
        return RandomBaseStorage.layout().subscriptionId;
    }

    function _getRequestConfirmations() internal view returns (uint16) {
        return RandomBaseStorage.layout().requestConfirmations;
    }

    function _getCallbackGasLimit() internal view returns (uint32) {
        return RandomBaseStorage.layout().callbackGasLimit;
    }

    function _getNumWords() internal view returns (uint32) {
        return RandomBaseStorage.layout().numWords;
    }



    /**
     * The ihnerit contract should store and handle the request ID
     */
    function _requestRandom() internal returns (uint256) {
        return
            _coordinator().requestRandomWords(
                _getKeyHash(),
                _getSubscriptionId(),
                _getRequestConfirmations(),
                _getCallbackGasLimit(),
                _getNumWords()
            );
    }
}
