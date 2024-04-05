import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployNFT404 } from "../utils";
import {
  deployUniswapV3Factory,
  deployWeth,
  deployNonfungiblePositionManager,
  deploySwapRouter,
} from "../utils/deploy";

describe("Uniswap", () => {
  it("Add Uniswap contract to Exempt", async () => {
    const { nft404, nft404Address, owner, erc404Params, nft404Params } =
      await loadFixture(deployNFT404);

    const uniswapFactory = await deployUniswapV3Factory();
    const tokenWeth = await deployWeth();

    const nfPositionManager = await deployNonfungiblePositionManager(
      uniswapFactory,
      tokenWeth
    );

    const swapRouter = await deploySwapRouter(uniswapFactory, tokenWeth);

    await uniswapFactory.createPool(
      nft404Address,
      await tokenWeth.getAddress(),
      100n
    );

    const pool_0 = await uniswapFactory.getPool(
      nft404Address,
      await tokenWeth.getAddress(),
      100n
    );

    // Add the address as Exempt using the owner address
    await nft404.connect(owner).setERC721TransferExempt(pool_0, true);
    await nft404
      .connect(owner)
      .setERC721TransferExempt(await uniswapFactory.getAddress(), true);
    await nft404
      .connect(owner)
      .setERC721TransferExempt(await nfPositionManager.getAddress(), true);
    await nft404
      .connect(owner)
      .setERC721TransferExempt(await swapRouter.getAddress(), true);

    expect(await nft404.erc721TransferExempt(uniswapFactory)).to.be.true;
    expect(await nft404.erc721TransferExempt(nfPositionManager)).to.be.true;
    expect(await nft404.erc721TransferExempt(swapRouter)).to.be.true;
    expect(await nft404.erc721TransferExempt(pool_0)).to.be.true;

    const amountNfts_0 = 100n;
    const amount_0 = BigInt(erc404Params.units) * amountNfts_0;

    const balanceBefore = await nft404.balanceOf(
      nft404Params.initialMintRecipient
    );

    await nft404.transfer(pool_0, amount_0);

    expect(
      await nft404.balanceOf(nft404Params.initialMintRecipient)
    ).to.be.equals(balanceBefore - amount_0);

    expect(await nft404.balanceOf(pool_0)).to.be.equals(amount_0);
    expect(await nft404.erc721BalanceOf(pool_0)).to.be.equals(0n);
  });
});
