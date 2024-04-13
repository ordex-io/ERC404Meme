//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@solidstate/contracts/access/ownable/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC404, ERC404Storage} from "../../NFT404/ERC404/ERC404.sol";

contract MinimalERC404 is Ownable, ERC404 {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 units_,
        string memory baseUri_,
        address initialOwner_
    ) {
        __ERC404_init(name_, symbol_, decimals_, units_);

        // Save the base URI
        ERC404Storage.setBaseUri(baseUri_);

        // Set the owner of the contract
        _setOwner(initialOwner_);
    }

    function mintERC20(address account_, uint256 value_) external onlyOwner {
        _mintERC20(account_, value_);
    }

    function tokenURI(
        uint256 id_
    ) public pure override returns (string memory) {
        return
            string.concat("https://example.com/token/", Strings.toString(id_));
    }

    function setERC721TransferExempt(
        address account_,
        bool value_
    ) external onlyOwner {
        _setERC721TransferExempt(account_, value_);
    }
}
