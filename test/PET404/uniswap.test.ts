import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { deployFullPET404DiamondNonVrf, deployUniswapPool } from "../utils";
import {
  calculateDNA,
  getBlockHash,
  getERC721TransfersEventsArgs,
  getTimeStamp,
} from "../../utils";
import { ISwapRouter } from "../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter";

describe.only("PET404 - Uniswap transactions", () => {
  describe.only("Buys using uniswap", () => {
    it("Buy fraction from zero balance", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const { diamondContract: PET404Contract, add } = PET404ContractsData;
      const { swapRouter, erc20Token, fee } = Uniswap;

      const [, alice] = await ethers.getSigners();

      // Check that is not a transfer exemption
      expect(
        await PET404Contract.erc721TransferExempt(alice.address)
      ).to.be.equal(false);

      // Checking the inital balances of the tokens in the pool
      // ERC404
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(0);
      // ERC20
      expect(await erc20Token.balanceOf(alice.address)).to.be.equal(0);

      // Mint ERC20 tokens
      const amount0 = ethers.parseUnits("1000000", 18); // 1 million
      await erc20Token.connect(alice).mint(amount0);

      expect(await erc20Token.balanceOf(alice.address)).to.be.equal(amount0);

      // Make a swap to "buy" a fraction
      const fractionAmount = (await PET404Contract.units()) / 10n; // 0.1
      const receiverAddress = alice.address;
      const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test
      const amountInMaximum = await erc20Token.balanceOf(alice.address);

      // Approve swap router to handle the tokens
      await erc20Token
        .connect(alice)
        .approve(await swapRouter.getAddress(), amountInMaximum);

      const argsOut: ISwapRouter.ExactOutputSingleParamsStruct = {
        tokenIn: await erc20Token.getAddress(),
        tokenOut: await PET404Contract.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline,
        amountOut: fractionAmount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactOutputSingle(argsOut);

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        fractionAmount
      );
      // But since it's fraction, should not get a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );
    });
    xit("Buy fraction from non zero balance to make full NFT", async () => {
      const l = await loadFixture(deployUniswapPool);
    });
  });
  xdescribe("Sells using uniswap", () => {
    //
    it("Sell fraction from 1 full NFT", async () => {
      const l = await loadFixture(deployUniswapPool);
    });
  });
});
