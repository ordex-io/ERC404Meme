import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { deployFullPET404DiamondNonVrf } from "../utils";

// TODO: Move from INit to construction with diamond/facets approach deployment
describe.only("PET404", () => {
  describe("Initial values", () => {
    it("should get the initial values correctly", async () => {
      const {
        diamondContract: PET404Contract,
        ownerSigner,
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

      const { diamondContract: PET404Contract, ownerSigner } =
        await loadFixture(deployFullPET404DiamondNonVrf);

      expect(ownerSigner.address).to.be.not.equal(signer1.address);

      // Check contract owner
      expect(await PET404Contract.owner()).to.be.not.equal(signer1.address);

      // Try to change the caller address for automation calls (reveals)
      expect(PET404Contract.connect(signer1).setCallerAddress(signer1.address))
        .to.be.reverted;

      // Try to change the baseUri
      const newBaseUri = "MyNewBaseUriRandom";
      expect(PET404Contract.connect(signer1).setBaseUri(newBaseUri)).to.be
        .reverted;

      // Set transfer exemptions to targets
      const target = signer1.address;

      // Try to set transfer exemption
      expect(
        PET404Contract.connect(signer1).setERC721TransferExempt(target, true)
      ).to.be.reverted;
    });
  });
});
