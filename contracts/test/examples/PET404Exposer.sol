// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PET404} from "../../PET404/PET404.sol";

contract PET404Exposer is PET404 {
    function mintERC20(address account_, uint256 value_) external onlyOwner {
        _mintERC20(account_, value_);
    }
}
