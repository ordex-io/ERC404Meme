// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library DNABaseStorage {
    struct Layout {
        mapping(uint256 => uint256[]) wordsByCounter;
        bytes32 schema_hash;
        // Variants counts for each part (0 = background, 1 = head, etc)
        string[] variant_name;
        uint256[] variant_count;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.DNABase");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
