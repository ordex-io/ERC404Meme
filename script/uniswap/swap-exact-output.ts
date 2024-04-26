import { ethers } from "hardhat";
import {
  getDiamondPET404,
  getERC20,
  getSwapRouter,
  getTimeStamp,
} from "../../utils";
import { readAddresses } from "./util";
import { FeeAmount } from "@uniswap/v3-sdk";
import { ISwapRouter } from "../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter";

async function main() {
  const [signer, signer2] = await ethers.getSigners();
  // Addresses
  const chainId = (await signer.provider.getNetwork()).chainId;
  const uniswapAddresses = readAddresses(chainId);

  // Instances

  const tokenAddress = "0x16437045d8d169a9819f40cc79e959401B651896";
  const PET404Address = "0x36983711f9C4869F0B9BEb2Cf677814bb40d41c5";
  const token = await getERC20(tokenAddress, signer);
  const pet404 = await getDiamondPET404(PET404Address, signer);

  const swapRouter = await getSwapRouter(uniswapAddresses.SwapRouter, signer);

  // #ARGS
  // The address that will receive the tokens after swap
  const fee = FeeAmount.MEDIUM; // (0.3) - The same as our pool
  const deadline = (await getTimeStamp()) + 10000; // +10000 to make sure that accept (not for production)
  const receiver = signer2.address;
  const amountOut = await pet404.units();
  const amountInMaximum = await token.balanceOf(signer.address); // We approve all our tokens (Caution: always check on production)

  // Approve the swap router to handle the signer tokens
  const tx = await token
    .connect(signer)
    .approve(await swapRouter.getAddress(), amountInMaximum);
  await tx.wait();

  const args: ISwapRouter.ExactOutputSingleParamsStruct = {
    tokenIn: tokenAddress,
    tokenOut: PET404Address,
    fee: fee,
    recipient: receiver,
    deadline: deadline,
    amountOut: amountOut,
    amountInMaximum: amountInMaximum,
    sqrtPriceLimitX96: 0,
  };

  console.log("Sending swap...");
  const txSwap = await swapRouter.connect(signer).exactOutputSingle(args);
  console.log("Swap tx hash: ", txSwap.hash);
  await txSwap.wait();
  console.log("Swap completed");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
