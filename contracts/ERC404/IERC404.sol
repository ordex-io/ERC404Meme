// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC404Base} from "./base/IERC404Base.sol";
import {IERC404BaseErrors} from "./base/IERC404BaseErrors.sol";
import {IERC404Metadata} from "./metadata/IERC404Metadata.sol";

/*
 * @dev Interface for ERC404.
 */
interface IERC404 is IERC404Base, IERC404BaseErrors, IERC404Metadata {

}
