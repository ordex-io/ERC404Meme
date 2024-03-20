// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC404Base} from "./base/ERC404Base.sol";
import {ERC404Metadata} from "./metadata/ERC404Metadata.sol";

abstract contract ERC404 is ERC404Base, ERC404Metadata {}
