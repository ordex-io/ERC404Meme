// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {DNABaseStorage} from "./DNABaseStorage.sol";

struct DNAInitParams {
    bytes32 schema_hash;
    string[] variant_name;
    uint256[] variant_count;
}

abstract contract DNA is Initializable {
    error NotRevealed(uint256 id, uint256 block_number);

    function getDnaOf(uint256 id_) public view virtual returns (bytes32);

    function dnaOfToJson(uint256 id_) public view returns (string memory) {
        return
            _decodeDna(
                getDnaOf(id_),
                DNABaseStorage.layout().variant_name,
                DNABaseStorage.layout().variant_count,
                DNABaseStorage.layout().schema_hash
            );
    }

    function __DNABase_init(
        DNAInitParams memory initParams_
    ) internal onlyInitializing {
        require(
            initParams_.variant_name.length == initParams_.variant_count.length,
            "MISMATCH_VARIANT"
        );

        DNABaseStorage.layout().schema_hash = initParams_.schema_hash;
        DNABaseStorage.layout().variant_name = initParams_.variant_name;
        DNABaseStorage.layout().variant_count = initParams_.variant_count;
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
        string[] memory variant_name_,
        uint256[] memory variant_count_,
        bytes32 schema_hash_
    ) private pure returns (string memory) {
        // Start building the JSON string
        string memory jsonString = "{";

        // Iterate over the keys and values arrays
        for (uint256 i = 0; i < variant_name_.length; i++) {
            uint256 dnaParamValue = uint256(
                keccak256(
                    (abi.encodePacked(schema_hash_, dna_, variant_name_[i]))
                )
            ) % variant_count_[i];

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
