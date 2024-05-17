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

  // Mint token to buy ERC404Meme
  const amount0 = ethers.parseUnits("1000000", 18);
  await erc20Token.connect(alice).mint(amount0);

  // Config
  const pet404Amount = await ERC404Meme.units(); // 1 full token
  const receiverAddress = alice.address;
  const deadline = (await getTimeStamp()) + 100000; // +100000 just for sake of test
  const amountInMaximum = await erc20Token.balanceOf(alice.address);

  // Approve swap router to handle the tokens
  await erc20Token
    .connect(alice)
    .approve(await swapRouter.getAddress(), amountInMaximum);

  const argsOut: ISwapRouter.ExactOutputSingleParamsStruct = {
    tokenIn: await erc20Token.getAddress(),
    tokenOut: await ERC404Meme.getAddress(),
    fee: data.Fee,
    recipient: receiverAddress,
    deadline: deadline,
    amountOut: pet404Amount,
    amountInMaximum,
    sqrtPriceLimitX96: 0,
  };

  // Send the swap
  const txSwap = await swapRouter.connect(alice).exactOutputSingle(argsOut);

  // Get ERC721transfer events
  const nftId = await getId(txSwap);

  console.log("Buy completed!");
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
