import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { AbiCoder, keccak256 } from "ethers";

describe.only("DNA Facet", () => {
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

  describe("DNAExample", () => {
    it("should convert the values to a DNA", async () => {
      const { contract } = await loadFixture(deployDNAExample);

      const id_0 = 500n; // Like the NFT ID
      const words_0 = [20n, 40n, 60n, 80n, 100n]; // Like an VRF response
      const seed_0 = 80001n; // Arbitrary value. In discussion if needed (could be block number, timestamp, etc)

      const encoded_0 = AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256[]", "uint256"],
        [id_0, words_0, seed_0]
      );

      console.log("encoded_0: ", keccak256(encoded_0));
      console.log("call____0: ", await contract.toDNA(id_0, words_0, seed_0));
    });
    xit("should save a DNA value", async () => {
      const { contract } = await loadFixture(deployDNAExample);
    });
  });
});
