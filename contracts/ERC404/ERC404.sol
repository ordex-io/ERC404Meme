// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC404Base} from "./base/ERC404Base.sol";
import {ERC404Metadata} from "./metadata/ERC404Metadata.sol";

contract ERC404 is ERC404Base, ERC404Metadata {
    constructor() ERC404Base(0, bytes32(0)) {}

    function tokenURI(uint256 tokenId) public pure returns (string memory) {
        return "";
    }
}
