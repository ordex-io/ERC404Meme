// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseStorage} from "./DNABaseStorage.sol";

abstract contract DNABaseInternal {
    error DNAAlreadySet(uint256);

    function _decodeADN(bytes32 adn_) public view virtual returns (string memory) {
        return "";
    }

    /**
     * Calculate the DNA
     */
    function _getDnaOf(
        uint256 id_,
        uint256 counterPoint_
    ) internal view virtual returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    id_,
                    DNABaseStorage.layout().wordsByCounter[counterPoint_]
                )
            );
    }
}
