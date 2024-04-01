// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {DNABaseStorage} from "./DNABaseStorage.sol";

struct DNAInitParams {
    bytes32 schemaHash;
    string[] variant_name;
    uint256[] variant_count;
}

abstract contract DNA is Initializable {
    function getDnaOf(uint256 id_) public view virtual returns (bytes32);

    function decodeADN(uint256 id_) public view virtual returns (string memory);

    function __DNABase_init(
        DNAInitParams memory initParams_
    ) internal onlyInitializing {
        require(
            initParams_.variant_name.length == initParams_.variant_count.length,
            "MISMATCH_VARIANT"
        );

        DNABaseStorage.layout().schemaHash = initParams_.schemaHash;
        DNABaseStorage.layout().variant_name = initParams_.variant_name;
        DNABaseStorage.layout().variant_count = initParams_.variant_count;
    }

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
