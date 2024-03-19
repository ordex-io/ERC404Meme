// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev ERC404 base interface
 */
interface IERC404Base {
    /**
     * @dev Returns the total supply in ERC-20 representation
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the total supply in ERC-20 representation
     */
    function erc20TotalSupply() external view returns (uint256);

    /**
     * @dev Returns the total supply in ERC-721 representation
     */
    function erc721TotalSupply() external view returns (uint256);

    /**
     * @dev Returns the Balance of user in ERC-20 representation
     */
    function balanceOf(address owner_) external view returns (uint256);

    /**
     * @dev Returns the Balance of user in ERC-20 representation
     */
    function erc20BalanceOf(address owner_) external view returns (uint256);

    /**
     * @dev Returns the Balance of user in ERC-721 representation
     */
    function erc721BalanceOf(address owner_) external view returns (uint256);

    /**
     * @dev Function to check if address is transfer exempt
     */
    function erc721TransferExempt(address account_) external view returns (bool);

    /**
     * @dev Approval for all in ERC-721 representation
     */
    function isApprovedForAll(
        address owner_,
        address operator_
    ) external view returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     */
    function allowance(
        address owner_,
        address spender_
    ) external view returns (uint256);


    /**
     * @dev Function to get the owned ids in ERC-721 representation
     */
    function owned(address owner_) external view returns (uint256[] memory);

    /**
     * @dev Function to find owner of a given ERC-721 token
     */
    function ownerOf(uint256 id_) external view returns (address erc721Owner);

  
    /**
     * @notice Function for token approvals
     * @dev This function assumes the operator is attempting to approve
     * an ERC-721 if valueOrId_ is a possibly valid ERC-721 token id.
     * Unlike setApprovalForAll, spender_ must be allowed to be 0x0 so
     * that approval can be revoked.
     */
    function approve(
        address spender_,
        uint256 valueOrId_
    ) external returns (bool);

    function erc20Approve(
        address spender_,
        uint256 value_
    ) external returns (bool);

    function erc721Approve(address spender_, uint256 id_) external;

    function setApprovalForAll(address operator_, bool approved_) external;
}