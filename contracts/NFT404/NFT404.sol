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

    function __NFT404_init(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 units_,
        string memory baseUri_,
        uint256 maxTotalSupplyERC721_,
        address initialMintRecipient_
    )
        public
        reinitializer(1) // reinitializer using 1 (1st contract calling his init)
    {
        // The `__ERC404_init` function already have the initializer modifier,
        // so, if the contract is already initialized, then this function will fail.
        __ERC404_init(name_, symbol_, decimals_, units_);
        ERC404Storage.setBaseUri(baseUri_);

        // Do not mint the ERC721s to the initial owner, as it's a waste of gas.
        _setERC721TransferExempt(initialMintRecipient_, true);
        _mintERC20(initialMintRecipient_, maxTotalSupplyERC721_ * units());
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
        _existingId(id_);
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

    function _existingId(uint256 id_) internal view {
        // Check if id_ provided is a valid ERC404 id
        if (!_isValidTokenId(id_)) {
            revert InvalidTokenId();
        } else {
            if (id_ - ID_ENCODING_PREFIX > super.erc721TotalSupply()) {
                // If the ID result is greater than the current total ERC721 minted
                // Means that it's not minted yet.
                revert IdNotMinted();
            }
        }
    }
}
