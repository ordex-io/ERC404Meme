//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {VRFCoordinatorV2Mock as VRFMock} from "@chainlink/contracts/src/v0.8/mocks/VRFCoordinatorV2Mock.sol";

contract VRFCoordinatorV2Mock is VRFMock {
    constructor(
        uint96 _baseFee,
        uint96 _gasPriceLink
    ) VRFMock(_baseFee, _gasPriceLink) {}
}
