import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import {
  deployNFT404,
  getERC721TransfersEventsArgs,
  getBlockHash,
  calculateDNA,
  dnaToJsonString,
  nonDuplicateDNA,
} from "../utils";
import { ethers } from "hardhat";

describe.only("DNA Tests", () => {
  it("should generate the DNA bytes correctly for ID/words saved", async () => {
    const schema_hash = ethers.randomBytes(32);
    const variants_name = ["head", "hat", "background", "eyes"];

    const factory = await ethers.getContractFactory("DNAMock");

    let contract = await factory.deploy(schema_hash, variants_name);
    await contract.waitForDeployment();

    const ids = Array.from({ length: 4 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    const randomWords = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    await contract.setWordsForIDs(ids, randomWords);

    let allDnas = [];

    for (let i = 0; i < ids.length; i++) {
      const currentId = ids[i];
      let expectedDNA = calculateDNA(currentId, randomWords);

      allDnas.push(expectedDNA);

      expect(await contract.dnaOf(currentId)).to.be.equals(expectedDNA);
    }

    expect(nonDuplicateDNA(allDnas), "there are duplicated DNA").to.be.true;
  });

  it("should generate the DNA bytes correctly for ID/words saved multiple times", async () => {
    const schema_hash = ethers.randomBytes(32);
    const variants_name = ["head", "hat", "background", "eyes"];

    const factory = await ethers.getContractFactory("DNAMock");

    let contract = await factory.deploy(schema_hash, variants_name);
    await contract.waitForDeployment();

    let allDnas = [];

    // First batch of IDs that will use the same words (But dna should be diff)
    const ids_0 = Array.from({ length: 4 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    const randomWords_0 = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    await contract.setWordsForIDs(ids_0, randomWords_0);

    for (let i = 0; i < ids_0.length; i++) {
      const currentId = ids_0[i];
      let expectedDNA = calculateDNA(currentId, randomWords_0);
      allDnas.push(expectedDNA);

      expect(await contract.dnaOf(currentId)).to.be.equals(expectedDNA);
    }

    // Second batch of IDs that will use the same words (But dna should be diff)
    const ids_1 = Array.from({ length: 4 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    const randomWords_1 = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    await contract.setWordsForIDs(ids_1, randomWords_1);

    for (let i = 0; i < ids_1.length; i++) {
      const currentId = ids_1[i];
      let expectedDNA = calculateDNA(currentId, randomWords_1);

      allDnas.push(expectedDNA);

      expect(await contract.dnaOf(currentId)).to.be.equals(expectedDNA);
    }

    expect(nonDuplicateDNA(allDnas), "there are duplicated DNA").to.be.true;
  });
});
