// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC404BaseInternal, ERC404Storage} from "./ERC404BaseInternal.sol";
import {IERC404Base} from "./IERC404Base.sol";

/**
 * @title ERC404Base
 */
abstract contract ERC404Base is IERC404Base, ERC404BaseInternal {
    /**
     * @inheritdoc IERC404Base
     */
    function name() external view returns (string memory) {
        return _name();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function symbol() external view returns (string memory) {
        return _symbol();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function decimals() external view returns (uint8) {
        return _decimals();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function units() external view returns (uint256) {
        return _units();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function minted() public view returns (uint256) {
        return _minted();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function balanceOf(address owner_) public view returns (uint256) {
        return _balanceOf(owner_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function allowance(
        address owner_,
        address spender_
    ) public view returns (uint256) {
        return _allowance(owner_, spender_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function getApproved(uint256 id_) public view returns (address) {
        return _getApproved(id_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function isApprovedForAll(
        address owner_,
        address operator_
    ) public view returns (bool) {
        return _isApprovedForAll(owner_, operator_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function nonces(address owner_) public view returns (uint256) {
        return _nonces(owner_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function ownerOf(uint256 id_) public view returns (address erc721Owner) {
        return _ownerOf(id_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function owned(address owner_) public view returns (uint256[] memory) {
        return _owned(owner_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721BalanceOf(address owner_) public view returns (uint256) {
        return _erc721BalanceOf(owner_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc20BalanceOf(address owner_) public view returns (uint256) {
        return _erc20BalanceOf(owner_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc20TotalSupply() public view returns (uint256) {
        return _erc20TotalSupply();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721TotalSupply() public view returns (uint256) {
        return _erc721TotalSupply();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function getERC721QueueLength() public view virtual returns (uint256) {
        return _getERC721QueueLength();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function getERC721TokensInQueue(
        uint256 start_,
        uint256 count_
    ) public view virtual returns (uint256[] memory) {
        return _getERC721TokensInQueue(start_, count_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function approve(
        address spender_,
        uint256 valueOrId_
    ) public returns (bool) {
        return _approve(spender_, valueOrId_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721Approve(address spender_, uint256 id_) public virtual {
        _erc721Approve(spender_, id_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc20Approve(
        address spender_,
        uint256 value_
    ) public virtual returns (bool) {
        return _erc20Approve(spender_, value_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function setApprovalForAll(
        address operator_,
        bool approved_
    ) public virtual {
        _setApprovalForAll(operator_, approved_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function transferFrom(
        address from_,
        address to_,
        uint256 valueOrId_
    ) public virtual returns (bool) {
        return _transferFrom(from_, to_, valueOrId_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721TransferFrom(
        address from_,
        address to_,
        uint256 id_
    ) public virtual {
        _erc721TransferFrom(from_, to_, id_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc20TransferFrom(
        address from_,
        address to_,
        uint256 value_
    ) public virtual returns (bool) {
        return _erc20TransferFrom(from_, to_, value_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function transfer(address to_, uint256 value_) public returns (bool) {
        return _transfer(to_, value_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_
    ) public virtual {
        _safeTransferFrom(from_, to_, id_, "");
    }

    /**
     * @inheritdoc IERC404Base
     */
    function safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        bytes memory data_
    ) public virtual {
        _safeTransferFrom(from_, to_, id_, data_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function permit(
        address owner_,
        address spender_,
        uint256 value_,
        uint256 deadline_,
        uint8 v_,
        bytes32 r_,
        bytes32 s_
    ) public virtual {
        _permit(owner_, spender_, value_, deadline_, v_, r_, s_);
    }

    function DOMAIN_SEPARATOR() public view virtual returns (bytes32) {
        return _DOMAIN_SEPARATOR();
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual returns (bool) {
        return _supportsInterface(interfaceId);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function setSelfERC721TransferExempt(bool state_) public virtual {
        _setERC721TransferExempt(msg.sender, state_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721TransferExempt(address target_) public view returns (bool) {
        return _erc721TransferExempt(target_);
    }
}
