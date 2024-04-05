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
    const { nft404, nft404Address } = await loadFixture(deployNFT404);

    const uniswapFactory = await deployUniswapV3Factory();
    const tokenWeth = await deployWeth();

    const nfPositionManager = await deployNonfungiblePositionManager(
      uniswapFactory,
      tokenWeth
    );

    const swapRouter = await deploySwapRouter(uniswapFactory, tokenWeth);

    expect(
      uniswapFactory.createPool(
        nft404Address,
        await tokenWeth.getAddress(),
        100n
      )
    ).to.be.not.reverted;

    const pool_0 = await uniswapFactory.getPool(
      nft404Address,
      await tokenWeth.getAddress(),
      100n
    );

    expect(await nft404.erc721TransferExempt(uniswapFactory)).to.be.true;
    expect(await nft404.erc721TransferExempt(nfPositionManager)).to.be.true;
    expect(await nft404.erc721TransferExempt(swapRouter)).to.be.true;
    expect(await nft404.erc721TransferExempt(pool_0)).to.be.true;
  });
});
