// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Initializable} from "@solidstate/contracts/security/initializable/Initializable.sol";
import {DNABaseStorage} from "./DNABaseStorage.sol";
import {IDNA} from "./IDNA.sol";

contract DNA is IDNA, Initializable {
    function __DNA_init(
        bytes32 schemaHash,
        string[] memory variantsName
    )
        public
        reinitializer(2) // reinitializer using 2 (2nd contract calling his init)
    {
        DNABaseStorage.layout().schema_hash = schemaHash;
        DNABaseStorage.layout().variants_name = variantsName;
    }

    function dnaOf(uint256 id_) public view returns (bytes32) {
        return DNABaseStorage.getDnaById(id_);
    }

    function dnaOfToJson(
        uint256 id_,
        uint256[] memory variants_count_
    ) public view returns (string memory) {
        return
            _decodeDna(
                DNABaseStorage.getDnaById(id_),
                DNABaseStorage.getSchemaHash(),
                DNABaseStorage.getVariantsName(),
                variants_count_
            );
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
                    Strings.toString(dnaParamValue),
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
