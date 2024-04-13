import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployAutomationNonVrfFacet,
  deployAutomationRegistryMock,
  deployAutomationVrfFacet,
  deployDNAFacet,
  deployNFT404Facet,
} from "../utils";
import { ethers } from "hardhat";

// TODO: Move from INit to construction with diamond/facets approach deployment
describe("NFT404", () => {
  describe("Construction", () => {
    it("check", async () => {
      const factory = await ethers.getContractFactory("Diamond");
      const contract = await factory.deploy(ethers.ZeroAddress);
      await contract.waitForDeployment();

      const { nft404Contract } = await loadFixture(deployNFT404Facet);
      const { dnaContract } = await loadFixture(deployDNAFacet);
      const { automationNonVrf } = await loadFixture(
        deployAutomationNonVrfFacet
      );
      const { automationVrf } = await loadFixture(deployAutomationVrfFacet);

      nft404Contract.interface.forEachFunction((f_) => {
        console.log(`${f_.name} - ${f_.type} - ${f_.selector}`);
      });
      dnaContract.interface.forEachFunction((f_) => {
        console.log(`${f_.name} - ${f_.type} - ${f_.selector}`);
      });
      automationNonVrf.interface.forEachFunction((f_) => {
        console.log(`${f_.name} - ${f_.type} - ${f_.selector}`);
      });
      automationVrf.interface.forEachFunction((f_) => {
        console.log(`${f_.name} - ${f_.type} - ${f_.selector}`);
      });

      // // console.log("a: ", a);

      // console.log(
      //   "== getSelectorsAutoNonVrf(): ",
      //   await contract.getSelectorsAutoNonVrf()
      // );
      // console.log(
      //   "== getSelectorsAutoVrf(): ",
      //   await contract.getSelectorsAutoVrf()
      // );
      // console.log("== getSelectorsDNA(): ", await contract.getSelectorsDNA());
      // console.log(
      //   "== getSelectorsNF404(): ",
      //   await contract.getSelectorsNF404()
      // );
    });

    // it("should initialize the contract correctly", async () => {
    //   const { nft404, erc404Params, nft404Params } = await loadFixture(
    //     deployNFT404
    //   );

    //   expect(await nft404.units()).to.be.equals(
    //     erc404Params.units,
    //     "wrong units in the contract"
    //   );

    //   expect(await nft404.totalSupply()).to.be.equals(
    //     nft404Params.maxTotalSupplyERC20,
    //     "wrong erc20 total supply"
    //   );

    //   expect(
    //     await nft404.balanceOf(nft404Params.initialMintRecipient)
    //   ).to.be.equals(
    //     nft404Params.maxTotalSupplyERC20,
    //     "wrong balance assigned to initial minter"
    //   );

    //   expect(await nft404.erc721TotalSupply()).to.be.equals(
    //     0n,
    //     "Initial NFT minted"
    //   );
    // });

    // it("should mint a NFT after an ERC20 transfer", async () => {
    //   const { nft404, erc404Params, nft404Params } = await loadFixture(
    //     deployNFT404
    //   );
    //   const signers = await ethers.getSigners();

    //   const signer_0 = signers[0];
    //   const signer_1 = signers[1];

    //   expect(signer_0.address).to.be.equals(nft404Params.initialMintRecipient);

    //   const amountToTransfer = erc404Params.units; // 404K = 1 NFT

    //   await nft404.connect(signer_0).transfer(signer_1, amountToTransfer);

    //   expect(await nft404.balanceOf(signer_1.address)).to.be.equals(
    //     amountToTransfer
    //   );

    //   expect(await nft404.erc721BalanceOf(signer_1.address)).to.be.equals(1n);

    //   expect(await nft404.erc721TotalSupply()).to.be.equals(
    //     1n,
    //     "No nft minted"
    //   );
    // });

    // it("should remove NFT after losing ERC20 tokens", async () => {
    //   const { nft404, erc404Params, nft404Params } = await loadFixture(
    //     deployNFT404
    //   );
    //   const signers = await ethers.getSigners();

    //   const signer_0 = signers[0];
    //   const signer_1 = signers[1];
    //   const signer_2 = signers[2];

    //   expect(signer_0.address).to.be.equals(nft404Params.initialMintRecipient);

    //   const nftsToTransfer_0 = 10n; // 10 nft
    //   const amountToTransfer_0 = BigInt(erc404Params.units) * nftsToTransfer_0; // 404.000 * 10 = 4.040.000 -> 4.04M

    //   await nft404.connect(signer_0).transfer(signer_1, amountToTransfer_0);

    //   expect(await nft404.balanceOf(signer_1.address)).to.be.equals(
    //     amountToTransfer_0
    //   );

    //   expect(await nft404.erc721BalanceOf(signer_1.address)).to.be.equals(
    //     nftsToTransfer_0
    //   );
    //   expect(await nft404.erc721TotalSupply()).to.be.equals(
    //     nftsToTransfer_0,
    //     "No nft minted"
    //   );

    //   const amountToTransfer_1 = BigInt(erc404Params.units) / 2n;

    //   await nft404.connect(signer_1).transfer(signer_2, amountToTransfer_1);

    //   expect(await nft404.balanceOf(signer_2.address)).to.be.equals(
    //     amountToTransfer_1
    //   );

    //   expect(await nft404.balanceOf(signer_1.address)).to.be.equals(
    //     amountToTransfer_0 - amountToTransfer_1
    //   );

    //   expect(await nft404.erc721BalanceOf(signer_1.address)).to.be.equals(
    //     nftsToTransfer_0 - 1n
    //   );

    //   expect(await nft404.erc721BalanceOf(signer_2.address)).to.be.equals(0n);
    // });
  });
});
