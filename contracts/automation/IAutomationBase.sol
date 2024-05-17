// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

interface IAutomationBase is AutomationCompatibleInterface {
    error NoAutomationRegister();

    event RevealCalled(uint256 requestId, uint256 block);

    event NftsRevealed(
        uint256 requestId,
        uint256 nftRevealCounter,
        uint256 block
    );

    function setCallerAddress(address newCaller_) external;

    function getCallerAddress() external view returns (address);
}
