import { ethers } from "hardhat";
import data from "./data.json";
import {
  getDiamondPET404,
  getSwapRouter,
  getERC20,
  getTimeStamp,
} from "../utils";
import { ISwapRouter } from "../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter";
import { getId } from "./utils";

async function main() {
  const [recipient, alice] = await ethers.getSigners();

  // Get instances
  const ERC404Meme = await getDiamondPET404(data.ERC404Meme, recipient);
  const swapRouter = await getSwapRouter(data.SwapRouter, recipient);
  const erc20Token = await getERC20(data.ERC20, recipient);

  // Config
  // Make a swap to "sell" a fraction
  const fractionAmount = (await ERC404Meme.units()) / 10n; // 0.1
  const receiverAddress = alice.address;
  const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test

  // Approve swap router to handle the tokens
  await ERC404Meme.connect(alice).approve(
    await swapRouter.getAddress(),
    fractionAmount
  );

  const argsIn: ISwapRouter.ExactInputSingleParamsStruct = {
    tokenIn: await ERC404Meme.getAddress(),
    tokenOut: await erc20Token.getAddress(),
    fee: data.Fee,
    recipient: receiverAddress,
    deadline: deadline,
    amountIn: fractionAmount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  // Send the swap
  const txSwap = await swapRouter.connect(alice).exactInputSingle(argsIn);

  // Get ERC721transfer events
  const nftId = await getId(txSwap);

  console.log("Sell completed!");
  console.log(`- See token: http://localhost:3333/api/token/${nftId}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
