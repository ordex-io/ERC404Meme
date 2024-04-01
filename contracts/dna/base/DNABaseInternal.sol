// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {DNABaseStorage} from "./DNABaseStorage.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

abstract contract DNABaseInternal is Initializable {
    error DNAAlreadySet(uint256);

    function __DNABase_init(
        bytes32 schemaHash_,
        string[] memory variant_name_,
        uint256[] memory variant_count_
    ) internal onlyInitializing {
        require(
            variant_name_.length == variant_count_.length,
            "MISMATCH_VARIANT"
        );

        DNABaseStorage.layout().schemaHash = schemaHash_;
        DNABaseStorage.layout().variant_name = variant_name_;
        DNABaseStorage.layout().variant_count = variant_count_;
    }

    function _decodeADN(
        bytes32 adn_
    ) public view virtual returns (string memory) {
        if (address(uint160(uint256(adn_))) == address(0)) {
            revert DNAAlreadySet(1);
        }
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
