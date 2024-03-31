// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC404} from "./ERC404/ERC404.sol";
import {Random} from "./random/Random.sol";
import {DNA} from "./dna/DNA.sol";
import {NFT404Storage} from "./NFT404Storage.sol";
import {ERC404BaseStorage} from "./ERC404/base/ERC404BaseStorage.sol";
import {DNABaseStorage} from "./dna/base/DNABaseStorage.sol";
import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
import "hardhat/console.sol";

struct ERC404InitParams {
    string name;
    string symbol;
    uint8 decimals;
    uint256 maxTotalSupplyERC721;
    address initialMintRecipient;
}
struct RandomInitParams {
    address vrfCoordinator;
    bytes32 keyHash;
    uint64 subscriptionId;
    uint16 requestConfirmations;
    uint32 callbackGasLimit;
    uint32 numWords;
}

contract NFT404 is ERC404, Random, DNA {
    event NftsRevealed(uint256 reqId, uint256 nftRevealCounter, uint256 time);

    function initialize(
        ERC404InitParams memory erc404Params_,
        RandomInitParams memory randomParams_
    ) public initializer {
        // Init the ERC404
        __ERC404Base_init(
            erc404Params_.name,
            erc404Params_.symbol,
            erc404Params_.decimals
        );

        // Do not mint the ERC721s to the initial owner, as it's a waste of gas.
        _setERC721TransferExempt(erc404Params_.initialMintRecipient, true);
        _mintERC20(
            erc404Params_.initialMintRecipient,
            erc404Params_.maxTotalSupplyERC721 * _units()
        );

        // Init the randomness
        __RandomBase_init(
            randomParams_.vrfCoordinator,
            randomParams_.keyHash,
            randomParams_.subscriptionId,
            randomParams_.requestConfirmations,
            randomParams_.callbackGasLimit,
            randomParams_.numWords
        );
    }

    function getDnaOf(uint256 id_) public view override returns (bytes32) {
        uint256 counter = NFT404Storage.layout().countersById[id_];
        return _getDnaOf(id_, counter);
    }

    function decodeADN(
        uint256 id_
    ) public view override returns (string memory) {
        return _decodeADN(getDnaOf(id_));
    }

    function tokenURI(
        uint256 id_
    ) public pure override returns (string memory) {
        // TODO: Work on the IPFS upload/generation
        return
            string.concat("https://example.com/token/", Strings.toString(id_));
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 _nftRevealCounter = NFT404Storage.layout().nftRevealCounter;
        // Save the words
        DNABaseStorage.layout().wordsByCounter[_nftRevealCounter] = randomWords;

        emit NftsRevealed(requestId, _nftRevealCounter, block.timestamp);
    }

    function _transferERC721(
        address from_,
        address to_,
        uint256 id_
    ) internal override {
        // If this is not a mint, handle record keeping for transfer from previous owner.
        if (from_ != address(0)) {
            // On transfer of an NFT, any previous approval is reset.
            delete ERC404BaseStorage.layout().getApproved[id_];

            uint256 updatedId = ERC404BaseStorage.layout()._owned[from_][
                ERC404BaseStorage.layout()._owned[from_].length - 1
            ];
            if (updatedId != id_) {
                uint256 updatedIndex = _getOwnedIndex(id_);
                // update _owned for sender
                ERC404BaseStorage.layout()._owned[from_][
                    updatedIndex
                ] = updatedId;
                // update index for the moved id
                _setOwnedIndex(updatedId, updatedIndex);
            }

            // pop
            ERC404BaseStorage.layout()._owned[from_].pop();
        }

        // Check if this is a burn.
        if (to_ != address(0)) {
            // If not a burn, update the owner of the token to the new owner.
            // Update owner of the token to the new owner.
            _setOwnerOf(id_, to_);
            // Push token onto the new owner's stack.

            ERC404BaseStorage.layout()._owned[to_].push(id_);
            // Update index for new owner's stack.
            _setOwnedIndex(
                id_,
                ERC404BaseStorage.layout()._owned[to_].length - 1
            );

            //
            if (from_ == address(0)) {
                NFT404Storage.layout().countersById[id_] = NFT404Storage
                    .layout()
                    .nftRevealCounter;

                console.log("print LOL");
            }
        } else {
            // If this is a burn, reset the owner of the token to 0x0 by deleting the token from _ownedData.
            delete ERC404BaseStorage.layout()._ownedData[id_];
        }

        emit ERC721Events.Transfer(from_, to_, id_);
    }
}
