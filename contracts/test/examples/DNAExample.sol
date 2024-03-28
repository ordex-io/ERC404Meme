//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {DNA} from "../../dna/DNA.sol";

// Implementer test of the DNA
contract DNAExample is DNA {
    function saveDna(uint256 id_, bytes32 dna_) public {
        _setDnaOf(id_, dna_);
    }

    function toDNA(
        uint256 id_,
        uint256[] memory words_,
        uint256 seed_
    ) public view returns (bytes32) {
        return _toDNA(id_, words_, seed_);
    }
}
