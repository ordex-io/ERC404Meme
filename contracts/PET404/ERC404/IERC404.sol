// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IUniswapPoolChecker} from "../UniswapPoolChecker/IUniswapPoolChecker.sol";

/**
 * @dev ERC404 interface
 */
interface IERC404 is IUniswapPoolChecker {
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

    /**
     * @notice get generated URI for given token. tokenURI must be implemented by child contract
     * @return token URI
     */
    function tokenURI(uint256 tokenId) external view returns (string memory);

    /**
     * @dev Returns the total supply in ERC-20 representation
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Current mint counter which also represents the highest minted id, monotonically
     * increasing to ensure accurate ownership
     */
    function minted() external view returns (uint256);

    /**
     * @dev Approval in ERC-721 representaion
     */
    function getApproved(uint256 id_) external view returns (address);

    /**
     * @dev EIP-2612 nonces
     */
    function nonces(address owner_) external view returns (uint256);

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
    function erc721TransferExempt(address target_) external view returns (bool);

    /**
     * @dev Length of the queue of ERC-721 tokens stored in the contract
     */
    function getERC721QueueLength(
        address owner_
    ) external view returns (uint256);

    function getERC721TokensInQueue(
        uint256 start_,
        uint256 count_,
        address owner_
    ) external view returns (uint256[] memory);

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
    // slither-disable-next-line erc721-interface # This is an ERC404 interface
    function approve(
        address spender_,
        uint256 valueOrId_
    ) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens in ERC-20 representation as the
     * allowance of `spender` over the caller's tokens.
     */
    function erc20Approve(
        address spender_,
        uint256 value_
    ) external returns (bool);

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token in ERC-721
     * representation to another account.
     */
    function erc721Approve(address spender_, uint256 id_) external;

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token in
     * ERC-721 representation owned by the caller.
     */
    function setApprovalForAll(address operator_, bool approved_) external;

    /**
     * @notice Function for mixed transfers from an operator that may be different
     * than 'from'.
     * @dev This function assumes the operator is attempting to transfer an ERC-721
     * if valueOrId is a possible valid token id.
     */
    // slither-disable-next-line erc721-interface # This is an ERC404 interface
    function transferFrom(
        address from_,
        address to_,
        uint256 valueOrId_
    ) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens in ERC-20 representation from `from`
     * to `to` using the allowance mechanism. `value` is then deducted from the
     * caller's allowance.
     */
    function erc20TransferFrom(
        address from_,
        address to_,
        uint256 value_
    ) external returns (bool);

    /**
     * @dev Transfers `tokenId` token in ERC-721 representation from `from` to `to`.
     */
    function erc721TransferFrom(
        address from_,
        address to_,
        uint256 id_
    ) external;

    /**
     * @notice Function for ERC-20 transfers.
     * @dev This function assumes the operator is attempting to transfer as ERC-20
     * given this function is only supported on the ERC-20 interface.
     * Treats even large amounts that are valid ERC-721 ids as ERC-20s.
     */
    function transfer(address to_, uint256 value_) external returns (bool);

    /**
     * @notice Function to check if address is transfer exempt
     */
    function setSelfERC721TransferExempt(bool state_) external;

    /**
     * @notice Function for ERC-721 transfers with contract support.
     * This function only supports moving valid ERC-721 ids, as it does not exist on the ERC-20
     * spec and will revert otherwise.
     */
    function safeTransferFrom(address from_, address to_, uint256 id_) external;

    /**
     * @notice Function for ERC-721 transfers with contract support and callback data.
     * This function only supports moving valid ERC-721 ids, as it does not exist on the
     * ERC-20 spec and will revert otherwise.
     */
    function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        bytes calldata data_
    ) external;

    /**
     * @notice Function for EIP-2612 permits (ERC-20 only).
     * @dev Providing type(uint256).max for permit value results in an
     * unlimited approval that is not deducted from on transfers.
     */
    function permit(
        address owner_,
        address spender_,
        uint256 value_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) external;

    /**
     * @notice Returns domain initial domain separator, or recomputes if chain id
     * is not equal to initial chain id
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function ownedData(uint256 id_) external view returns (uint256);

    /**
     * Constant for token id encoding
     */
    function ID_ENCODING_PREFIX() external view returns (uint256);
}
