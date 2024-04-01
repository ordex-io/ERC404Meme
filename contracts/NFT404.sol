// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
import {ERC404, ERC404BaseStorage} from "./ERC404/ERC404.sol";
import {DNA, DNAInitParams, DNABaseStorage} from "./dna/DNA.sol";
import {Random, RandomInitParams} from "./random/Random.sol";
import {NFT404Storage} from "./NFT404Storage.sol";

struct ERC404InitParams {
    string name;
    string symbol;
    uint8 decimals;
    uint256 maxTotalSupplyERC721;
    address initialMintRecipient;
}

contract NFT404 is ERC404, Random, DNA {
    event NftsRevealed(uint256 reqId, uint256 nftRevealCounter, uint256 time);

    function initialize(
        ERC404InitParams memory erc404Params_,
        DNAInitParams memory dnaInitParams_,
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

        // Init DNA base
        __DNABase_init(dnaInitParams_);

        // Init the randomness
        __RandomBase_init(randomParams_);
    }

    function getDnaOf(uint256 id_) public view override returns (bytes32) {
        uint256 counter = NFT404Storage.layout().countersById[id_];
        return _getDnaOf(id_, counter);
    }

    // TODO: Improve this
    function decodeADN(
        uint256 id_
    ) public view override returns (string memory) {
        return string(abi.encode(id_, DNABaseStorage.layout().schemaHash));
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
        super._transferERC721(from_, to_, id_);

        // If "from" is an address zero, it means a mint
        // This happens after whole transfer, so it would guarantee sucess this part
        if (from_ == address(0)) {
            NFT404Storage.layout().countersById[id_] = NFT404Storage
                .layout()
                .nftRevealCounter;
        }
    }
}
