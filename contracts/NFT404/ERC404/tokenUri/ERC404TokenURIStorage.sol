// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DoubleEndedQueue} from "ERC404/contracts/lib/DoubleEndedQueue.sol";

library ERC404TokenURIStorage {
    struct Layout {
        string baseUri;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.ERC404.TokenURI");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function getBaseUri() internal view returns (string memory) {
        return layout().baseUri;
    }
}
