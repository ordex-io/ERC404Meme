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
  const tokenAddress = "0xFF07D6C3f56d0ce87f8Ed17C25747af7aE365308";
  const PET404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  // const token = await getERC20(tokenAddress, signer);
  // const pet404 = await getDiamondPET404(PET404Address, signer);

  // (0.05, 0.3, 1, 0.01)
  const fee = FeeAmount.MEDIUM; // (0.3)

  const uniswapAddresses = readAddresses(chainId);

  const uniswapFactory = await getUniswapFactory(
    uniswapAddresses.UniswapV3Factory,
    signer
  );

  // Initialize with (1:404)
  const price = encodePriceSqrt(1, 1);

  // Create the pool
  const poolAddress = await createPool(
    uniswapFactory,
    tokenAddress,
    PET404Address,
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
