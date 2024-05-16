// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeOwnable} from "@solidstate/contracts/access/ownable/SafeOwnable.sol";
import {AutomationBaseStorage} from "./AutomationBaseStorage.sol";
import {IAutomationBase} from "./IAutomationBase.sol";
import {AutomationCompatible} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

abstract contract AutomationBase is
    IAutomationBase,
    SafeOwnable,
    AutomationCompatible
{
    /// @param caller_ The address that will be performing the automation calls
    /// @param minPending_ The minimum of NFT waiting to be revealed
    /// @param minWait_ The minimum time to wait before reveal
    /// @param maxWait_ The maximum time to wait before ask for reveal
    function __AutomationBase_Init(
        address caller_,
        uint96 minPending_,
        uint128 minWait_,
        uint128 maxWait_
    ) internal {
        AutomationBaseStorage.layout().automationRegistry = caller_;
        AutomationBaseStorage.layout().minPending = minPending_;
        AutomationBaseStorage.layout().minWait = minWait_;
        AutomationBaseStorage.layout().maxWait = maxWait_;
        AutomationBaseStorage.layout().lastCall = uint128(block.timestamp);
    }

    function checkUpkeep(
        bytes calldata
    )
        external
        view
        cannotExecute
        returns (bool upkeepNeeded, bytes memory performData)
    {
        AutomationBaseStorage.Layout memory l = AutomationBaseStorage.layout();

        if (block.timestamp <= l.lastCall + l.maxWait) {
            // 
        }

        // If maxWait_ is reached and have atleast 1 NFT on pending list, then skip all the conditions and return true
        // If minPending_ and minWait_ are reached, then return true

        // If minPending_ is ok, and minWait_ is ok, then true
        // If minPending_ is NOT ok, and maxWait_ is reach, then true
        //
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
