// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library VRFConsumerV2Storage {
    struct Layout {
        address vrfCoordinator;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.VRFConsumerBaseV2");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function vrfCoordinator() internal view returns (address) {
        return layout().vrfCoordinator;
    }
}
