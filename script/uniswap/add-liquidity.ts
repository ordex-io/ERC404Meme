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
  const poolAddress = "0x5806517Eb02316E30e8ffDB53dbd1d08B9794E2a";
  const tokenAddress = "0x16437045d8d169a9819f40cc79e959401B651896";
  const PET404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const token = await getERC20(tokenAddress, signer);
  const pet404 = await getDiamondPET404(PET404Address, signer);

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
  // The amounts can be setted manually, this is for simplicity
  const amountPet404 = (await pet404.units()) * 10000n; // Amount to get around 10000 NFTs
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
    token1Decimals,
    pet404Decimals,
    tokenAddress,
    PET404Address,
    amountToken,
    amountPet404,
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
