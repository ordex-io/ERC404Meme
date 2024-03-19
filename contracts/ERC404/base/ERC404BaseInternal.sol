// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC404BaseStorage} from "./ERC404BaseStorage.sol";

/**
 * @title ERC404Metadata internal functions
 */
abstract contract ERC404MetadataInternal {
    function _totalSupply() internal view virtual returns (uint256) {
        return ERC404BaseStorage.layout().totalSupply;
    }

    function _minted() internal view virtual returns (uint256) {
        return ERC404BaseStorage.layout().minted;
    }

    function _balanceOf(address owner_) internal view returns (uint256) {
        return ERC404BaseStorage.layout().balanceOf[owner_];
    }

    function _allowance(
        address owner_,
        address spender_
    ) internal view returns (uint256) {
        return ERC404BaseStorage.layout().allowance[owner_][spender_];
    }

    function _getApproved(uint256 id_) internal view returns (address) {
        return ERC404BaseStorage.layout().getApproved[id_];
    }

    function _isApprovedForAll(
        address owner_,
        address operator_
    ) internal view returns (bool) {
        return ERC404BaseStorage.layout().isApprovedForAll[owner_][operator_];
    }

    function _nonces(address owner_) internal view returns (uint256) {
        return ERC404BaseStorage.layout().nonces[owner_];
    }

    function _ownedData(uint256 id_) internal view returns (uint256) {
        return ERC404BaseStorage.layout()._ownedData[id_];
    }

    function _owned(address owner_) internal view returns (uint256[] memory) {
        return ERC404BaseStorage.layout()._owned[owner_];
    }

    function _erc721TransferExempt(
        address target_
    ) internal view returns (bool) {
        return ERC404BaseStorage.layout()._erc721TransferExempt[target_];
    }
}
