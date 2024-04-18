// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IDiamondPET404} from "../../diamond/IDiamondPET404.sol";

interface IPET404Exposer is IDiamondPET404 {
    function mintERC20(address account_, uint256 value_) external;
}
