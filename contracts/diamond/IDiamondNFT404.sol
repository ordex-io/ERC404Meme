// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAutomationVRF} from "../automation/vrf/IAutomationVRF.sol";
import {IDNA} from "../dna/IDNA.sol";
import {INFT404} from "../NFT404/INFT404.sol";

interface IDiamondNFT404 is IAutomationVRF, IDNA, INFT404 {}
