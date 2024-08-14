// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DoubleEndedQueue} from "ERC404/contracts/lib/DoubleEndedQueue.sol";

library ERC404Storage {
    struct Layout {
        // Public access
        string name;
        string symbol;
        uint8 decimals;
        uint256 units;
        uint256 totalSupply;
        uint256 minted;
        string baseUri;
        mapping(address => uint256) balanceOf;
        mapping(address => mapping(address => uint256)) allowance;
        mapping(uint256 => address) getApproved;
        mapping(address => mapping(address => bool)) isApprovedForAll;
        mapping(address => uint256) nonces;
        mapping(uint256 => uint256) _ownedData;
        mapping(address => uint256[]) _owned;
        mapping(address => bool) _erc721TransferExempt;
        mapping(address => bool) _especialExempt;
        // Private
        mapping(address => DoubleEndedQueue.Uint256Deque) _personalVault;
        uint256 _INITIAL_CHAIN_ID;
        bytes32 _INITIAL_DOMAIN_SEPARATOR;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.ERC404");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function getInitChainId() internal view returns (uint256) {
        return layout()._INITIAL_CHAIN_ID;
    }

    function getInitDomainSeparator() internal view returns (bytes32) {
        return layout()._INITIAL_DOMAIN_SEPARATOR;
    }

    function getBaseUri() internal view returns (string memory) {
        return layout().baseUri;
    }

    function setBaseUri(string memory baseUri_) internal {
        layout().baseUri = baseUri_;
    }
}
