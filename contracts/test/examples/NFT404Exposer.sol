// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NFT404} from "../../NFT404/NFT404.sol";

contract NFT404Exposer is NFT404 {
    function mintERC20(address account_, uint256 value_) external onlyOwner {
        _mintERC20(account_, value_);
    }
}
