// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library AutomationBaseStorage {
    struct Layout {
        address upKeepCaller;
        uint96 minPending;
        uint128 minWait;
        uint128 maxWait;
        uint128 lastCall;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.automation");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
