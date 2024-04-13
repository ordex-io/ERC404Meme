// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDiamondNFT404} from "../../diamond/IDiamondNFT404.sol";

interface INFT404Exposer is IDiamondNFT404 {
    function mintERC20(address account_, uint256 value_) external;
}
