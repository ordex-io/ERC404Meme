// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library ERC404MetadataStorage {
    struct Layout {
        string name;
        string symbol;
        uint8 decimals;
        uint256 units;
        uint256 _INITIAL_CHAIN_ID;
        bytes32 _INITIAL_DOMAIN_SEPARATOR;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.ERC404Metadata");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
