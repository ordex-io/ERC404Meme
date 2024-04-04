import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployNFT404 } from "../utils";

describe.only("NFT404", () => {
  it("should initialize the contract correctly", async () => {
    const { nft404, erc404Params } = await loadFixture(deployNFT404);

    expect(await nft404.units()).to.be.equals(
      erc404Params.units,
      "wrong units in the contract"
    );

    expect(await nft404.totalSupply()).to.be.equals(
      erc404Params.maxTotalSupplyERC20,
      "wrong erc20 total supply"
    );

    expect(
      await nft404.balanceOf(erc404Params.initialMintRecipient)
    ).to.be.equals(
      erc404Params.maxTotalSupplyERC20,
      "wrong balance assigned to initial minter"
    );

    expect(await nft404.erc721TotalSupply()).to.be.equals(
      0n,
      "Initial NFT minted"
    );
  });
});
