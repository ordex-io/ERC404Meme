import { ethers } from "hardhat";
import {
  addLiquidityToPool,
  approveTokens,
  checkBalances,
  getDiamondPET404,
  getERC20,
  getNonfungiblePositionManager,
  setAddressesAsExempt,
} from "../../utils";
import { readAddresses } from "./util";
import { FeeAmount } from "@uniswap/v3-sdk";

async function main() {
  const [signer] = await ethers.getSigners();

  // Addresses
  const chainId = (await signer.provider.getNetwork()).chainId;
  const uniswapAddresses = readAddresses(chainId);

  // Instanes
  const poolAddress = "0xfb402ac4215DBcCEc8FC49998B6843CcAFc8Ec8E"; //
  const tokenAddress = "0x696c7C5D1CbADA46c6E587826a3AE75B58D3CA9F";
  const PET404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const token = await getERC20(tokenAddress, signer);
  const pet404 = await getDiamondPET404(PET404Address, signer);

  const tx = await pet404.setERC721TransferExempt(poolAddress, true);
  await tx.wait();

  // Set addresses as transfer exemptions
  await setAddressesAsExempt(pet404, signer, [
    uniswapAddresses.NonfungiblePositionManager,
    uniswapAddresses.SwapRouter,
    poolAddress,
  ]);

  const positionManager = await getNonfungiblePositionManager(
    uniswapAddresses.NonfungiblePositionManager,
    signer
  );

  // Config for adding liquidity
  const fee = FeeAmount.MEDIUM; // (0.3) - The same as our pool
  const positMangAddr = await positionManager.getAddress();
  const token1Decimals = await token.decimals();
  const pet404Decimals = await pet404.decimals();
  const amountPet404 = 100000000n * (await pet404.units());
  const amountToken = amountPet404 / 404n;

  // Check balances
  await checkBalances(pet404, signer.address, amountPet404);
  await checkBalances(token, signer.address, amountToken);

  // Approve the tokens
  await approveTokens(pet404, signer, amountPet404, positMangAddr);
  await approveTokens(token, signer, amountToken, positMangAddr);

  // Add liquidity to the pool
  await addLiquidityToPool(
    poolAddress,
    signer,
    chainId,
    pet404Decimals,
    token1Decimals,
    PET404Address,
    tokenAddress,
    amountPet404,
    amountToken,
    fee,
    await positionManager.getAddress()
  );
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
