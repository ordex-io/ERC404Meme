// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SafeOwnable} from "@solidstate/contracts/access/ownable/SafeOwnable.sol";
import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
import {ERC404, ERC404Storage} from "./ERC404/ERC404.sol";
import {DNABaseStorage} from "../dna/DNABaseStorage.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {INFT404} from "./INFT404.sol";

contract NFT404 is INFT404, ERC404, SafeOwnable {
    error NoAutomationRegister();
    event NftsRevealed(uint256 nftRevealCounter, uint256 time);

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 units_,
        string memory baseUri_
    ) ERC404(name_, symbol_, decimals_, units_) {
        ERC404Storage.setBaseUri(baseUri_);
    }

    /**
     * @dev Set the Exempt state for an address. Only the owner/admin of the
     * contract can call the set function
     */
    function setERC721TransferExempt(
        address target_,
        bool state_
    ) external onlyOwner {
        _setERC721TransferExempt(target_, state_);
    }

    function setBaseUri(string memory newBaseUri_) external onlyOwner {
        ERC404Storage.setBaseUri(newBaseUri_);
    }

    function tokenURI(
        uint256 id_
    ) public view override returns (string memory) {
        return string.concat(ERC404Storage.getBaseUri(), Strings.toString(id_));
    }

    function _transferERC721(
        address from_,
        address to_,
        uint256 id_
    ) internal override {
        super._transferERC721(from_, to_, id_);

        // If "from" is an address zero, it means a mint
        // This happens after whole transfer, so it would guarantee sucess this part
        if (from_ == address(0)) {
            DNABaseStorage.setCounterForId(id_);
        }
    }
}
