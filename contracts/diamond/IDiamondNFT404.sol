// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAutomationVRF} from "../automation/vrf/IAutomationVRF.sol";
import {IDNA} from "../dna/IDNA.sol";
import {INFT404} from "../NFT404/INFT404.sol";

import {ISolidStateDiamond} from "@solidstate/contracts/proxy/diamond/ISolidStateDiamond.sol";

interface IDiamondNFT404 is ISolidStateDiamond, IAutomationVRF, IDNA, INFT404 {}
