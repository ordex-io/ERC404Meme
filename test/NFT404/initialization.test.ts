import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployNFT404 } from "../utils";

describe.only("NFT404", () => {
  it("Initialize the contract", async () => {
    const { nft404, erc404Params } = await loadFixture(deployNFT404);

    BigInt(erc404Params.maxTotalSupplyERC721);
    const units = 10n ** BigInt(erc404Params.decimals);
    const totalSupplyExpected =
      BigInt(erc404Params.maxTotalSupplyERC721) * units;

    expect(await nft404.totalSupply()).to.be.equals(totalSupplyExpected);

    expect(await nft404.erc721TotalSupply()).to.be.equals(
      0n,
      "Initial NFT minted"
    );
  });
});
