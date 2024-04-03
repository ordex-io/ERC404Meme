// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
import {ERC404, ERC404Storage} from "./ERC404/ERC404.sol";
import {DNA, DNAInitParams, DNABaseStorage} from "./dna/DNA.sol";
import {NFT404Storage} from "./NFT404Storage.sol";

struct ERC404InitParams {
    string name;
    string symbol;
    uint8 decimals;
    uint256 units;
    uint256 maxTotalSupplyERC20;
    address initialMintRecipient;
}

contract NFT404 is ERC404, DNA {
    error NoAutomationRegister();
    event NftsRevealed(uint256 nftRevealCounter, uint256 time);

    function initialize(
        ERC404InitParams memory erc404Params_,
        DNAInitParams memory dnaInitParams_,
        address automationRegistry_
    ) public initializer {
        NFT404Storage.layout().autoRegistry = automationRegistry_;

        // Init the ERC404
        __ERC404_init(
            erc404Params_.name,
            erc404Params_.symbol,
            erc404Params_.decimals,
            erc404Params_.units
        );

        // Do not mint the ERC721s to the initial owner, as it's a waste of gas.
        _setERC721TransferExempt(erc404Params_.initialMintRecipient, true);
        _mintERC20(
            erc404Params_.initialMintRecipient,
            erc404Params_.maxTotalSupplyERC20
        );

        // Init DNA base
        __DNABase_init(dnaInitParams_);
    }

    function reveal() external {
        // This prevent calls for others than the registry
        if (msg.sender != NFT404Storage.layout().autoRegistry) {
            revert NoAutomationRegister();
        }

        // Get the current counter
        uint256 _nftRevealCounter = NFT404Storage.layout().nftRevealCounter;

        // Save the words
        DNABaseStorage.layout().wordsByCounter[_nftRevealCounter] = [
            uint256(blockhash(block.number - 1))
        ];

        emit NftsRevealed(_nftRevealCounter, block.timestamp);

        // Increase the counter for next mints
        NFT404Storage.layout().nftRevealCounter += 1;
    }

    function getDnaOf(uint256 id_) public view override returns (bytes32) {
        return _getDnaOf(id_, NFT404Storage.layout().countersById[id_]);
    }

    // TODO: Work on the IPFS upload/generation
    function tokenURI(
        uint256 id_
    ) public view override returns (string memory) {
        return
            string.concat(
                "https://example.com/token/",
                string(abi.encodePacked(getDnaOf(id_)))
            );
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
