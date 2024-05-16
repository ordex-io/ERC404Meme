// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library DNABaseStorage {
    error NotRevealed(uint256 id, uint256 block_number);
    error NotWaitingReveal(uint256 block_number);

    struct Layout {
        uint256 currentCounter;
        bytes32 schema_hash;
        string[] variants_name;
        mapping(uint256 => uint256) countersById;
        mapping(uint256 => uint256[]) wordsByCounter;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.DNABase");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function getDnaById(uint256 id_) internal view returns (bytes32) {
        uint256 counterPoint_ = layout().countersById[id_];
        uint256[] memory words = layout().wordsByCounter[counterPoint_];
        if (words.length == 0) {
            revert NotRevealed(id_, block.number);
        }

        return keccak256(abi.encodePacked(id_, words));
    }

    function setCounterForId(uint256 id_) internal {
        layout().countersById[id_] = layout().currentCounter;
    }

    function hasCounterId(uint256 id_) internal view returns (bool) {
        return layout().countersById[id_] != 0;
    }

    function saveWords(
        uint256[] memory words_
    ) internal returns (uint256 counterId) {
        counterId = currentCounter();
        layout().wordsByCounter[counterId] = words_;

        // New counter ID for new words and mint
        increaseCounter();
    }

    function currentCounter() internal view returns (uint256) {
        return layout().currentCounter;
    }

    function increaseCounter() internal {
        layout().currentCounter += 1;
    }

    function checkWaiting() internal view {
        // TODO: FIX
        if (false) {
            revert NotWaitingReveal(block.timestamp);
        }
    }
}
