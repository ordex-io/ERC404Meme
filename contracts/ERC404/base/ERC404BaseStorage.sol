// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DoubleEndedQueue} from "ERC404/contracts/lib/DoubleEndedQueue.sol";

library ERC404BaseStorage {
    struct Layout {
        // TODO: Make as Public access
        uint256 totalSupply;
        // TODO: Make as Public access
        uint256 minted;
        // TODO: Make as Public access
        mapping(address => uint256) balanceOf;
        // TODO: Make as Public access
        mapping(address => mapping(address => uint256)) allowance;
        // TODO: Make as Public access
        mapping(uint256 => address) getApproved;
        // TODO: Make as Public access
        mapping(address => mapping(address => bool)) isApprovedForAll;
        // TODO: Make as Public access
        mapping(address => uint256) nonces;
        // TODO: Make as Internal access
        mapping(uint256 => uint256) _ownedData;
        // TODO: Make as Internal access
        mapping(address => uint256[]) _owned;
        // TODO: Make as Internal access
        mapping(address => bool) _erc721TransferExempt;
        // Private
        DoubleEndedQueue.Uint256Deque _storedERC721Ids;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.ERC404Base");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}
