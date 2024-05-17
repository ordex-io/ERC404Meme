import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { deployUniswapPool } from "../utils";
import { getERC721TransfersEventsArgs, getTimeStamp } from "../../utils";
import { ISwapRouter } from "../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter";

describe("PET404 - Uniswap transactions", () => {
  describe("Buys using uniswap", () => {
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

  describe("Sells using uniswap", () => {
    it("should sell fraction from full NFT and buy again", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const {
        diamondContract: PET404Contract,
        pet404Facet,
        ownerSigner,
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

      // Mint a full token for PET404 to alice
      const pet404amout = await PET404Contract.units(); // 1 full token

      const txMint = await PET404Contract.connect(ownerSigner)[
        "mintERC20(address,uint256)"
      ](alice.address, pet404amout);

      const events721 = await getERC721TransfersEventsArgs(txMint, pet404Facet);
      expect(events721.length).to.be.equal(1);
      const { id: nftId } = events721[0];

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout
      );
      // And also get one NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);
      // Personal vault should be empty
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Make a swap to "sell" a fraction
      const fractionAmount = (await PET404Contract.units()) / 10n; // 0.1
      const receiverAddress = alice.address;
      const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test

      // Approve swap router to handle the tokens
      await PET404Contract.connect(alice).approve(
        await swapRouter.getAddress(),
        fractionAmount
      );

      const argsIn: ISwapRouter.ExactInputSingleParamsStruct = {
        tokenIn: await PET404Contract.getAddress(),
        tokenOut: await erc20Token.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline,
        amountIn: fractionAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactInputSingle(argsIn);

      // Should lost the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout - fractionAmount
      );
      // And also lost the ownership of a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );
      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );
      // Tokens should be stored on personal vault
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(1);

      // Buy to get a full NFT again
      // Mint ERC20 tokens
      const amount0 = ethers.parseUnits("1000000", 18); // 1 million
      await erc20Token.connect(alice).mint(amount0);

      // Make a swap to "buy" a fraction
      const deadline1 = (await getTimeStamp()) + 100000; // +100000 just for sake of test
      const amountInMaximum = await erc20Token.balanceOf(alice.address);
      const oldPet404Balance = await PET404Contract.balanceOf(alice.address);

      // Approve swap router to handle the tokens
      await erc20Token
        .connect(alice)
        .approve(await swapRouter.getAddress(), amountInMaximum);

      const argsOut: ISwapRouter.ExactOutputSingleParamsStruct = {
        tokenIn: await erc20Token.getAddress(),
        tokenOut: await PET404Contract.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline1,
        amountOut: fractionAmount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactOutputSingle(argsOut);

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        oldPet404Balance + fractionAmount
      );
      // And get a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      // And should be the exact nft from the personal vault
      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);

      // Tokens should be picked from personal vault
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);
    });

    it("should sell fraction from full NFT and receive a transfer from other source", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const {
        diamondContract: PET404Contract,
        pet404Facet,
        ownerSigner,
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

      // Mint a full token for PET404 to alice
      const pet404amout = await PET404Contract.units(); // 1 full token

      const txMint = await PET404Contract.connect(ownerSigner)[
        "mintERC20(address,uint256)"
      ](alice.address, pet404amout);

      const events721 = await getERC721TransfersEventsArgs(txMint, pet404Facet);
      expect(events721.length).to.be.equal(1);
      const { id: nftId } = events721[0];

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout
      );
      // And also get one NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);
      // Personal vault should be empty
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Make a swap to "sell" a fraction
      const fractionAmount = (await PET404Contract.units()) / 10n; // 0.1
      const receiverAddress = alice.address;
      const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test

      // Approve swap router to handle the tokens
      await PET404Contract.connect(alice).approve(
        await swapRouter.getAddress(),
        fractionAmount
      );

      const argsIn: ISwapRouter.ExactInputSingleParamsStruct = {
        tokenIn: await PET404Contract.getAddress(),
        tokenOut: await erc20Token.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline,
        amountIn: fractionAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactInputSingle(argsIn);

      // Should lost the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout - fractionAmount
      );
      // And also lost the ownership of a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );
      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );
      // Tokens should be stored on personal vault
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(1);

      // Receive a PET404 transfer to get units require to get a NFT
      const oldPet404Balance = await PET404Contract.balanceOf(alice.address);
      await PET404Contract.connect(ownerSigner)["mintERC20(address,uint256)"](
        alice.address,
        fractionAmount
      );

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        oldPet404Balance + fractionAmount
      );
      // And get a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      // And should be the exact nft from the personal vault
      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);

      // Tokens should be picked from personal vault
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);
    });

    it("should sell full NFT leaving zero balance and buy again", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const {
        diamondContract: PET404Contract,
        pet404Facet,
        ownerSigner,
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

      // Mint a full token for PET404 to alice
      const pet404amout = await PET404Contract.units(); // 1 full token

      const txMint = await PET404Contract.connect(ownerSigner)[
        "mintERC20(address,uint256)"
      ](alice.address, pet404amout);

      const events721 = await getERC721TransfersEventsArgs(txMint, pet404Facet);
      expect(events721.length).to.be.equal(1);
      const { id: nftId } = events721[0];

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout
      );
      // And also get one NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);
      // Personal vault should be empty
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Make a swap to "sell" a fraction
      const fractionAmount = await PET404Contract.units(); // 1 full token
      const receiverAddress = alice.address;
      const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test

      // Approve swap router to handle the tokens
      await PET404Contract.connect(alice).approve(
        await swapRouter.getAddress(),
        fractionAmount
      );

      const argsIn: ISwapRouter.ExactInputSingleParamsStruct = {
        tokenIn: await PET404Contract.getAddress(),
        tokenOut: await erc20Token.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline,
        amountIn: fractionAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactInputSingle(argsIn);

      // Should lost all the tokens (zero balance)
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(0);
      // And also lost the ownership of a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );
      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );
      // NFT should be burnt
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Buy to get a full NFT again
      // Mint ERC20 tokens
      const amount0 = ethers.parseUnits("1000000", 18); // 1 million
      await erc20Token.connect(alice).mint(amount0);

      // Make a swap to "buy" a fraction
      const deadline1 = (await getTimeStamp()) + 100000; // +100000 just for sake of test
      const amountInMaximum = await erc20Token.balanceOf(alice.address);
      const oldPet404Balance = await PET404Contract.balanceOf(alice.address);

      // Approve swap router to handle the tokens
      await erc20Token
        .connect(alice)
        .approve(await swapRouter.getAddress(), amountInMaximum);

      const argsOut: ISwapRouter.ExactOutputSingleParamsStruct = {
        tokenIn: await erc20Token.getAddress(),
        tokenOut: await PET404Contract.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline1,
        amountOut: fractionAmount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      const txSwap2 = await swapRouter
        .connect(alice)
        .exactOutputSingle(argsOut);

      const events721_2 = await getERC721TransfersEventsArgs(
        txSwap2,
        pet404Facet
      );
      expect(events721_2.length).to.be.equal(1);
      const { id: nftId_2 } = events721_2[0];

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        oldPet404Balance + fractionAmount
      );
      // And get  NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      // And should be a new one
      expect(await PET404Contract.ownerOf(nftId_2)).to.be.equal(alice.address);
      // The old one was burnt
      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );

      // Personal vault remains the same
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);
    });

    it("should sell full NFT leaving non zero balance and buy again", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const {
        diamondContract: PET404Contract,
        pet404Facet,
        ownerSigner,
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

      // Mint a full token for PET404 to alice
      const pet404amout = ((await PET404Contract.units()) / 10n) * 15n; // 1.5 token

      const txMint = await PET404Contract.connect(ownerSigner)[
        "mintERC20(address,uint256)"
      ](alice.address, pet404amout);

      const events721 = await getERC721TransfersEventsArgs(txMint, pet404Facet);
      expect(events721.length).to.be.equal(1);
      const { id: nftId } = events721[0];

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout
      );
      // And also get one NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);
      // Personal vault should be empty
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Make a swap to "sell" a fraction
      const fractionAmount = await PET404Contract.units(); // 1 full token
      const receiverAddress = alice.address;
      const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test

      // Approve swap router to handle the tokens
      await PET404Contract.connect(alice).approve(
        await swapRouter.getAddress(),
        fractionAmount
      );

      const argsIn: ISwapRouter.ExactInputSingleParamsStruct = {
        tokenIn: await PET404Contract.getAddress(),
        tokenOut: await erc20Token.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline,
        amountIn: fractionAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      await swapRouter.connect(alice).exactInputSingle(argsIn);

      // Should lost the tokens (remain 0.5)
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout - fractionAmount
      );
      expect(await PET404Contract.balanceOf(alice.address)).to.be.not.equal(0);

      // And also lost the ownership of a NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );
      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );
      // NFT should be burnt
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Buy to get a full NFT again
      // Mint ERC20 tokens
      const amount0 = ethers.parseUnits("1000000", 18); // 1 million
      await erc20Token.connect(alice).mint(amount0);

      // Make a swap to "buy" a fraction
      const deadline1 = (await getTimeStamp()) + 100000; // +100000 just for sake of test
      const amountInMaximum = await erc20Token.balanceOf(alice.address);
      const oldPet404Balance = await PET404Contract.balanceOf(alice.address);

      // Approve swap router to handle the tokens
      await erc20Token
        .connect(alice)
        .approve(await swapRouter.getAddress(), amountInMaximum);

      const argsOut: ISwapRouter.ExactOutputSingleParamsStruct = {
        tokenIn: await erc20Token.getAddress(),
        tokenOut: await PET404Contract.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline1,
        amountOut: fractionAmount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      const txSwap2 = await swapRouter
        .connect(alice)
        .exactOutputSingle(argsOut);

      const events721_2 = await getERC721TransfersEventsArgs(
        txSwap2,
        pet404Facet
      );
      expect(events721_2.length).to.be.equal(1);
      const { id: nftId_2 } = events721_2[0];

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        oldPet404Balance + fractionAmount
      );
      // And get  NFT
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      // And should be a new one
      expect(await PET404Contract.ownerOf(nftId_2)).to.be.equal(alice.address);
      // The old one was burnt
      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );

      // Personal vault remains the same
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);
    });

    it("should sell fraction from multiple NFTs and buy again", async () => {
      const { PET404ContractsData, Uniswap } = await loadFixture(
        deployUniswapPool
      );

      const {
        diamondContract: PET404Contract,
        pet404Facet,
        ownerSigner,
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

      // Mint a full token for PET404 to alice
      const nftsToMint = 5n;
      const pet404amout = (await PET404Contract.units()) * nftsToMint; // 5 token

      const txMint = await PET404Contract.connect(ownerSigner)[
        "mintERC20(address,uint256)"
      ](alice.address, pet404amout);

      const events721 = await getERC721TransfersEventsArgs(txMint, pet404Facet);
      expect(events721.length).to.be.equal(nftsToMint);

      // Should get the PET404 amount
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout
      );
      // And also get NFTs
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        nftsToMint
      );
      // Personal vault should be empty
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Check all the NFTs minted
      for (let i = 0; i < events721.length; i++) {
        const { id: nftId } = events721[i];
        expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);
      }

      // Make a swap to "sell" a fraction
      const fractionAmount = ((await PET404Contract.units()) / 10n) * 15n; // 1.5 full token
      const receiverAddress = alice.address;
      const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test

      // Approve swap router to handle the tokens
      await PET404Contract.connect(alice).approve(
        await swapRouter.getAddress(),
        fractionAmount
      );

      const argsIn: ISwapRouter.ExactInputSingleParamsStruct = {
        tokenIn: await PET404Contract.getAddress(),
        tokenOut: await erc20Token.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline,
        amountIn: fractionAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      const txSwap1 = await swapRouter.connect(alice).exactInputSingle(argsIn);

      // Should lost the tokens (remain 3.5)
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout - fractionAmount
      );
      // One NFT should be burnt, one goes to personal vault
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(1);

      const events721_1 = await getERC721TransfersEventsArgs(
        txSwap1,
        pet404Facet
      );
      expect(events721_1.length).to.be.equal(2);

      // And also lost the ownership of some NFTs
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        nftsToMint - BigInt(events721_1.length)
      );

      // Check all the NFTs lost
      for (let i = 0; i < events721_1.length; i++) {
        const { id: nftId } = events721_1[i];
        expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
          pet404Facet,
          "NotFound"
        );
      }

      // Buy to get full NFTs again
      // Mint ERC20 tokens
      const amount0 = ethers.parseUnits("1000000", 18); // 1 million
      await erc20Token.connect(alice).mint(amount0);

      // Make a swap to "buy" a fraction
      const deadline1 = (await getTimeStamp()) + 100000; // +100000 just for sake of test
      const amountInMaximum = await erc20Token.balanceOf(alice.address);
      const oldPet404Balance = await PET404Contract.balanceOf(alice.address);

      // Approve swap router to handle the tokens
      await erc20Token
        .connect(alice)
        .approve(await swapRouter.getAddress(), amountInMaximum);

      const argsOut: ISwapRouter.ExactOutputSingleParamsStruct = {
        tokenIn: await erc20Token.getAddress(),
        tokenOut: await PET404Contract.getAddress(),
        fee,
        recipient: receiverAddress,
        deadline: deadline1,
        amountOut: fractionAmount,
        amountInMaximum,
        sqrtPriceLimitX96: 0,
      };

      // Send the swap
      const txSwap2 = await swapRouter
        .connect(alice)
        .exactOutputSingle(argsOut);

      // Should get the tokens
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        oldPet404Balance + fractionAmount
      );
      // And get NFTs
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        5
      );
      // should get one from personal vault and mint a new one
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      const events721_2 = await getERC721TransfersEventsArgs(
        txSwap2,
        pet404Facet
      );
      expect(events721_2.length).to.be.equal(2);

      // Check all the NFTs obtained
      for (let i = 0; i < events721_2.length; i++) {
        const { id: nftId } = events721_2[i];
        expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);
      }

      // Get the old/burn ID
      const { id: oldNftId } = events721_2.find((item_) => {
        const index = events721_1.findIndex(
          (oldItem_) => item_.id == oldItem_.id
        );

        if (index == -1) {
          return false;
        } else {
          return true;
        }
      })!;

      // The old one was burnt
      expect(PET404Contract.ownerOf(oldNftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );
    });
  });

  describe("Exemption adddresses", () => {
    it("should transfer normally to and from exemption addresses", async () => {
      const { PET404ContractsData } = await loadFixture(deployUniswapPool);

      const {
        diamondContract: PET404Contract,
        pet404Facet,
        ownerSigner,
      } = PET404ContractsData;

      const [, alice, bob] = await ethers.getSigners();

      // Init states
      expect(await PET404Contract.erc721TransferExempt(alice.address)).to.be
        .false;
      expect(await PET404Contract.erc721TransferExempt(bob.address)).to.be
        .false;

      // ERC404
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(0);
      expect(await PET404Contract.balanceOf(bob.address)).to.be.equal(0);

      // Bob set him self as transfer exemption
      await PET404Contract.connect(bob).setSelfERC721TransferExempt(true);

      expect(await PET404Contract.erc721TransferExempt(bob.address)).to.be.true;

      // Mint a full token for PET404 to alice
      const pet404amout = await PET404Contract.units(); // 1 full token

      const txMint = await PET404Contract.connect(ownerSigner)[
        "mintERC20(address,uint256)"
      ](alice.address, pet404amout);

      // It should get the correct amounts and values
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout
      );
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // Get ERC721transfer events
      const events721 = await getERC721TransfersEventsArgs(txMint, pet404Facet);

      expect(events721.length).to.be.equal(1);

      // We get the ID
      const { id: nftId } = events721[0];

      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);

      // Send the whole token to bob
      await PET404Contract.connect(alice).transfer(bob.address, pet404amout);

      // Moved the tokens from alice to bob
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(0);
      expect(await PET404Contract.balanceOf(bob.address)).to.be.equal(
        pet404amout
      );

      // None of the accoutn should have NFTS
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        0
      );
      expect(await PET404Contract.erc721BalanceOf(bob.address)).to.be.equal(0);

      // And alice should have his ID on personal vault
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(1);

      // The NFT is not under the ownership of Alice
      expect(PET404Contract.ownerOf(nftId)).to.be.revertedWithCustomError(
        pet404Facet,
        "NotFound"
      );

      // Send back the amount
      await PET404Contract.connect(bob).transfer(alice.address, pet404amout);

      // Moved the tokens from bob to alice again
      expect(await PET404Contract.balanceOf(alice.address)).to.be.equal(
        pet404amout
      );
      expect(await PET404Contract.balanceOf(bob.address)).to.be.equal(0);

      // Alice get his NFT back
      expect(await PET404Contract.erc721BalanceOf(alice.address)).to.be.equal(
        1
      );
      expect(await PET404Contract.erc721BalanceOf(bob.address)).to.be.equal(0);

      // Using the ID from the alice personal vault
      expect(
        await PET404Contract.getERC721QueueLength(alice.address)
      ).to.be.equal(0);

      // The NFT is ownership of Alice
      expect(await PET404Contract.ownerOf(nftId)).to.be.equal(alice.address);
    });
  });
});
