// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SolidStateDiamond} from "@solidstate/contracts/proxy/diamond/SolidStateDiamond.sol";

contract Diamond is SolidStateDiamond {
    constructor(
        address owner_,
        FacetCut[] memory facetCuts_,
        address target_,
        bytes memory calldata_
    ) {
        _setOwner(owner_);

        _diamondCut(facetCuts_, target_, calldata_);
    }
}
