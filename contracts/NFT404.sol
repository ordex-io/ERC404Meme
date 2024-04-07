// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import {ERC721Events} from "ERC404/contracts/lib/ERC721Events.sol";
// import {ERC404, ERC404Storage} from "./ERC404/ERC404.sol";
// import {DNA, DNAInitParams, DNABaseStorage} from "./dna/DNA.sol";
// import {NFT404Storage} from "./NFT404Storage.sol";

// struct ERC404InitParams {
//     string name;
//     string symbol;
//     uint8 decimals;
//     uint256 units;
// }

// struct ERC404ConfigInitParams {
//     address automationRegistry;
//     address initialOwner;
//     uint256 maxTotalSupplyERC20;
//     address initialMintRecipient;
// }

// contract NFT404 is ERC404, DNA, OwnableUpgradeable {
//     error NoAutomationRegister();
//     event NftsRevealed(uint256 nftRevealCounter, uint256 time);

//     function initialize(
//         ERC404InitParams memory erc404Params_,
//         DNAInitParams memory dnaInitParams_,
//         ERC404ConfigInitParams memory nft404Params_
//     ) public initializer {
//         NFT404Storage.layout().autoRegistry = nft404Params_.automationRegistry;

//         // Ownable initialization
//         __Ownable_init(nft404Params_.initialOwner);

//         // Init the ERC404
//         __ERC404_init(
//             erc404Params_.name,
//             erc404Params_.symbol,
//             erc404Params_.decimals,
//             erc404Params_.units
//         );

//         // Do not mint the ERC721s to the initial owner, as it's a waste of gas.
//         _setERC721TransferExempt(nft404Params_.initialMintRecipient, true);
//         _mintERC20(
//             nft404Params_.initialMintRecipient,
//             nft404Params_.maxTotalSupplyERC20
//         );

//         // Init DNA base
//         __DNABase_init(dnaInitParams_);
//     }

//     function setERC721TransferExempt(
//         address target_,
//         bool state_
//     ) external onlyOwner {
//         _setERC721TransferExempt(target_, state_);
//     }

//     function reveal() external {
//         // This prevent calls for others than the registry
//         if (msg.sender != NFT404Storage.layout().autoRegistry) {
//             revert NoAutomationRegister();
//         }

//         uint256[] memory words = new uint256[](1);
//         words[0] = uint256(blockhash(block.number - 1));

//         // Save the words and get a countID about where are stored on the mapping
//         // Also increase the counter for next mints/reveals
//         uint256 counterID = _saveWords(words);

//         emit NftsRevealed(counterID, block.timestamp);
//     }

//     // TODO: Work on the IPFS upload/generation
//     function tokenURI(
//         uint256 id_
//     ) public view override returns (string memory) {
//         return
//             string.concat(
//                 "https://example.com/token/",
//                 string(abi.encodePacked(getDnaOf(id_)))
//             );
//     }

//     function _transferERC721(
//         address from_,
//         address to_,
//         uint256 id_
//     ) internal override {
//         super._transferERC721(from_, to_, id_);

//         // If "from" is an address zero, it means a mint
//         // This happens after whole transfer, so it would guarantee sucess this part
//         if (from_ == address(0)) {
//             _saveCounterForId(id_);
//         }
//     }
// }
