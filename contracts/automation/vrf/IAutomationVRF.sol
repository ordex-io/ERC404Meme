// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IAutomationBase} from "../IAutomationBase.sol";
import {IVRFConsumerV2} from "./chainlink/IVRFConsumerV2.sol";

interface IAutomationVRF is IAutomationBase, IVRFConsumerV2 {}
