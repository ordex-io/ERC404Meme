// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { ERC404MetadataStorage } from './ERC404MetadataStorage.sol';

/**
 * @title ERC404Metadata internal functions
 */
abstract contract ERC404MetadataInternal {
    /**
     * @notice return token name
     * @return token name
     */
    function _name() internal view virtual returns (string memory) {
        return ERC404MetadataStorage.layout().name;
    }

    /**
     * @notice return token symbol
     * @return token symbol
     */
    function _symbol() internal view virtual returns (string memory) {
        return ERC404MetadataStorage.layout().symbol;
    }

    /**
     * @notice return token decimals, generally used only for display purposes
     * @return token decimals
     */
    function _decimals() internal view virtual returns (uint8) {
        return ERC404MetadataStorage.layout().decimals;
    }

    /**
     * @notice return units for ERC-20 representation
     * @return units for ERC-20 representation
     */
    function _units() internal view virtual returns (uint256) {
        return ERC404MetadataStorage.layout().units;
    }

    function _setName(string memory name) internal virtual {
        ERC404MetadataStorage.layout().name = name;
    }

    function _setSymbol(string memory symbol) internal virtual {
        ERC404MetadataStorage.layout().symbol = symbol;
    }

    function _setDecimals(uint8 decimals) internal virtual {
        ERC404MetadataStorage.layout().decimals = decimals;
    }

    function _setUnits(uint256 units) internal virtual {
        ERC404MetadataStorage.layout().units = units;
    }
}
