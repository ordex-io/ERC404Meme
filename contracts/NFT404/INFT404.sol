// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC404} from "./ERC404/IERC404.sol";

import {IOwnable} from "@solidstate/contracts/access/ownable/IOwnable.sol";

interface INFT404 is IERC404, IOwnable {
    function setERC721TransferExempt(address target_, bool state_) external;
}
