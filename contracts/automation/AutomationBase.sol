// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeOwnable} from "@solidstate/contracts/access/ownable/SafeOwnable.sol";
import {AutomationBaseStorage} from "./AutomationBaseStorage.sol";
import {IAutomationBase} from "./IAutomationBase.sol";

abstract contract AutomationBase is IAutomationBase, SafeOwnable {
    /// @param caller_ The address that will be performing the automation calls
    function __AutomationBase_Init(address caller_) internal {
        AutomationBaseStorage.layout().automationRegistry = caller_;
    }

    /// @param newCaller_ The new address that will be performing the automation calls
    function setCallerAddress(address newCaller_) public onlyOwner {
        AutomationBaseStorage.layout().automationRegistry = newCaller_;
    }

    /// @return The address that can make the automation calls
    function getCallerAddress() public view returns (address) {
        return AutomationBaseStorage.layout().automationRegistry;
    }
}
