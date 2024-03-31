// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseInternal} from "./DNABaseInternal.sol";

abstract contract DNABase is DNABaseInternal {
    function getDnaOf(uint256 id_) public view virtual returns (bytes32);

    function decodeADN(uint256 id_) public view virtual returns (string memory);
}
