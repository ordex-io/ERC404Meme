//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {DNA} from "../../dna/DNA.sol";
import {Random} from "../../random/Random.sol";

contract RanDNAExample is Random, DNA {
    event TokenMint(uint256 id, uint256 currentRandomId, address owner);
    event RandomRequested(uint256 requestId, uint256 randomId);
    event RandomFulfilled(uint256 requestId, uint256[] randomWords);

    error NotRevealed(uint256 id, uint256 time);

    struct NFTDataStored {
        uint256 id;
        uint256 randomId;
        address owner;
        uint256 printTime;
    }

    mapping(uint256 => NFTDataStored) nftsData;
    mapping(address => uint256) balances;
    uint256 nftCounderId;

    mapping(uint256 => uint256[]) randomStored;
    mapping(uint256 => uint256) randomPerRequest;
    uint256 randomCounterId;

    function initialize(
        address vrfCoordinator_,
        bytes32 keyHash_,
        uint64 subscriptionId_,
        uint16 requestConfirmations_,
        uint32 callbackGasLimit_,
        uint32 numWords_
    ) public initializer {
        __RandomBase_init(
            vrfCoordinator_,
            keyHash_,
            subscriptionId_,
            requestConfirmations_,
            callbackGasLimit_,
            numWords_
        );
    }

    function mint() public {
        balances[msg.sender] += 1;
        nftsData[nftCounderId] = NFTDataStored(
            nftCounderId,
            randomCounterId,
            msg.sender,
            block.timestamp
        );
        emit TokenMint(nftCounderId, randomCounterId, msg.sender);

        nftCounderId += 1;
    }

    function requestReveal() public {
        uint256 reqId = _requestRandom();
        randomPerRequest[reqId] = randomCounterId;
        emit RandomRequested(reqId, randomCounterId);

        // This way, next mint from here will have a different random (or maybe make this on fulfill function)
        randomCounterId += 1;
    }

    function getDNA(uint256 id_) public view returns (bytes32) {
        NFTDataStored memory nftData = nftsData[id_];
        uint256[] memory ranWords = randomStored[nftData.randomId];

        if (ranWords.length == 0) {
            revert NotRevealed(id_, block.timestamp);
        }

        return _toDNA(id_, ranWords, nftData.printTime);
    }

    /**
     * Simple child implementation
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 randomPointer = randomPerRequest[requestId];
        randomStored[randomPointer] = randomWords;

        emit RandomFulfilled(requestId, randomWords);
    }
}
