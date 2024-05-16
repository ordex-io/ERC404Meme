import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { deployUniswapPool } from "../utils";
import {
  getERC721TransfersEventsArgs,
  // calculateDNA,
  // getBlockHash,
  getTimeStamp,
} from "../../utils";
import { ISwapRouter } from "../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter";

describe.only("PET404 - Uniswap transactions", () => {
  describe.only("Buys using uniswap", () => {
    it("should buy fraction from zero balance", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const { diamondContract: PET404Contract } = PET404ContractsData;
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

    it("should buy fraction from non zero balance to make full NFT", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const { diamondContract: PET404Contract, ownerSigner } =
        PET404ContractsData;
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

      // Mint a fraction for PET404 to alice
      const fractionToMint = ((await PET404Contract.units()) / 10n) * 8n; // 0.8

      await PET404Contract.connect(ownerSigner)["mintERC20(address,uint256)"](
        alice.address,
        fractionToMint
      );

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        fractionToMint
      );
      // But not get NFT yet
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );

      // Make a swap to "buy" a fraction
      const fractionAmount = (await PET404Contract.units()) / 2n; // 0.2
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

      // Should get the tokens and complete the units
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        fractionToMint + fractionAmount
      );
      // And since complete the units, get an NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
    });

    it("should buy one full NFT from zero balance", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const { diamondContract: PET404Contract } = PET404ContractsData;
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
      const pet404Amount = await PET404Contract.units(); // 1 full token
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
        amountOut: pet404Amount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactOutputSingle(argsOut);

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404Amount
      );
      // And get a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
    });

    it("should buy one full NFT from non zero balance", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const { diamondContract: PET404Contract, ownerSigner } =
        PET404ContractsData;
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

      // Mint a fraction for PET404 to alice
      const fractionToMint = ((await PET404Contract.units()) / 10n) * 8n; // 0.8

      await PET404Contract.connect(ownerSigner)["mintERC20(address,uint256)"](
        alice.address,
        fractionToMint
      );

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        fractionToMint
      );
      // But not get NFT yet
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );

      // Make a swap to "buy" a fraction
      const pet404Amount = await PET404Contract.units(); // 1 full token
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
        amountOut: pet404Amount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactOutputSingle(argsOut);

      // Should get the tokens and complete the units
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        fractionToMint + pet404Amount
      );
      // And since complete the units, get an NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
    });

    it("should get NFT not revealed after obtain tokens after swap/buy", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const {
        diamondContract: PET404Contract,
        ownerSigner,
        pet404Facet,
        dnaFacet,
      } = PET404ContractsData;
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

      // Mint a fraction for PET404 to alice
      const fractionToMint = ((await PET404Contract.units()) / 10n) * 8n; // 0.8

      await PET404Contract.connect(ownerSigner)["mintERC20(address,uint256)"](
        alice.address,
        fractionToMint
      );

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        fractionToMint
      );
      // But not get NFT yet
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );

      // Make a swap to "buy" a fraction
      const fractionAmount = (await PET404Contract.units()) / 2n; // 0.2
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
      const txSwap = await swapRouter.connect(alice).exactOutputSingle(argsOut);

      // Should get the tokens and complete the units
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        fractionToMint + fractionAmount
      );
      // And since complete the units, get an NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );

      // Get ERC721transfer events
      const events721 = await getERC721TransfersEventsArgs(txSwap, pet404Facet);

      // We get the ID
      const { id: nftId0 } = events721[0];

      // It should not be revealed yet
      expect(PET404Contract.dnaOf(nftId0)).to.be.revertedWithCustomError(
        dnaFacet,
        "NotRevealed"
      );
    });

    it("should buy multiple full NFTs", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const {
        diamondContract: PET404Contract,
        pet404Facet,
        dnaFacet,
      } = PET404ContractsData;
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
      const amountNfts = 15n;
      const pet404Amount = (await PET404Contract.units()) * amountNfts; // 15 full token
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
        amountOut: pet404Amount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      const txSwap = await swapRouter.connect(alice).exactOutputSingle(argsOut);

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404Amount
      );
      // And get a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        amountNfts
      );

      // CHECK THAT NEW NFT ARE NOT REVEALED
      // Get ERC721transfer events
      const events721 = await getERC721TransfersEventsArgs(txSwap, pet404Facet);

      // Should mint the correct amount of NFTS (15 nfts)
      expect(events721.length).to.be.equal(amountNfts);

      // Iterate over all erc721 events to get the IDs
      for (let i = 0; i < events721.length; i++) {
        // Get the ID
        const { id: nftId } = events721[i];

        // None token should be revelead yet
        expect(PET404Contract.dnaOf(nftId)).to.be.revertedWithCustomError(
          dnaFacet,
          "NotRevealed"
        );
      }
    });
  });
  xdescribe("Sells using uniswap", () => {
    //
    it("Sell fraction from 1 full NFT", async () => {
      const l = await loadFixture(deployUniswapPool);
    });
  });
});
