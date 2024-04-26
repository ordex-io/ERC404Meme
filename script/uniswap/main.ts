import { ethers } from "hardhat";
import {
  deployWeth,
  deployUniswapV3Factory,
  deployNonfungiblePositionManager,
  deploySwapRouter,
  deployERC20Token,
  encodePriceSqrt,
  createPool,
  initializePool,
  addLiquidityToPool,
  setAddressesAsExempt,
  checkBalances,
  approveTokens,
  getBlockNumber,
  getTimeStamp,
} from "../../utils";
import { deployFullPET404DiamondNonVrf } from "./util";

import { ISwapRouter } from "../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts/SwapRouter";

async function main() {
  const [signer, swapper, receiver] = await ethers.getSigners();

  // Deployments

  // Deploy Uniswap Factory (not necessary if network already have it)
  const uniswapFactory = await deployUniswapV3Factory();

  // WETH token (not necessary if network already have it)
  const weth = await deployWeth();

  // Position manager (not necessary if network already have it)
  const positionManager = await deployNonfungiblePositionManager(
    uniswapFactory,
    weth
  );

  // Swap router (not necessary if network already have it)
  const swapRouter = await deploySwapRouter(uniswapFactory, weth);

  // ERC20 token to use to create the pool
  const token = await deployERC20Token();

  // THe ERC404 contract
  const { diamondContract, ownerSigner } =
    await deployFullPET404DiamondNonVrf();

  // Configuration for the pool
  const token1Address = await token.getAddress();
  const erc404Address = await diamondContract.getAddress(); // token2
  // (0.05, 0.3, 1, 0.01)
  const fee = 0.3 * 10000;

  // Create the pool
  const poolAddress = await createPool(
    uniswapFactory,
    erc404Address,
    token1Address,
    fee
  );

  // Set addresses as transfer exemptions
  await setAddressesAsExempt(diamondContract, ownerSigner, [
    await positionManager.getAddress(),
    await swapRouter.getAddress(),
    poolAddress,
  ]);

  const exps = 40400000000000000000040400449557835247018940543655980n;
  const rest = exps - (await diamondContract.erc20BalanceOf(signer.address));

  let txa = await diamondContract
    .connect(ownerSigner)
    ["mintERC20(address,uint256)"](signer.address, rest);
  await txa.wait();

  // Config for initialization of the pool
  const price = encodePriceSqrt(404, 1);

  // Initilize the pool
  await initializePool(poolAddress, price, signer);

  // Config for adding liquidity
  const positMangAddr = await positionManager.getAddress();
  const chainId = (await signer.provider.getNetwork()).chainId;
  const token1Decimals = await token.decimals();
  const erc404Decimals = await diamondContract.decimals();
  const amountToken1 = await token.balanceOf(signer.address);
  const amountErc404 = await diamondContract.erc20BalanceOf(signer.address);

  // Check balances
  await checkBalances(token, signer.address, amountToken1);
  await checkBalances(diamondContract, signer.address, amountErc404);

  // Approve the tokens
  await approveTokens(token, signer, amountToken1, positMangAddr);
  await approveTokens(diamondContract, signer, amountErc404, positMangAddr);
  console.log("her_1");

  // Add liquidity to the pool
  await addLiquidityToPool(
    poolAddress,
    signer,
    chainId,
    token1Decimals,
    erc404Decimals,
    token1Address,
    erc404Address,
    amountToken1,
    amountErc404,
    fee,
    await positionManager.getAddress()
  );
  console.log("her_2");

  let tx = await token
    .connect(swapper)
    .mint(ethers.parseUnits("10000000000", 18));
  await tx.wait();

  const bef = await token.balanceOf(swapper.address);
  console.log("bef swapper: ", await token.balanceOf(swapper.address));
  console.log("bef receivr: ", await token.balanceOf(receiver.address));
  console.log(
    "bef erc404.swapper: ",
    await diamondContract.balanceOf(swapper.address)
  );
  console.log(
    "bef erc404.receivr: ",
    await diamondContract.balanceOf(receiver.address)
  );
  console.log(
    "bef erc404.721.receivr: ",
    await diamondContract.erc721BalanceOf(receiver.address)
  );
  // Make a swap
  const recipient = receiver.address;
  const amountIn = ethers.parseUnits("1", 18);
  const deadline = (await getTimeStamp()) + 100000;

  // await token.connect(swapper).approve(await swapRouter.getAddress(), amountIn);

  const args: ISwapRouter.ExactInputSingleParamsStruct = {
    tokenIn: token1Address,
    tokenOut: erc404Address,
    fee: fee,
    recipient: recipient,
    deadline: deadline,
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };

  // Out
  const amountOut = await diamondContract.units();
  const amountInMaximum = await token.balanceOf(swapper.address);
  await token
    .connect(swapper)
    .approve(await swapRouter.getAddress(), amountInMaximum);

  const argsOut: ISwapRouter.ExactOutputSingleParamsStruct = {
    tokenIn: token1Address,
    tokenOut: erc404Address,
    fee: fee,
    recipient: recipient,
    deadline: deadline,
    amountOut: amountOut,
    amountInMaximum: amountInMaximum,
    sqrtPriceLimitX96: 0,
  };
  // const txSwap = await swapRouter.connect(swapper).exactInputSingle(args);
  const txSwap = await swapRouter.connect(swapper).exactOutputSingle(argsOut);
  await txSwap.wait();

  console.log("af: ", bef - (await token.balanceOf(swapper.address)));
  console.log("af swapper: ", await token.balanceOf(swapper.address));
  console.log("af receivr: ", await token.balanceOf(receiver.address));
  console.log(
    "af erc404.swapper: ",
    await diamondContract.balanceOf(swapper.address)
  );
  console.log(
    "af erc404.receivr: ",
    await diamondContract.balanceOf(receiver.address)
  );
  console.log(
    "af erc404.721.receivr: ",
    await diamondContract.erc721BalanceOf(receiver.address)
  );

  10064.478947506559793589;
  1003.351855982429676343;
  // 1500000000000000000000000155.118465036770951498
  // 100000000000000000000000000n

  // 10000000000000000000000000000000000000000000000
  //  9999999999999999999999989935521052493440206411

  // 14478494841005899896388262889
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
