import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { deployFullPET404DiamondNonVrf } from "../utils";
import {
  calculateDNA,
  getBlockHash,
  getERC721TransfersEventsArgs,
} from "../../utils";

describe.only("PET404 - Non VRF", () => {
  describe("Initial values", () => {
    it("should get the initial values correctly", async () => {
      const {
        diamondContract: PET404Contract,
        ownerSigner,
        pet404Facet,
        dnaFacet,
        facetsArgs: { pet404: pet404Args, dna: dnaArgs, automation: autoArgs },
      } = await loadFixture(deployFullPET404DiamondNonVrf);

      // Just a few to check that we can get values from facets. Each facet has
      // the tests for this
      expect(await PET404Contract.owner()).to.be.equal(ownerSigner.address);
      expect(await PET404Contract.decimals()).to.be.equal(pet404Args.decimals);
      expect(await PET404Contract.getBaseUri()).to.be.equal(pet404Args.baseUri);
      expect(await PET404Contract.getSchemaHash()).to.be.equal(
        dnaArgs.schemaHash
      );
      expect(await PET404Contract.getCallerAddress()).to.be.equal(
        autoArgs.automationRegistryAddress
      );

      // No NFTs are minted. No owners.
      const nftId = (await PET404Contract.ID_ENCODING_PREFIX()) + 1n;

      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );

      // No reveals
      expect(PET404Contract.dnaOf(nftId)).to.be.revertedWithCustomError(
        dnaFacet,
        "NotRevealed"
      );
    });
  });

  describe("Only owner access calls", () => {
    it("should correctly allow the owner to make only owner calls", async () => {
      const [, signer1] = await ethers.getSigners();

      const { diamondContract: PET404Contract, ownerSigner } =
        await loadFixture(deployFullPET404DiamondNonVrf);

      // Check contract owner
      expect(await PET404Contract.owner()).to.be.equal(ownerSigner.address);

      // Change the caller address for automation calls (reveals)
      await PET404Contract.connect(ownerSigner).setCallerAddress(
        signer1.address
      );
      expect(await PET404Contract.getCallerAddress()).to.be.equal(
        signer1.address
      );

      // Change the baseUri
      const newBaseUri = "MyNewBaseUriRandom";
      await PET404Contract.connect(ownerSigner).setBaseUri(newBaseUri);
      expect(await PET404Contract.getBaseUri()).to.be.equal(newBaseUri);

      // Set transfer exemptions to targets
      const target = signer1.address;

      // Check current status
      expect(await PET404Contract.erc721TransferExempt(target)).to.be.equal(
        false
      );

      // Make transfer exemption
      await PET404Contract.connect(ownerSigner).setERC721TransferExempt(
        target,
        true
      );

      expect(await PET404Contract.erc721TransferExempt(target)).to.be.equal(
        true
      );

      // Set as NON transfer exemption again
      await PET404Contract.connect(ownerSigner).setERC721TransferExempt(
        target,
        false
      );

      expect(await PET404Contract.erc721TransferExempt(target)).to.be.equal(
        false
      );
    });

    it("should revert if non owner account try to execute only owner calls", async () => {
      const [, signer1] = await ethers.getSigners();

      const {
        diamondContract: PET404Contract,
        ownerSigner,
        pet404Facet,
      } = await loadFixture(deployFullPET404DiamondNonVrf);

      expect(ownerSigner.address).to.be.not.equal(signer1.address);

      // Check contract owner is not our caller
      expect(await PET404Contract.owner()).to.be.not.equal(signer1.address);

      // Try to change the caller address for automation calls (reveals)
      expect(
        PET404Contract.connect(signer1).setCallerAddress(signer1.address)
      ).to.be.revertedWithCustomError(pet404Facet, "Ownable__NotOwner");

      // Try to change the baseUri
      const newBaseUri = "MyNewBaseUriRandom";
      expect(
        PET404Contract.connect(signer1).setBaseUri(newBaseUri)
      ).to.be.revertedWithCustomError(pet404Facet, "Ownable__NotOwner");

      // Set transfer exemptions to targets
      const target = signer1.address;

      // Try to set transfer exemption
      expect(
        PET404Contract.connect(signer1).setERC721TransferExempt(target, true)
      ).to.be.revertedWithCustomError(pet404Facet, "Ownable__NotOwner");
    });

    it("should revert if try to reveal if not the caller address automation", async () => {
      const { diamondContract: PET404Contract, automationNonVrfFacet } =
        await loadFixture(deployFullPET404DiamondNonVrf);

      expect(PET404Contract.reveal()).to.be.revertedWithCustomError(
        automationNonVrfFacet,
        "NoAutomationRegister"
      );
    });
  });

  describe.only("Reveal transactions", () => {
    it("should reveal NFT after automation call", async () => {
      const {
        diamondContract: PET404Contract,
        pet404Facet,
        dnaFacet,
        automationRegistry,
      } = await loadFixture(deployFullPET404DiamondNonVrf);

      const [signer1, alice] = await ethers.getSigners();

      // Check balance of initial recipient. It should have the whole supply
      expect(
        await PET404Contract.erc721TransferExempt(signer1.address)
      ).to.be.equal(true);
      expect(await PET404Contract.erc20BalanceOf(signer1.address)).to.be.equal(
        await PET404Contract.erc20TotalSupply()
      );

      // check initial alice's balance
      expect(await PET404Contract.erc20BalanceOf(alice.address)).to.be.equal(0);
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );

      // Send tokens to alice to get one NFT
      const nftsToGet0 = 1n;
      const amountToSent0 = nftsToGet0 * (await PET404Contract.units());

      const tx0 = await PET404Contract.connect(signer1).transfer(
        alice.address,
        amountToSent0
      );

      // check that received the tokens
      expect(await PET404Contract.erc20BalanceOf(alice.address)).to.be.equal(
        amountToSent0
      );
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        nftsToGet0
      );

      // Get  ERC721transfer events
      const events721 = await getERC721TransfersEventsArgs(tx0, pet404Facet);

      // Should be just one NFT mint
      expect(events721.length).to.be.equal(nftsToGet0);

      // We get the ID
      const { id: nftId0 } = events721[0];

      // It should not be revealed yet
      expect(PET404Contract.dnaOf(nftId0)).to.be.revertedWithCustomError(
        dnaFacet,
        "NotRevealed"
      );

      // Mock the reveal call using a Automation Register caller mock
      const txReveal = await automationRegistry.simulateAutoReveal(
        await PET404Contract.getAddress()
      );

      // Calculate the expected DNA.
      const words = [BigInt(await getBlockHash(txReveal.blockNumber! - 1))];
      const expectedDna = calculateDNA(nftId0, words);

      // NFT shoudl be revealed
      expect(await PET404Contract.dnaOf(nftId0)).to.be.equal(expectedDna);
    });

    it("should reveal multiple NFT after automation call", async () => {
      const {
        diamondContract: PET404Contract,
        pet404Facet,
        dnaFacet,
        automationRegistry,
      } = await loadFixture(deployFullPET404DiamondNonVrf);

      const [signer1, alice, bob] = await ethers.getSigners();

      // Check balance of initial recipient. It should have the whole supply
      expect(
        await PET404Contract.erc721TransferExempt(signer1.address)
      ).to.be.equal(true);
      expect(await PET404Contract.erc20BalanceOf(signer1.address)).to.be.equal(
        await PET404Contract.erc20TotalSupply()
      );

      // check initial alice's balance
      expect(await PET404Contract.erc20BalanceOf(alice.address)).to.be.equal(0);
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );

      const nftsToGet0 = 2n;
      const amountToSent0 = nftsToGet0 * (await PET404Contract.units());

      // Send tokens to alice to get two NFT
      const tx0 = await PET404Contract.connect(signer1).transfer(
        alice.address,
        amountToSent0
      );

      // check that alice received the tokens
      expect(await PET404Contract.erc20BalanceOf(alice.address)).to.be.equal(
        amountToSent0
      );
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        nftsToGet0
      );

      // Send tokens to bob to get two NFT
      const tx1 = await PET404Contract.connect(signer1).transfer(
        bob.address,
        amountToSent0
      );

      // check that bob received the tokens
      expect(await PET404Contract.erc20BalanceOf(bob.address)).to.be.equal(
        amountToSent0
      );
      expect(await PET404Contract.erc721BalanceOf(bob.address)).to.be.equal(
        nftsToGet0
      );

      // Get  ERC721transfer events
      const events721_0 = await getERC721TransfersEventsArgs(tx0, pet404Facet);
      const events721_1 = await getERC721TransfersEventsArgs(tx1, pet404Facet);

      const all721Events = events721_0.concat(events721_1);

      // Should mint the correct amount of NFTS (4 nfts)
      expect(all721Events.length).to.be.equal(nftsToGet0 * 2n);

      // Iterate over all erc721 events to get the IDs
      for (let i = 0; i < all721Events.length; i++) {
        // Get the ID
        const { id: nftId } = all721Events[i];

        // None token should be revelead yet
        expect(PET404Contract.dnaOf(nftId)).to.be.revertedWithCustomError(
          dnaFacet,
          "NotRevealed"
        );
      }

      // Mock the reveal call using a Automation Register caller mock
      const txReveal = await automationRegistry.simulateAutoReveal(
        await PET404Contract.getAddress()
      );

      // The expected words
      const words = [BigInt(await getBlockHash(txReveal.blockNumber! - 1))];

      // Iterate over all erc721 events to get the IDs
      for (let i = 0; i < all721Events.length; i++) {
        // Get the ID
        const { id: nftId } = all721Events[i];

        // Calculate the expected DNA.
        const expectedDna = calculateDNA(nftId, words);

        // NFT shoudl be revealed
        expect(await PET404Contract.dnaOf(nftId)).to.be.equal(expectedDna);
      }
    });
  });
});
