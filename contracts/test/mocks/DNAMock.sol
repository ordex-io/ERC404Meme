// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNA, DNAStorage} from "../../dna/DNA.sol";

contract DNAMock is DNA {
    event WordsSaved(uint256 counterId, uint256[] words);

    constructor(string memory schemaHash, string[] memory variantsName) {
        __DNA_init(schemaHash, variantsName);
    }

    /*
     * Fill all the IDs provided to use the given words.
     *
     * This is a helper test function to fill the contract with values and test
     * the generated values.
     */

    function setWordsForIDs(
        uint256[] memory ids_,
        uint256[] memory words_
    ) public {
        for (uint256 i = 0; i < ids_.length; i++) {
            DNAStorage.setCounterForId(ids_[i]);
        }

        uint256 counterId = DNAStorage.saveWords(words_);

        emit WordsSaved(counterId, words_);
    }
}
