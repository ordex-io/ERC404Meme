// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SolidStateDiamond} from "@solidstate/contracts/proxy/diamond/SolidStateDiamond.sol";
import {IAutomationBase} from "../automation/non-vrf/IAutomationNonVRF.sol";
import {IVRFConsumerV2} from "../automation/vrf/IAutomationVRF.sol";
import {IDNA} from "../dna/IDNA.sol";
import {INFT404, IERC404} from "../NFT404/INFT404.sol";

contract Diamond is SolidStateDiamond {
    constructor(address owner_) {
        _setOwner(owner_);
    }
}
