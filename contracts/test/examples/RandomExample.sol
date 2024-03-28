//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Random} from "../../random/Random.sol";

// Implementer test of the Random facet
contract RandomExample is Random {
    event RandomRequested(uint256 requestId);
    event RandomFulfilled(uint256 requestId, uint256[] randomWords);

    function initialize(
        address vrfCoordinator_,
        bytes32 keyHash_,
        uint64 subscriptionId_,
        uint16 requestConfirmations_,
        uint32 callbackGasLimit_,
        uint32 numWords_
    ) public initializer {
        __RandomBase_init(
            vrfCoordinator_,
            keyHash_,
            subscriptionId_,
            requestConfirmations_,
            callbackGasLimit_,
            numWords_
        );
    }

    function requestRandom() public {
        uint256 requestId = _requestRandom();
        emit RandomRequested(requestId);
    }

    /**
     * Simple child implementation
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        emit RandomFulfilled(requestId, randomWords);
    }
}
