// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library AutomationVRFStorage {
    struct Layout {
        bytes32 keyHash;
        uint64 subscriptionId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.automation.vrf");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
