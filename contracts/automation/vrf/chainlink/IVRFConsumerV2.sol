// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IVRFConsumerV2 {


    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external;
}
