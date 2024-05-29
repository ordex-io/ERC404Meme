// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library DNAStorage {
    error NotRevealed(uint256 id, uint256 blockNumber);
    error NotWaitingReveal(uint256 blockNumber);
    error NotExistingId(uint256 id);

    struct Layout {
        uint256 pendingReveals;
        uint256 currentCounter;
        string schemaHash;
        string[] variantsName;
        mapping(uint256 => uint256) countersById;
        mapping(uint256 => uint256[]) wordsByCounter;
    }

    bytes32 internal constant STORAGE_SLOT =
        keccak256("ordex.contracts.storage.DNA");

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }

    function getDnaById(uint256 id_) internal view returns (bytes32) {
        if (!hasCounterId(id_)) {
            revert NotExistingId(id_);
        }

        uint256 counterPoint_ = layout().countersById[id_];
        uint256[] memory words = layout().wordsByCounter[counterPoint_];
        if (words.length == 0) {
            revert NotRevealed(id_, block.number);
        }

        return keccak256(abi.encodePacked(id_, words));
    }

    function setCounterForId(uint256 id_) internal {
        layout().countersById[id_] = currentCounter();
        layout().pendingReveals += 1;
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
        layout().pendingReveals = 0;
    }

    /// @notice Obtain the amount of tokens waiting to be revealed
    /// @return An uint256 that expose the amount of tokens pending
    function pendingReveals() internal view returns (uint256) {
        return layout().pendingReveals;
    }

    function currentCounter() internal view returns (uint256) {
        return layout().currentCounter;
    }

    function increaseCounter() internal {
        layout().currentCounter += 1;
    }
}
