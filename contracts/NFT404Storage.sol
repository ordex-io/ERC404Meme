// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library NFT404Storage {
    struct Layout {
        mapping(uint256 => uint256) countersById;
        uint256 nftRevealCounter;
        address autoRegistry;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.NFT404");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
