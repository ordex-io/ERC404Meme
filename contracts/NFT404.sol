// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {ERC404} from "./ERC404/ERC404.sol";
import {Random} from "./random/Random.sol";
import {DNA} from "./dna/DNA.sol";

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

    function tokenURI(
        uint256 id_
    ) public pure override returns (string memory) {
        return
            string.concat("https://example.com/token/", Strings.toString(id_));
    }

    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        // ASKFA
    }
}
