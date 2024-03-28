// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseInternal} from "./DNABaseInternal.sol";

abstract contract DNABase is DNABaseInternal {
    function getDnaOf(uint256 id_) public view returns (bytes32) {
        return _getDnaOf(id_);
    }
}
