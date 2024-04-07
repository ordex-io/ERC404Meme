//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "@solidstate/contracts/access/ownable/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC404, ERC404Storage} from "../../NFT404/ERC404/ERC404.sol";

contract ERC404Example is Ownable, ERC404 {
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 units_,
        string memory baseUri_,
        address initialOwner_,
        uint256 maxTotalSupplyERC721_,
        address initialMintRecipient_
    ) ERC404(name_, symbol_, decimals_, units_) {
        // Save the base URI
        ERC404Storage.setBaseUri(baseUri_);

        // Set the owner of the contract
        _setOwner(initialOwner_);

        // Do not mint the ERC721s to the initial owner, as it's a waste of gas.
        _setERC721TransferExempt(initialMintRecipient_, true);
        _mintERC20(initialMintRecipient_, maxTotalSupplyERC721_ * units());
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
