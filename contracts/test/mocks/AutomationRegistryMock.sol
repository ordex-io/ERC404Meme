// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAutomationBase} from "../../automation/IAutomationBase.sol";

/**
 * @title AutomationRegistryMock
 * @notice This mock contract is to make easier to simulate a call for an external
 * contract to the reveal function on the contracts. This is just for the sake of
 * simplicity while following the workflow of the reveal proces.
 *
 * NOTE: This mock IS NOT how the real Chainlink Automation Registry works. Please
 * refer to the Chainlink documentation for more information.
 */
contract AutomationRegistryMock {
    function simulateAutoReveal(IAutomationBase automationContract_) public {
        automationContract_.reveal();
    }
}
