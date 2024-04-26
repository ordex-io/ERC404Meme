//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor() ERC20("Test token", "TTK") {
        _mint(msg.sender, 100000000000 * 1e18);
    }

    function mint(uint256 amount) public {
        _mint(msg.sender, amount * 1e18);
    }
}
