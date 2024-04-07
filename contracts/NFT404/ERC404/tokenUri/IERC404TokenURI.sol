// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev ERC404TokenURI interface
 */
interface IERC404TokenURI {
    /**
     * @notice get generated URI for given token. tokenURI must be implemented by child contract
     * @return token URI
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);
}
