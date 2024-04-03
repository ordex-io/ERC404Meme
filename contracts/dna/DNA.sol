// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {DNABaseStorage} from "./DNABaseStorage.sol";

struct DNAInitParams {
    bytes32 schema_hash;
    string[] variants_name;
}

abstract contract DNA is Initializable {
    error NotRevealed(uint256 id, uint256 block_number);

    function getDnaOf(uint256 id_) public view virtual returns (bytes32);

    function dnaOfToJson(
        uint256 id_,
        uint256[] memory variants_count_
    ) public view returns (string memory) {
        return
            _decodeDna(
                getDnaOf(id_),
                DNABaseStorage.layout().schema_hash,
                DNABaseStorage.layout().variants_name,
                variants_count_
            );
    }

    function __DNABase_init(
        DNAInitParams memory initParams_
    ) internal onlyInitializing {
        DNABaseStorage.layout().schema_hash = initParams_.schema_hash;
        DNABaseStorage.layout().variants_name = initParams_.variants_name;
    }

    function _getDnaOf(
        uint256 id_,
        uint256 counterPoint_
    ) internal view virtual returns (bytes32) {
        uint256[] memory words = DNABaseStorage.layout().wordsByCounter[
            counterPoint_
        ];
        if (words.length == 0) {
            revert NotRevealed(id_, block.number);
        }

        return keccak256(abi.encodePacked(id_, words));
    }

    function _decodeDna(
        bytes32 dna_,
        bytes32 schema_hash_,
        string[] memory variant_name_,
        uint256[] memory param_variants_count_
    ) private pure returns (string memory) {
        require(
            variant_name_.length == param_variants_count_.length,
            "MISMATCH_VARIANTS"
        );
        // Start building the JSON string
        string memory jsonString = "{";

        // Iterate over the keys and values arrays
        for (uint256 i = 0; i < variant_name_.length; i++) {
            // dna_param_value = uint256(keccack256(schema_hash + dna + keccack256(param_name)) ٪ param_variants_count
            uint256 dnaParamValue = uint256(
                keccak256(
                    (
                        abi.encodePacked(
                            schema_hash_,
                            dna_,
                            keccak256(abi.encodePacked(variant_name_[i]))
                        )
                    )
                )
            ) % param_variants_count_[i];

            // Append key-value pair to the JSON string
            jsonString = string(
                abi.encodePacked(
                    jsonString,
                    '"',
                    variant_name_[i],
                    '":"',
                    dnaParamValue,
                    '"'
                )
            );

            // Add comma if it's not the last element
            if (i < variant_name_.length - 1) {
                jsonString = string(abi.encodePacked(jsonString, ","));
            }
        }

        // Close the JSON object
        return string(abi.encodePacked(jsonString, "}"));
    }
}
