// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAutomationBase {
    event RevealCalled(uint256 requestId, uint256 block);

    event NftsRevealed(
        uint256 requestId,
        uint256 nftRevealCounter,
        uint256 block
    );

    function reveal() external;
}
