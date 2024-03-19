// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import { ERC404MetadataInternal } from './ERC404MetadataInternal.sol';
import { IERC404Metadata } from './IERC404Metadata.sol';

/**
 * @title ERC404Metadata internal functions
 */
abstract contract ERC404Metadata is IERC404Metadata, ERC404MetadataInternal {
    /**
     * @inheritdoc IERC404Metadata
     */
    function name() external view returns (string memory) {
        return _name();
    }

    /**
     * @inheritdoc IERC404Metadata
     */
    function symbol() external view returns (string memory) {
        return _symbol();
    }

    /**
     * @inheritdoc IERC404Metadata
     */
    function decimals() external view returns (uint8) {
        return _decimals();
    }

    /**
     * @inheritdoc IERC404Metadata
     */
    function units() external view returns (uint256) {
        return _units();
    }
}
