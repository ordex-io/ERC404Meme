// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC721Receiver} from "@openzeppelin/contracts/interfaces/IERC721Receiver.sol";
import {ERC404BaseStorage} from "./ERC404BaseStorage.sol";
import {IERC404BaseErrors} from "./IERC404BaseErrors.sol";
import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
import {ERC20Events} from "ERC404/contracts/lib/ERC20Events.sol";
import {DoubleEndedQueue} from "ERC404/contracts/lib/DoubleEndedQueue.sol";

/**
 * @title ERC404Base internal functions
 */
abstract contract ERC404BaseInternal is IERC404BaseErrors {
    using DoubleEndedQueue for DoubleEndedQueue.Uint256Deque;

    // TODO: Make the inmutables to their own storages with an initializer (?)
    /// @dev Decimals for ERC-20 representation
    uint8 public immutable decimals;

    /// @dev Units for ERC-20 representation
    uint256 public immutable units;

    /// @dev Address bitmask for packed ownership data
    uint256 private constant _BITMASK_ADDRESS = (1 << 160) - 1;

    /// @dev Owned index bitmask for packed ownership data
    uint256 private constant _BITMASK_OWNED_INDEX = ((1 << 96) - 1) << 160;

    /// @dev Constant for token id encoding
    uint256 public constant ID_ENCODING_PREFIX = 1 << 255;

    function _totalSupply() internal view virtual returns (uint256) {
        return ERC404BaseStorage.layout().totalSupply;
    }

    function _minted() internal view returns (uint256) {
        return ERC404BaseStorage.layout().minted;
    }

    function _erc20TotalSupply() internal view returns (uint256) {
        return ERC404BaseStorage.layout().totalSupply;
    }

    function _erc721TotalSupply() internal view returns (uint256) {
        return ERC404BaseStorage.layout().minted;
    }

    function _erc20BalanceOf(address owner_) internal view returns (uint256) {
        return _balanceOf(owner_);
    }

    function _erc721BalanceOf(address owner_) internal view returns (uint256) {
        return _owned(owner_).length;
    }

    function _erc721TransferExempt(
        address target_
    ) internal view returns (bool) {
        return
            target_ == address(0) ||
            ERC404BaseStorage.layout()._erc721TransferExempt[target_];
    }

    function _getERC721QueueLength() internal view virtual returns (uint256) {
        return ERC404BaseStorage.layout()._storedERC721Ids.length();
    }

    function _getERC721TokensInQueue(
        uint256 start_,
        uint256 count_
    ) internal view virtual returns (uint256[] memory) {
        uint256[] memory tokensInQueue = new uint256[](count_);

        for (uint256 i = start_; i < start_ + count_; ) {
            tokensInQueue[i - start_] = ERC404BaseStorage
                .layout()
                ._storedERC721Ids
                .at(i);

            unchecked {
                ++i;
            }
        }

        return tokensInQueue;
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

    function _ownerOf(uint256 id_) internal view returns (address erc721Owner) {
        erc721Owner = _getOwnerOf(id_);

        if (!_isValidTokenId(id_)) {
            revert InvalidTokenId();
        }

        if (erc721Owner == address(0)) {
            revert NotFound();
        }
    }

    function _approve(
        address spender_,
        uint256 valueOrId_
    ) internal returns (bool) {
        if (_isValidTokenId(valueOrId_)) {
            _erc721Approve(spender_, valueOrId_);
        } else {
            return _erc20Approve(spender_, valueOrId_);
        }

        return true;
    }

    function _erc721Approve(address spender_, uint256 id_) internal virtual {
        // Intention is to approve as ERC-721 token (id).
        address erc721Owner = _getOwnerOf(id_);

        if (
            msg.sender != erc721Owner &&
            !_isApprovedForAll(erc721Owner, msg.sender)
        ) {
            revert Unauthorized();
        }

        ERC404BaseStorage.layout().getApproved[id_] = spender_;

        emit ERC721Events.Approval(erc721Owner, spender_, id_);
    }

    function _erc20Approve(
        address spender_,
        uint256 value_
    ) internal virtual returns (bool) {
        // Prevent granting 0x0 an ERC-20 allowance.
        if (spender_ == address(0)) {
            revert InvalidSpender();
        }

        ERC404BaseStorage.layout().allowance[msg.sender][spender_] = value_;

        emit ERC20Events.Approval(msg.sender, spender_, value_);

        return true;
    }

    function _setApprovalForAll(
        address operator_,
        bool approved_
    ) internal virtual {
        // Prevent approvals to 0x0.
        if (operator_ == address(0)) {
            revert InvalidOperator();
        }
        ERC404BaseStorage.layout().isApprovedForAll[msg.sender][
            operator_
        ] = approved_;

        emit ERC721Events.ApprovalForAll(msg.sender, operator_, approved_);
    }

    function _transferFrom(
        address from_,
        address to_,
        uint256 valueOrId_
    ) internal virtual returns (bool) {
        if (_isValidTokenId(valueOrId_)) {
            _erc721TransferFrom(from_, to_, valueOrId_);
        } else {
            // Intention is to transfer as ERC-20 token (value).
            return _erc20TransferFrom(from_, to_, valueOrId_);
        }

        return true;
    }

    function _erc721TransferFrom(
        address from_,
        address to_,
        uint256 id_
    ) internal virtual {
        // Prevent minting tokens from 0x0.
        if (from_ == address(0)) {
            revert InvalidSender();
        }

        // Prevent burning tokens to 0x0.
        if (to_ == address(0)) {
            revert InvalidRecipient();
        }

        if (from_ != _getOwnerOf(id_)) {
            revert Unauthorized();
        }

        // Check that the operator is either the sender or approved for the transfer.
        if (
            msg.sender != from_ &&
            !_isApprovedForAll(from_, msg.sender) &&
            msg.sender != _getApproved(id_)
        ) {
            revert Unauthorized();
        }

        // We only need to check ERC-721 transfer exempt status for the recipient
        // since the sender being ERC-721 transfer exempt means they have already
        // had their ERC-721s stripped away during the rebalancing process.
        if (_erc721TransferExempt(to_)) {
            revert RecipientIsERC721TransferExempt();
        }

        // Transfer 1 * units ERC-20 and 1 ERC-721 token.
        // ERC-721 transfer exemptions handled above. Can't make it to this point if either is transfer exempt.
        _transferERC20(from_, to_, units);
        _transferERC721(from_, to_, id_);
    }

    function _erc20TransferFrom(
        address from_,
        address to_,
        uint256 value_
    ) internal virtual returns (bool) {
        // Prevent minting tokens from 0x0.
        if (from_ == address(0)) {
            revert InvalidSender();
        }

        // Prevent burning tokens to 0x0.
        if (to_ == address(0)) {
            revert InvalidRecipient();
        }

        uint256 allowed = ERC404BaseStorage.layout().allowance[from_][
            msg.sender
        ];

        // Check that the operator has sufficient allowance.
        if (allowed != type(uint256).max) {
            ERC404BaseStorage.layout().allowance[from_][msg.sender] =
                allowed -
                value_;
        }

        // Transferring ERC-20s directly requires the _transferERC20WithERC721 function.
        // Handles ERC-721 exemptions internally.
        return _transferERC20WithERC721(from_, to_, value_);
    }

    function _transfer(
        address to_,
        uint256 value_
    ) internal virtual returns (bool) {
        // Prevent burning tokens to 0x0.
        if (to_ == address(0)) {
            revert InvalidRecipient();
        }

        // Transferring ERC-20s directly requires the _transferERC20WithERC721 function.
        // Handles ERC-721 exemptions internally.
        return _transferERC20WithERC721(msg.sender, to_, value_);
    }

    function _safeTransferFrom(
        address from_,
        address to_,
        uint256 id_,
        bytes memory data_
    ) internal virtual {
        if (!_isValidTokenId(id_)) {
            revert InvalidTokenId();
        }

        _transferFrom(from_, to_, id_);

        if (
            to_.code.length != 0 &&
            IERC721Receiver(to_).onERC721Received(
                msg.sender,
                from_,
                id_,
                data_
            ) !=
            IERC721Receiver.onERC721Received.selector
        ) {
            revert UnsafeRecipient();
        }
    }

    function _setERC721TransferExempt(
        address target_,
        bool state_
    ) internal virtual {
        if (target_ == address(0)) {
            revert InvalidExemption();
        }

        // Adjust the ERC721 balances of the target to respect exemption rules.
        // Despite this logic, it is still recommended practice to exempt prior to the target
        // having an active balance.
        if (state_) {
            _clearERC721Balance(target_);
        } else {
            _reinstateERC721Balance(target_);
        }
    }

    function _transferERC20WithERC721(
        address from_,
        address to_,
        uint256 value_
    ) internal virtual returns (bool) {
        uint256 erc20BalanceOfSenderBefore = _erc20BalanceOf(from_);
        uint256 erc20BalanceOfReceiverBefore = _erc20BalanceOf(to_);

        _transferERC20(from_, to_, value_);

        // Preload for gas savings on branches
        bool isFromERC721TransferExempt = _erc721TransferExempt(from_);
        bool isToERC721TransferExempt = _erc721TransferExempt(to_);

        // Skip _withdrawAndStoreERC721 and/or _retrieveOrMintERC721 for ERC-721 transfer exempt addresses
        // 1) to save gas
        // 2) because ERC-721 transfer exempt addresses won't always have/need ERC-721s corresponding to their ERC20s.
        if (isFromERC721TransferExempt && isToERC721TransferExempt) {
            // Case 1) Both sender and recipient are ERC-721 transfer exempt. No ERC-721s need to be transferred.
            // NOOP.
        } else if (isFromERC721TransferExempt) {
            // Case 2) The sender is ERC-721 transfer exempt, but the recipient is not. Contract should not attempt
            //         to transfer ERC-721s from the sender, but the recipient should receive ERC-721s
            //         from the bank/minted for any whole number increase in their balance.
            // Only cares about whole number increments.
            uint256 tokensToRetrieveOrMint = (_balanceOf(to_) / units) -
                (erc20BalanceOfReceiverBefore / units);
            for (uint256 i = 0; i < tokensToRetrieveOrMint; ) {
                _retrieveOrMintERC721(to_);
                unchecked {
                    ++i;
                }
            }
        } else if (isToERC721TransferExempt) {
            // Case 3) The sender is not ERC-721 transfer exempt, but the recipient is. Contract should attempt
            //         to withdraw and store ERC-721s from the sender, but the recipient should not
            //         receive ERC-721s from the bank/minted.
            // Only cares about whole number increments.
            uint256 tokensToWithdrawAndStore = (erc20BalanceOfSenderBefore /
                units) - (_balanceOf(from_) / units);
            for (uint256 i = 0; i < tokensToWithdrawAndStore; ) {
                _withdrawAndStoreERC721(from_);
                unchecked {
                    ++i;
                }
            }
        } else {
            // Case 4) Neither the sender nor the recipient are ERC-721 transfer exempt.
            // Strategy:
            // 1. First deal with the whole tokens. These are easy and will just be transferred.
            // 2. Look at the fractional part of the value:
            //   a) If it causes the sender to lose a whole token that was represented by an NFT due to a
            //      fractional part being transferred, withdraw and store an additional NFT from the sender.
            //   b) If it causes the receiver to gain a whole new token that should be represented by an NFT
            //      due to receiving a fractional part that completes a whole token, retrieve or mint an NFT
            // to the recevier.

            // Whole tokens worth of ERC-20s get transferred as ERC-721s without any burning/minting.
            uint256 nftsToTransfer = value_ / units;
            for (uint256 i = 0; i < nftsToTransfer; ) {
                // Pop from sender's ERC-721 stack and transfer them (LIFO)
                uint256 indexOfLastToken = _owned(from_).length - 1;
                uint256 tokenId = _owned(from_)[indexOfLastToken];
                _transferERC721(from_, to_, tokenId);
                unchecked {
                    ++i;
                }
            }

            // If the transfer changes either the sender or the recipient's holdings from a fractional to a
            //non-fractional amount (or vice versa), adjust ERC-721s.

            // First check if the send causes the sender to lose a whole token that was represented by an ERC-721
            // due to a fractional part being transferred.
            //
            // Process:
            // Take the difference between the whole number of tokens before and after the transfer for the sender.
            // If that difference is greater than the number of ERC-721s transferred (whole units), then there was
            // an additional ERC-721 lost due to the fractional portion of the transfer.
            // If this is a self-send and the before and after balances are equal (not always the case but often),
            // then no ERC-721s will be lost here.
            if (
                erc20BalanceOfSenderBefore /
                    units -
                    _erc20BalanceOf(from_) /
                    units >
                nftsToTransfer
            ) {
                _withdrawAndStoreERC721(from_);
            }

            // Then, check if the transfer causes the receiver to gain a whole new token which requires gaining
            // an additional ERC-721.
            //
            // Process:
            // Take the difference between the whole number of tokens before and after the transfer for the recipient.
            // If that difference is greater than the number of ERC-721s transferred (whole units), then there was
            // an additional ERC-721 gained due to the fractional portion of the transfer.
            // Again, for self-sends where the before and after balances are equal, no ERC-721s will be gained here.
            if (
                _erc20BalanceOf(to_) /
                    units -
                    erc20BalanceOfReceiverBefore /
                    units >
                nftsToTransfer
            ) {
                _retrieveOrMintERC721(to_);
            }
        }

        return true;
    }

    ////////////////

    /// @notice For a token token id to be considered valid, it just needs
    ///         to fall within the range of possible token ids, it does not
    ///         necessarily have to be minted yet.
    function _isValidTokenId(uint256 id_) internal pure returns (bool) {
        return id_ > ID_ENCODING_PREFIX && id_ != type(uint256).max;
    }

    /// @notice This is the lowest level ERC-20 transfer function, which
    ///         should be used for both normal ERC-20 transfers as well as minting.
    /// Note that this function allows transfers to and from 0x0.
    function _transferERC20(
        address from_,
        address to_,
        uint256 value_
    ) internal virtual {
        // Minting is a special case for which we should not check the balance of
        // the sender, and we should increase the total supply.
        if (from_ == address(0)) {
            ERC404BaseStorage.layout().totalSupply += value_;
        } else {
            // Deduct value from sender's balance.
            ERC404BaseStorage.layout().balanceOf[from_] -= value_;
        }

        // Update the recipient's balance.
        // Can be unchecked because on mint, adding to totalSupply is checked,
        // and on transfer balance deduction is checked.
        unchecked {
            ERC404BaseStorage.layout().balanceOf[to_] += value_;
        }

        emit ERC20Events.Transfer(from_, to_, value_);
    }

    /// @notice Consolidated record keeping function for transferring ERC-721s.
    /// @dev Assign the token to the new owner, and remove from the old owner.
    /// Note that this function allows transfers to and from 0x0.
    /// Does not handle ERC-721 exemptions.
    function _transferERC721(
        address from_,
        address to_,
        uint256 id_
    ) internal virtual {
        // If this is not a mint, handle record keeping for transfer from previous owner.
        if (from_ != address(0)) {
            // On transfer of an NFT, any previous approval is reset.
            delete ERC404BaseStorage.layout().getApproved[id_];

            uint256 updatedId = ERC404BaseStorage.layout()._owned[from_][
                ERC404BaseStorage.layout()._owned[from_].length - 1
            ];
            if (updatedId != id_) {
                uint256 updatedIndex = _getOwnedIndex(id_);
                // update _owned for sender
                ERC404BaseStorage.layout()._owned[from_][
                    updatedIndex
                ] = updatedId;
                // update index for the moved id
                _setOwnedIndex(updatedId, updatedIndex);
            }

            // pop
            ERC404BaseStorage.layout()._owned[from_].pop();
        }

        // Check if this is a burn.
        if (to_ != address(0)) {
            // If not a burn, update the owner of the token to the new owner.
            // Update owner of the token to the new owner.
            _setOwnerOf(id_, to_);
            // Push token onto the new owner's stack.

            ERC404BaseStorage.layout()._owned[to_].push(id_);
            // Update index for new owner's stack.
            _setOwnedIndex(
                id_,
                ERC404BaseStorage.layout()._owned[to_].length - 1
            );
        } else {
            // If this is a burn, reset the owner of the token to 0x0 by deleting the token from _ownedData.
            delete ERC404BaseStorage.layout()._ownedData[id_];
        }

        emit ERC721Events.Transfer(from_, to_, id_);
    }

    function _retrieveOrMintERC721(address to_) internal virtual {
        if (to_ == address(0)) {
            revert InvalidRecipient();
        }

        uint256 id;

        if (!ERC404BaseStorage.layout()._storedERC721Ids.empty()) {
            // If there are any tokens in the bank, use those first.
            // Pop off the end of the queue (FIFO).
            id = ERC404BaseStorage.layout()._storedERC721Ids.popBack();
        } else {
            // Otherwise, mint a new token, should not be able to go over the total fractional supply.
            ++ERC404BaseStorage.layout().minted;

            // Reserve max uint256 for approvals
            if (ERC404BaseStorage.layout().minted == type(uint256).max) {
                revert MintLimitReached();
            }

            id = ID_ENCODING_PREFIX + ERC404BaseStorage.layout().minted;
        }

        address erc721Owner = _getOwnerOf(id);

        // The token should not already belong to anyone besides 0x0 or this contract.
        // If it does, something is wrong, as this should never happen.
        if (erc721Owner != address(0)) {
            revert AlreadyExists();
        }

        // Transfer the token to the recipient, either transferring from the contract's bank or minting.
        // Does not handle ERC-721 exemptions.
        _transferERC721(erc721Owner, to_, id);
    }

    function _withdrawAndStoreERC721(address from_) internal virtual {
        if (from_ == address(0)) {
            revert InvalidSender();
        }

        // Retrieve the latest token added to the owner's stack (LIFO).
        uint256 id = _owned(from_)[_owned(from_).length - 1];

        // Transfer to 0x0.
        // Does not handle ERC-721 exemptions.
        _transferERC721(from_, address(0), id);

        // Record the token in the contract's bank queue.
        ERC404BaseStorage.layout()._storedERC721Ids.pushFront(id);
    }

    function _getOwnerOf(
        uint256 id_
    ) internal view virtual returns (address ownerOf_) {
        uint256 data = _ownedData(id_);

        assembly {
            ownerOf_ := and(data, _BITMASK_ADDRESS)
        }
    }

    function _getOwnedIndex(
        uint256 id_
    ) internal view virtual returns (uint256 ownedIndex_) {
        uint256 data = _ownedData(id_);

        assembly {
            ownedIndex_ := shr(160, data)
        }
    }

    function _setOwnerOf(uint256 id_, address owner_) internal virtual {
        uint256 data = _ownedData(id_);

        assembly {
            data := add(
                and(data, _BITMASK_OWNED_INDEX),
                and(owner_, _BITMASK_ADDRESS)
            )
        }

        ERC404BaseStorage.layout()._ownedData[id_] = data;
    }

    function _setOwnedIndex(uint256 id_, uint256 index_) internal virtual {
        uint256 data = _ownedData(id_);

        if (index_ > _BITMASK_OWNED_INDEX >> 160) {
            revert OwnedIndexOverflow();
        }

        assembly {
            data := add(
                and(data, _BITMASK_ADDRESS),
                and(shl(160, index_), _BITMASK_OWNED_INDEX)
            )
        }

        ERC404BaseStorage.layout()._ownedData[id_] = data;
    }

    function _clearERC721Balance(address target_) private {
        uint256 erc721Balance = _erc721BalanceOf(target_);

        for (uint256 i = 0; i < erc721Balance; ) {
            // Transfer out ERC721 balance
            _withdrawAndStoreERC721(target_);
            unchecked {
                ++i;
            }
        }
    }

    function _reinstateERC721Balance(address target_) private {
        uint256 expectedERC721Balance = _erc20BalanceOf(target_) / units;
        uint256 actualERC721Balance = _erc721BalanceOf(target_);

        for (uint256 i = 0; i < expectedERC721Balance - actualERC721Balance; ) {
            // Transfer ERC721 balance in from pool
            _retrieveOrMintERC721(target_);
            unchecked {
                ++i;
            }
        }
    }
}