import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployNFT404,
  getERC721TransfersEventsArgs,
  getBlockHash,
  calculateDNA,
  dnaToJsonString,
} from "../utils";
import { ethers } from "hardhat";

describe("DNA NFT404", () => {
  it("should mint NFTs without DNA before their reveal", async () => {
    const signers = await ethers.getSigners();
    const singer_0 = signers[0];
    const singer_1 = signers[1];
    const singer_2 = signers[2];

    const { nft404, erc404Params } = await loadFixture(deployNFT404);

    const nftAmount_0 = 2n;
    const amountToTransfer_0 = BigInt(erc404Params.units) * nftAmount_0;

    const tx_0 = await nft404
      .connect(singer_0)
      .transfer(singer_1.address, amountToTransfer_0);

    const tx_1 = await nft404
      .connect(singer_0)
      .transfer(singer_2.address, amountToTransfer_0);

    expect(await nft404.balanceOf(singer_1.address)).to.be.equals(
      amountToTransfer_0
    );
    expect(await nft404.balanceOf(singer_2.address)).to.be.equals(
      amountToTransfer_0
    );

    const events_0 = await getERC721TransfersEventsArgs(tx_0, nft404);
    const events_1 = await getERC721TransfersEventsArgs(tx_1, nft404);

    // All the IDs minted for each owner
    const allNftIds = events_0
      .map((event_) => event_.id)
      .concat(events_1.map((event_) => event_.id));

    for (let i = 0; i < allNftIds.length; i++) {
      // None of these NFTs should be revealed yet
      expect(nft404.getDnaOf(allNftIds[i])).to.be.revertedWithCustomError(
        nft404,
        "NotRevealed"
      );
    }
  });

  it("should revert if non automation registry try to reveal nfts", async () => {
    const signers = await ethers.getSigners();
    const singer_0 = signers[0];
    const singer_1 = signers[1];
    const singer_2 = signers[2];

    const { nft404, erc404Params } = await loadFixture(deployNFT404);

    const nftAmount_0 = 1n;
    const amountToTransfer_0 = BigInt(erc404Params.units) * nftAmount_0;

    const tx_0 = await nft404
      .connect(singer_0)
      .transfer(singer_1.address, amountToTransfer_0);

    const tx_1 = await nft404
      .connect(singer_0)
      .transfer(singer_2.address, amountToTransfer_0);

    expect(await nft404.balanceOf(singer_1.address)).to.be.equals(
      amountToTransfer_0
    );
    expect(await nft404.balanceOf(singer_2.address)).to.be.equals(
      amountToTransfer_0
    );

    const events_0 = await getERC721TransfersEventsArgs(tx_0, nft404);
    const events_1 = await getERC721TransfersEventsArgs(tx_1, nft404);

    // All the IDs minted for each owner
    const allNftIds = events_0
      .map((event_) => event_.id)
      .concat(events_1.map((event_) => event_.id));

    for (let i = 0; i < allNftIds.length; i++) {
      // None of these NFTs should be revealed yet
      expect(nft404.getDnaOf(allNftIds[i])).to.be.revertedWithCustomError(
        nft404,
        "NotRevealed"
      );
    }

    expect(nft404.reveal()).to.be.revertedWithCustomError(
      nft404,
      "NoAutomationRegister"
    );
  });

  it("should mint, reveal a NFT and obtain their DNA", async () => {
    const signers = await ethers.getSigners();
    const singer_0 = signers[0];
    const singer_1 = signers[1];
    const singer_2 = signers[2];

    const { nft404, erc404Params, automationRegistry } = await loadFixture(
      deployNFT404
    );

    const nftAmount_0 = 1n;
    const amountToTransfer_0 = BigInt(erc404Params.units) * nftAmount_0;

    const tx_0 = await nft404
      .connect(singer_0)
      .transfer(singer_1.address, amountToTransfer_0);

    const tx_1 = await nft404
      .connect(singer_0)
      .transfer(singer_2.address, amountToTransfer_0);

    expect(await nft404.balanceOf(singer_1.address)).to.be.equals(
      amountToTransfer_0
    );
    expect(await nft404.balanceOf(singer_2.address)).to.be.equals(
      amountToTransfer_0
    );

    const events_0 = await getERC721TransfersEventsArgs(tx_0, nft404);
    const events_1 = await getERC721TransfersEventsArgs(tx_1, nft404);

    // All the IDs minted for each owner
    const allNftIds = events_0
      .map((event_) => event_.id)
      .concat(events_1.map((event_) => event_.id));

    for (let i = 0; i < allNftIds.length; i++) {
      // None of these NFTs should be revealed yet
      expect(nft404.getDnaOf(allNftIds[i])).to.be.revertedWithCustomError(
        nft404,
        "NotRevealed"
      );
    }

    const tx = await nft404.connect(automationRegistry).reveal();

    const blockHash0 = await getBlockHash(tx.blockNumber! - 1);
    const words = [BigInt(blockHash0)];

    for (let i = 0; i < allNftIds.length; i++) {
      // None of these NFTs should be revealed yet
      expect(await nft404.getDnaOf(allNftIds[i])).to.be.equals(
        calculateDNA(allNftIds[i], words),
        "not the correct DNA generated"
      );
    }
  });

  it("should mint, reveal a NFT and obtain their DNA JSON", async () => {
    const signers = await ethers.getSigners();
    const singer_0 = signers[0];
    const singer_1 = signers[1];

    const { nft404, erc404Params, automationRegistry, dnaParams } =
      await loadFixture(deployNFT404);

    const nftAmount_0 = 10n;
    const amountToTransfer_0 = BigInt(erc404Params.units) * nftAmount_0;

    const tx_0 = await nft404
      .connect(singer_0)
      .transfer(singer_1.address, amountToTransfer_0);

    expect(await nft404.balanceOf(singer_1.address)).to.be.equals(
      amountToTransfer_0
    );

    const events_0 = await getERC721TransfersEventsArgs(tx_0, nft404);

    expect(events_0).to.be.lengthOf(10);

    // All the IDs minted
    const nftId = events_0.map((event_) => event_.id);

    for (let i = 0; i < nftId.length; i++) {
      // None of these IDs are revealed yet
      const currentId = nftId[i];
      expect(nft404.getDnaOf(currentId)).to.be.revertedWithCustomError(
        nft404,
        "NotRevealed"
      );
    }

    const tx = await nft404.connect(automationRegistry).reveal();
    const blockHash0 = await getBlockHash(tx.blockNumber! - 1);
    const words = [BigInt(blockHash0)];

    for (let i = 0; i < nftId.length; i++) {
      // All these are already reveled
      const currentId = nftId[i];
      const dnaExpected = calculateDNA(currentId, words);

      expect(await nft404.getDnaOf(currentId)).to.be.equals(
        dnaExpected,
        "not the correct DNA generated"
      );

      // 5 variant counts for each variant (only example);
      const variantsCounters = dnaParams.variants_name.map(() => 5n);

      // Pre-calculate the dna decoded
      const expectedJsonString = dnaToJsonString(
        dnaParams.variants_name,
        variantsCounters,
        dnaParams.schema_hash,
        dnaExpected
      );

      // From DNA contract
      const dnaDecoded = await nft404.dnaOfToJson(currentId, variantsCounters);

      expect(expectedJsonString).to.be.equals(dnaDecoded);
    }
  });
});
