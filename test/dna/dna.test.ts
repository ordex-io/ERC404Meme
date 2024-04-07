import { expect } from "chai";
// import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { calculateDNA, dnaToJsonString, nonDuplicateDNA } from "../utils";
import { ethers } from "hardhat";

describe("DNA Tests", () => {
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

  it("should generate the JSON string correctly", async () => {
    const schema_hash = ethers.randomBytes(32);
    const variants_name = ["head", "hat", "background", "eyes"];

    const factory = await ethers.getContractFactory("DNAMock");

    let contract = await factory.deploy(schema_hash, variants_name);
    await contract.waitForDeployment();

    const id_0 = BigInt(ethers.concat([ethers.randomBytes(32)]));

    const randomWords_0 = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    await contract.setWordsForIDs([id_0], randomWords_0);

    let expectedDNA_0 = calculateDNA(id_0, randomWords_0);

    expect(await contract.dnaOf(id_0)).to.be.equals(expectedDNA_0);

    // 5 variant counts for each variant (only example);
    const variantsCounters = variants_name.map(() => 5n);

    // Pre-calculate the dna decoded
    const expectedJsonString = dnaToJsonString(
      variants_name,
      variantsCounters,
      schema_hash,
      expectedDNA_0
    );

    // From DNA contract
    const dnaDecoded = await contract.dnaOfToJson(id_0, variantsCounters);

    expect(expectedJsonString).to.be.equals(dnaDecoded);
  });

  it("should revert dnaOf if an ID does not have words");

  it("should revert dnaOfToJson if an ID does not have words");
});
