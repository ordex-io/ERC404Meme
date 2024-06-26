// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IDNA {
    function __DNA_init(
        string memory schemaHash,
        string[] memory variantsName
    ) external;

    function getSchemaHash() external view returns (string memory);

    function getVariantsName() external view returns (string[] memory);

    function dnaOf(uint256 id_) external view returns (bytes32);

    function dnaOfToJson(
        uint256 id_,
        uint256[] memory variants_count_
    ) external view returns (string memory);
}
