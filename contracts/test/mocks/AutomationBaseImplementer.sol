// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AutomationBase, DNABaseStorage} from "../../automation/AutomationBase.sol";

contract AutomationBaseImplementer is AutomationBase {
    constructor(
        address caller_,
        uint96 minPending_,
        uint128 minWait_,
        uint128 maxWait_
    ) {
        __AutomationBase_Init(caller_, minPending_, minWait_, maxWait_);
        _setOwner(msg.sender);
    }

    function performUpkeep(bytes calldata) external onlyUpKeepCaller {
        emit RevealCalled(0, block.number);
    }

    function setPendingReveals(uint256 value_) public {
        DNABaseStorage.layout().pendingReveals = value_;
    }
}
