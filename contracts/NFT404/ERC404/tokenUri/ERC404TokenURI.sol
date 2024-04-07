// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC404TokenURI} from "./IERC404TokenURI.sol";
import {ERC404TokenURIStorage} from "./ERC404TokenURIStorage.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract ERC404TokenURI is IERC404TokenURI {
    constructor(string memory baseUri_) {
        ERC404TokenURIStorage.layout().baseUri = baseUri_;
    }

    function tokenURI(
        uint256 id_
    ) public view override returns (string memory) {
        return
            string.concat(
                ERC404TokenURIStorage.getBaseUri(),
                Strings.toString(id_)
            );
    }
}
