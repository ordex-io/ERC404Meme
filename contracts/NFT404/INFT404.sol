// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC404} from "./ERC404/IERC404.sol";
import {ISafeOwnable} from "@solidstate/contracts/access/ownable/ISafeOwnable.sol";

interface INFT404 is IERC404, ISafeOwnable {
    function setERC721TransferExempt(address target_, bool state_) external;

    function setBaseUri(string memory newBaseUri_) external;
}
