import { ethers } from "hardhat";
import {
  createPool,
  encodePriceSqrt,
  getUniswapFactory,
  initializePool,
} from "../../utils";
import { readAddresses } from "./util";
import { FeeAmount } from "@uniswap/v3-sdk";

async function main() {
  const [signer] = await ethers.getSigners();

  // Sepolia addresses
  const chainId = (await signer.provider.getNetwork()).chainId;

  // Instance of our tokens
  const PET404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  // ERC20 tokens or others ERC404 tokens
  const tokenAddress = "0xdb33a95b2b43E76b5c00ED71776BB2e0ec7860F3";

  // (0.05, 0.3, 1, 0.01)
  const fee = FeeAmount.MEDIUM; // (0.3)

  const uniswapAddresses = readAddresses(chainId);

  const uniswapFactory = await getUniswapFactory(
    uniswapAddresses.UniswapV3Factory,
    signer
  );

  // Initialize with (404:1)
  const price = encodePriceSqrt(404, 1);

  // Create the pool
  const poolAddress = await createPool(
    uniswapFactory,
    PET404Address,
    tokenAddress,
    fee
  );

  await initializePool(poolAddress, price, signer);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
