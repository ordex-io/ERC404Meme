// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library DNABaseStorage {
    error NotRevealed(uint256 id, uint256 block_number);

    struct Layout {
        uint256 currentCounter;
        mapping(uint256 => uint256) countersById;
        mapping(uint256 => uint256[]) wordsByCounter;
        bytes32 schema_hash;
        string[] variants_name;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.DNABase");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function getSchemaHash() internal view returns (bytes32) {
        return layout().schema_hash;
    }

    function getVariantsName() internal view returns (string[] memory) {
        return layout().variants_name;
    }

    function getWordsById(
        uint256 id_
    ) internal view returns (uint256[] memory) {
        uint256 counterPoint_ = DNABaseStorage.layout().countersById[id_];
        return layout().wordsByCounter[counterPoint_];
    }

    function getDnaById(uint256 id_) internal view returns (bytes32) {
        uint256[] memory words = getWordsById(id_);
        if (words.length == 0) {
            revert NotRevealed(id_, block.number);
        }

        return keccak256(abi.encodePacked(id_, words));
    }

    function setCounterForId(uint256 id_) internal {
        DNABaseStorage.layout().countersById[id_] = DNABaseStorage
            .currentCounter();
    }

    function saveWords(uint256[] memory words_) internal returns (uint256) {
        uint256 counterId = currentCounter();

        layout().wordsByCounter[counterId] = words_;

        // New counter ID for new words and mint
        increaseCounter();

        return counterId;
    }

    function currentCounter() internal view returns (uint256) {
        return layout().currentCounter;
    }

    function increaseCounter() internal {
        layout().currentCounter += 1;
    }
}
