// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseStorage} from "./DNABaseStorage.sol";

abstract contract DNABaseInternal {
    error DNAAlreadySet(uint256);

    function _getDnaOf(uint256 id_) internal view returns (bytes32) {
        return DNABaseStorage.layout().dnaByIds[id_];
    }

    /**
     * Internal function to add/save a given DNA.
     * @dev By default the contract avoid to overwrite an already defined DNA.
     * @param id_ The ID where will be stored the DNA
     * @param dna_ The DNA data to store
     */
    function _setDnaOf(uint256 id_, bytes32 dna_) internal virtual {
        // If given ID already have a DNA, should revert
        if (_getDnaOf(id_) != bytes32(0)) {
            revert DNAAlreadySet(id_);
        }

        DNABaseStorage.layout().dnaByIds[id_] = dna_;
    }
}
