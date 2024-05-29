import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { calculateDNA, dnaToJsonString, nonDuplicateDNA } from "../../utils";
import { ethers } from "hardhat";

describe("DNA Tests", () => {
  async function deployDnaMock() {
    const schema_hash = ethers.randomBytes(32).toString();
    const variants_name = ["head", "hat", "background", "eyes"];

    const factory = await ethers.getContractFactory("DNAMock");
    const contract = await factory.deploy(schema_hash, variants_name);
    await contract.waitForDeployment();

    return {
      contract,
      deployArg: {
        schema_hash,
        variants_name,
      },
    };
  }

  it("should generate the DNA bytes correctly for ID/words saved", async () => {
    const { contract } = await loadFixture(deployDnaMock);

    const ids = Array.from({ length: 4 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    const randomWords = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    await contract.setWordsForIDs(ids, randomWords);

    const allDnas = [];

    for (let i = 0; i < ids.length; i++) {
      const currentId = ids[i];
      const expectedDNA = calculateDNA(currentId, randomWords);

      allDnas.push(expectedDNA);

      expect(await contract.dnaOf(currentId)).to.be.equals(expectedDNA);
    }

    expect(nonDuplicateDNA(allDnas), "there are duplicated DNA").to.be.true;
  });

  it("should generate the DNA bytes correctly for ID/words saved multiple times", async () => {
    const { contract } = await loadFixture(deployDnaMock);

    const allDnas = [];

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
      const expectedDNA = calculateDNA(currentId, randomWords_0);
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
      const expectedDNA = calculateDNA(currentId, randomWords_1);

      allDnas.push(expectedDNA);

      expect(await contract.dnaOf(currentId)).to.be.equals(expectedDNA);
    }

    expect(nonDuplicateDNA(allDnas), "there are duplicated DNA").to.be.true;
  });

  it("should generate the JSON string correctly", async () => {
    const {
      contract,
      deployArg: { variants_name, schema_hash },
    } = await loadFixture(deployDnaMock);

    const id_0 = BigInt(ethers.concat([ethers.randomBytes(32)]));

    const randomWords_0 = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    await contract.setWordsForIDs([id_0], randomWords_0);

    const expectedDNA_0 = calculateDNA(id_0, randomWords_0);

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

  it("should revert dnaOf if an ID does not have words", async () => {
    const { contract } = await loadFixture(deployDnaMock);

    // ID of the 404-NFT
    const id_0 = BigInt(ethers.concat([ethers.randomBytes(32)]));

    // Random words to be used
    const randomWords_0 = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    // Calculated DNA using the ID and words
    const expectedDNA_0 = calculateDNA(id_0, randomWords_0);

    // No IDs have words saved yet
    expect(contract.dnaOf(id_0)).to.be.revertedWithCustomError(
      contract,
      "NotRevealed"
    );

    // Assign words for the ids on the mock
    await contract.setWordsForIDs([id_0], randomWords_0);

    // Now the DNA can be obtained
    expect(await contract.dnaOf(id_0)).to.be.equals(expectedDNA_0);
  });

  it("should revert dnaOfToJson if an ID does not have words", async () => {
    const {
      contract,
      deployArg: { variants_name, schema_hash },
    } = await loadFixture(deployDnaMock);

    // ID of the 404-NFT
    const id_0 = BigInt(ethers.concat([ethers.randomBytes(32)]));

    // 5 variant counts for each variant (only example);
    const variantsCounters = variants_name.map(() => 5n);

    // Random words to be used
    const randomWords_0 = Array.from({ length: 5 }).map(() => {
      return BigInt(ethers.concat([ethers.randomBytes(32)]));
    });

    // Calculated DNA using the ID and words
    const expectedDNA_0 = calculateDNA(id_0, randomWords_0);

    // Pre-calculate the dna decoded
    const expectedJsonString = dnaToJsonString(
      variants_name,
      variantsCounters,
      schema_hash,
      expectedDNA_0
    );

    // No IDs have words saved yet
    expect(contract.dnaOf(id_0)).to.be.revertedWithCustomError(
      contract,
      "NotRevealed"
    );
    expect(
      contract.dnaOfToJson(id_0, variantsCounters)
    ).to.be.revertedWithCustomError(contract, "NotRevealed");

    // Assign words for the ids on the mock
    await contract.setWordsForIDs([id_0], randomWords_0);

    // Now the DNA can be obtained
    expect(await contract.dnaOf(id_0)).to.be.equals(expectedDNA_0);
    expect(expectedJsonString).to.be.equals(
      await contract.dnaOfToJson(id_0, variantsCounters)
    );
  });
});
