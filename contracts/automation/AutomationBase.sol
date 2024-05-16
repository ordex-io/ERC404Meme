// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeOwnable} from "@solidstate/contracts/access/ownable/SafeOwnable.sol";
import {AutomationBaseStorage} from "./AutomationBaseStorage.sol";
import {IAutomationBase} from "./IAutomationBase.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

abstract contract AutomationBase is
    IAutomationBase,
    SafeOwnable,
    AutomationCompatibleInterface
{
    /// @param caller_ The address that will be performing the automation calls
    /// @param minPending_ The minimum of NFT waiting to be revealed
    /// @param maxWaiting_ The maximum time to wait before ask for reveal
    function __AutomationBase_Init(
        address caller_,
        uint96 minPending_,
        uint256 maxWaiting_
    ) internal {
        AutomationBaseStorage.layout().automationRegistry = caller_;
        AutomationBaseStorage.layout().minPending = minPending_;
        AutomationBaseStorage.layout().maxWaiting = maxWaiting_;
    }

    /// @param newCaller_ The new address that will be performing the automation calls. Using chainlink, can be forwarder.
    function setCallerAddress(address newCaller_) public onlyOwner {
        AutomationBaseStorage.layout().automationRegistry = newCaller_;
    }

    /// @return The address that can make the automation calls
    function getCallerAddress() public view returns (address) {
        return AutomationBaseStorage.layout().automationRegistry;
    }
}
