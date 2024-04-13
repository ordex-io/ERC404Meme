// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAutomationBase} from "../IAutomationBase.sol";

interface IAutomationNonVRF is IAutomationBase {
    function __AutomationNonVRF_init(address automationRegistry_) external;
}
