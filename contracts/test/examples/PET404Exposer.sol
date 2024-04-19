// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PET404} from "../../PET404/PET404.sol";

contract PET404Exposer is PET404 {
    /**
     * Mint ERC20 token to the given `account_`.
     *
     * This function will mint the ERC721 to the `account_` if the address
     * is NOT a transferExempt.
     */
    function mintERC20(address account_, uint256 value_) external onlyOwner {
        _mintERC20(account_, value_);
    }

    /**
     *  Mint ERC20 token to the `account_` excluding any ERC721 mint
     */
    function mintERC20(
        address account_,
        uint256 value_,
        bool withErc721_
    ) external onlyOwner {
        if (withErc721_) {
            _mintERC20(account_, value_);
        } else {
            _transferERC20(address(0), account_, value_);
        }
    }
}
