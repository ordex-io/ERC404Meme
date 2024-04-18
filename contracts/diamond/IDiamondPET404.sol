// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAutomationVRF} from "../automation/vrf/IAutomationVRF.sol";
import {IDNA} from "../dna/IDNA.sol";
import {IPET404} from "../PET404/IPET404.sol";

import {ISolidStateDiamond} from "@solidstate/contracts/proxy/diamond/ISolidStateDiamond.sol";

interface IDiamondPET404 is ISolidStateDiamond, IAutomationVRF, IDNA, IPET404 {}
