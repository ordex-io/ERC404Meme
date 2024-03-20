// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC404BaseInternal} from "./ERC404BaseInternal.sol";
import {IERC404Base} from "./IERC404Base.sol";
import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
import {ERC20Events} from "ERC404/contracts/lib/ERC20Events.sol";

/**
 * @title ERC404Base
 */
abstract contract ERC404Base is IERC404Base, ERC404BaseInternal {
    /// @dev Address bitmask for packed ownership data
    uint256 private constant _BITMASK_ADDRESS = (1 << 160) - 1;

    /// @dev Owned index bitmask for packed ownership data
    uint256 private constant _BITMASK_OWNED_INDEX = ((1 << 96) - 1) << 160;

    /// @dev Constant for token id encoding
    uint256 public constant ID_ENCODING_PREFIX = 1 << 255;

    /**
     * @inheritdoc IERC404Base
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc20TotalSupply() public view returns (uint256) {
        return _totalSupply();
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721TotalSupply() public view returns (uint256) {
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
    function erc20BalanceOf(address owner_) public view returns (uint256) {
        return _balanceOf(owner_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721BalanceOf(address owner_) public view returns (uint256) {
        return _owned(owner_).length;
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721TransferExempt(address target_) public view returns (bool) {
        return target_ == address(0) || _erc721TransferExempt(target_);
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
    function allowance(
        address owner_,
        address spender_
    ) public view returns (uint256) {
        return _allowance(owner_, spender_);
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
    function ownerOf(uint256 id_) public view returns (address erc721Owner) {
        erc721Owner = _getOwnerOf(id_);

        if (!_isValidTokenId(id_)) {
            revert InvalidTokenId();
        }

        if (erc721Owner == address(0)) {
            revert NotFound();
        }
    }

    /**
     * @inheritdoc IERC404Base
     */
    function approve(
        address spender_,
        uint256 valueOrId_
    ) public returns (bool) {
        if (_isValidTokenId(valueOrId_)) {
            erc721Approve(spender_, valueOrId_);
        } else {
            return erc20Approve(spender_, valueOrId_);
        }

        return true;
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc721Approve(address spender_, uint256 id_) public virtual {
        // Intention is to approve as ERC-721 token (id).
        address erc721Owner = _getOwnerOf(id_);

        if (
            msg.sender != erc721Owner &&
            !_isApprovedForAll(erc721Owner, msg.sender)
        ) {
            revert Unauthorized();
        }

        _setGetApproved(id_, spender_);

        emit ERC721Events.Approval(erc721Owner, spender_, id_);
    }

    /**
     * @inheritdoc IERC404Base
     */
    function erc20Approve(
        address spender_,
        uint256 value_
    ) public virtual returns (bool) {
        // Prevent granting 0x0 an ERC-20 allowance.
        if (spender_ == address(0)) {
            revert InvalidSpender();
        }

        _setAllowance(msg.sender, spender_, value_);

        emit ERC20Events.Approval(msg.sender, spender_, value_);

        return true;
    }

    /// @notice For a token token id to be considered valid, it just needs
    ///         to fall within the range of possible token ids, it does not
    ///         necessarily have to be minted yet.
    function _isValidTokenId(uint256 id_) internal pure returns (bool) {
        return id_ > ID_ENCODING_PREFIX && id_ != type(uint256).max;
    }

    function _getOwnerOf(
        uint256 id_
    ) internal view virtual returns (address ownerOf_) {
        uint256 data = _ownedData(id_);

        assembly {
            ownerOf_ := and(data, _BITMASK_ADDRESS)
        }
    }
}
