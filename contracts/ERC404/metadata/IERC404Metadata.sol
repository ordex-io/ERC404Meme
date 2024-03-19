// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * @dev Interface for the metadata functions from the ERC404.
 */
interface IERC404Metadata {
    /**
     * @dev Returns the name of the token.
     */
    function name() external view returns (string memory);

    /**
     * @dev Returns the symbol of the token.
     */
    function symbol() external view returns (string memory);

    /**
     * @dev Returns the decimals places of the token.
     */
    function decimals() external view returns (uint8);

    /**
     * @dev Return units for ERC-20 representation
     */
    function units() external view returns (uint256);
}