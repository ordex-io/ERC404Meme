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
  const tokenAddress = "0x16437045d8d169a9819f40cc79e959401B651896";

  // (0.05, 0.3, 1, 0.01)
  const fee = FeeAmount.MEDIUM; // (0.3)

  const uniswapAddresses = readAddresses(chainId);

  const uniswapFactory = await getUniswapFactory(
    uniswapAddresses.UniswapV3Factory,
    signer
  );

  // Initialize with (1:404)
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
