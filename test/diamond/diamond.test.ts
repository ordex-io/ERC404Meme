import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { deployFullPET404DiamondNonVrf } from "../utils";

describe("Diamond - NFT - CAT404", () => {
  describe("Facets with Auto Non VRF", () => {
    it("should use the correct owner address for different facets", async () => {
      const [signer0, signer1] = await ethers.getSigners();
      const { diamondContract, ownerSigner, facetsArgs } = await loadFixture(
        deployFullPET404DiamondNonVrf
      );

      const transferExemptAddress = signer1.address;
      const newUri = "www.random-uri.com";
      const amountToMint = 50n * facetsArgs.pet404.units; // 50 * 404k

      // Initials states
      expect(await diamondContract.erc721TransferExempt(transferExemptAddress))
        .to.be.false;
      expect(await diamondContract.getBaseUri()).to.not.contain(newUri);
      expect(
        await diamondContract.balanceOf(transferExemptAddress)
      ).to.be.equals(0n);

      // Should revert from PET404NonVRF Facet with NON-owner
      expect(
        diamondContract
          .connect(signer0)
          .setERC721TransferExempt(transferExemptAddress, true)
      ).to.be.revertedWithCustomError(diamondContract, "Ownable__NotOwner");

      expect(
        diamondContract.connect(signer1).setBaseUri(newUri)
      ).to.be.revertedWithCustomError(diamondContract, "Ownable__NotOwner");

      expect(
        diamondContract
          .connect(signer0)
          .mintERC20(transferExemptAddress, amountToMint)
      ).to.be.revertedWithCustomError(diamondContract, "Ownable__NotOwner");

      // Should pass with owner
      await diamondContract
        .connect(ownerSigner)
        .setERC721TransferExempt(transferExemptAddress, true);

      await diamondContract.connect(ownerSigner).setBaseUri(newUri);

      await diamondContract
        .connect(ownerSigner)
        .mintERC20(transferExemptAddress, amountToMint);

      // End states
      expect(await diamondContract.erc721TransferExempt(transferExemptAddress))
        .to.be.true;
      expect(await diamondContract.getBaseUri()).to.contain(newUri);
      expect(
        await diamondContract.balanceOf(transferExemptAddress)
      ).to.be.equals(amountToMint);
    });

    it("should mint NFT only if get enough ERC20 tokens", async () => {
      const [, signer1] = await ethers.getSigners();
      const { diamondContract, ownerSigner, facetsArgs } = await loadFixture(
        deployFullPET404DiamondNonVrf
      );

      expect(await diamondContract.balanceOf(signer1.address)).to.be.equals(0n);
      expect(
        await diamondContract.erc20BalanceOf(signer1.address)
      ).to.be.equals(0n);
      expect(
        await diamondContract.erc721BalanceOf(signer1.address)
      ).to.be.equals(0n);

      const nftQuantityToGet = 5n;
      const erc20Amount = nftQuantityToGet * facetsArgs.pet404.units;

      // Give some tokens to signer0
      await diamondContract
        .connect(ownerSigner)
        .mintERC20(signer1.address, erc20Amount);

      expect(await diamondContract.balanceOf(signer1.address)).to.be.equals(
        erc20Amount
      );
      expect(
        await diamondContract.erc20BalanceOf(signer1.address)
      ).to.be.equals(erc20Amount);
      expect(
        await diamondContract.erc721BalanceOf(signer1.address)
      ).to.be.equals(nftQuantityToGet);
    });
  });
});
