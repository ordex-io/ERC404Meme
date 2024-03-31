import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { calculateDNA } from "../utils";

describe("DNA Facet", () => {
  /**
   * Deploy a DNAExample contract
   */
  async function deployDNAExample() {
    const factory = await ethers.getContractFactory("DNAExample");
    const contract = await factory.deploy();
    // Wait for deploy
    await contract.waitForDeployment();

    return {
      contract,
    };
  }

  describe("DNA Facet", () => {
    it("should convert the values to a correct DNA", async () => {
      const { contract } = await loadFixture(deployDNAExample);

      const id_0 = 500n; // Like the NFT ID
      const words_0 = [20n, 40n, 60n, 80n, 100n]; // Like an VRF response
      const seed_0 = 80001n; // Arbitrary value. In discussion if needed (could be block number, timestamp, etc)

      expect(await contract.toDNA(id_0, words_0, seed_0)).to.be.equals(
        calculateDNA(id_0, words_0, seed_0)
      );
    });

    it("should save DNA values", async () => {
      const { contract } = await loadFixture(deployDNAExample);

      const id_0 = 1000n; // Like the NFT ID
      const words_0 = [16n, 2n, 10000n, 2000n, 50n]; // Like an VRF response
      const seed_0 = 11n; // Arbitrary value. In discussion if needed (could be block number, timestamp, etc)

      const dnaCalculated_0 = await contract.toDNA(id_0, words_0, seed_0);
      expect(dnaCalculated_0).to.be.equals(calculateDNA(id_0, words_0, seed_0));

      // The DNA Example directly save a DNA to a given ID. This is only for testing the DNA Facet
      // save process. It should not be the real process.
      await contract.saveDna(id_0, dnaCalculated_0);

      const id_1 = 5020n; // Like the NFT ID
      const words_1 = [1n, 70n, 250n, 567n, 2n]; // Like an VRF response
      const seed_1 = 12n; // Arbitrary value. In discussion if needed (could be block number, timestamp, etc)

      const dnaCalculated_1 = await contract.toDNA(id_1, words_1, seed_1);
      expect(dnaCalculated_1).to.be.equals(calculateDNA(id_1, words_1, seed_1));

      // The DNA Example directly save a DNA to a given ID. This is only for testing the DNA Facet
      // save process. It should not be the real process.
      await contract.saveDna(id_1, dnaCalculated_1);

      expect(await contract.getDnaOf(id_0)).to.be.equals(dnaCalculated_0);
      expect(await contract.getDnaOf(id_1)).to.be.equals(dnaCalculated_1);
    });

    it("should not overwrite DNA values", async () => {
      const { contract } = await loadFixture(deployDNAExample);

      const id_0 = 2000n; // Like the NFT ID
      const words_0 = [7n, 2385n, 946n, 13848134n, 6n]; // Like an VRF response
      const seed_0 = 44n; // Arbitrary value. In discussion if needed (could be block number, timestamp, etc)

      const dnaCalculated_0 = await contract.toDNA(id_0, words_0, seed_0);
      expect(dnaCalculated_0).to.be.equals(calculateDNA(id_0, words_0, seed_0));

      // The DNA Example directly save a DNA to a given ID. This is only for testing the DNA Facet
      // save process. It should not be the real process.
      await contract.saveDna(id_0, dnaCalculated_0);

      // Using the same ID but will calculate diff DNA bytes
      const id_1 = id_0;
      const words_1 = [41n, 720n, 2500n, 5367n, 121n]; // Like an VRF response
      const seed_1 = 12n; // Arbitrary value. In discussion if needed (could be block number, timestamp, etc)

      const dnaCalculated_1 = await contract.toDNA(id_1, words_1, seed_1);
      expect(dnaCalculated_1).to.be.equals(calculateDNA(id_1, words_1, seed_1));

      expect(dnaCalculated_1).to.be.not.equals(dnaCalculated_0);

      expect(
        contract.saveDna(id_1, dnaCalculated_1)
      ).to.be.revertedWithCustomError(contract, "DNAAlreadySet");
    });
  });
});
