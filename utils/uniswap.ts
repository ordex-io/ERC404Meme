import { BigNumberish, Contract, Signer } from "ethers";
import {
  IERC20,
  IPET404,
  UniswapV3Factory,
  UniswapV3Pool,
} from "../typechain-types";
import { Percent, Token } from "@uniswap/sdk-core";
import {
  nearestUsableTick,
  NonfungiblePositionManager,
  Position,
  Pool,
  FeeAmount,
  encodeSqrtRatioX96,
} from "@uniswap/v3-sdk";

export async function createPool(
  uniswapFactory_contract: UniswapV3Factory,
  token1Address: string,
  token2Address: string,
  fee: BigNumberish
) {
  let poolAdd = await uniswapFactory_contract.getPool(
    token1Address,
    token2Address,
    fee,
    {
      gasLimit: 3000000,
    }
  );

  if (poolAdd === "0x0000000000000000000000000000000000000000") {
    console.log("Creating pool");
    let txs;
    txs = await uniswapFactory_contract.createPool(
      token1Address.toLowerCase(),
      token2Address.toLowerCase(),
      fee,
      {
        gasLimit: 10000000,
      }
    );
    await txs.wait();

    poolAdd = await uniswapFactory_contract.getPool(
      token1Address,
      token2Address,
      fee,
      {
        gasLimit: 3000000,
      }
    );
  }

  console.log("Pool address", poolAdd);
  return poolAdd;
}

export async function initializePool(
  poolAdd_: string,
  price_: bigint,
  signer_: Signer
) {
  const poolContract = getUniswapPool(poolAdd_, signer_);

  console.log("Initializating Pool");

  let txs = await poolContract.initialize(price_.toString(), {
    gasLimit: 3000000,
  });
  await txs.wait();
  console.log("Pool Initialized");
}

export function getUniswapPool(
  poolAddress_: string,
  signer_: Signer
): UniswapV3Pool {
  const IUniswapPool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

  const contract = new Contract(
    poolAddress_,
    IUniswapPool.abi,
    signer_
  ) as unknown as UniswapV3Pool;

  return contract;
}

export async function getPoolState(poolContract: UniswapV3Pool) {
  const liquidity = await poolContract.liquidity();
  const slot = await poolContract.slot0();

  const PoolState = {
    liquidity,
    sqrtPriceX96: slot[0],
    tick: slot[1],
    observationIndex: slot[2],
    observationCardinality: slot[3],
    observationCardinalityNext: slot[4],
    feeProtocol: slot[5],
    unlocked: slot[6],
  };

  return PoolState;
}

export async function addLiquidityToPool(
  poolAdd: string,
  deployer: Signer,
  chainId: bigint,
  Token1_decimals: bigint,
  Token2_decimals: bigint,
  token_contract1: string,
  token_contract2: string,
  amount0: bigint,
  amount1: bigint,
  fee: FeeAmount,
  npmca: string
) {
  const poolContract = getUniswapPool(poolAdd, deployer);

  let state = await getPoolState(poolContract);

  const numChainId = Number(chainId);

  const Token1 = new Token(
    numChainId,
    token_contract1,
    Number(Token1_decimals)
  );
  const Token2 = new Token(
    numChainId,
    token_contract2,
    Number(Token2_decimals)
  );

  // Safe cast
  let stateTick: number;
  try {
    stateTick = Number(state.tick);
  } catch (error) {
    console.log(error);
    throw `state.tick too big to fit on number type: ${state.tick}`;
  }

  const configuredPool = new Pool(
    Token1,
    Token2,
    fee,
    state.sqrtPriceX96.toString(),
    state.liquidity.toString(),
    stateTick
  );

  const position = Position.fromAmounts({
    pool: configuredPool,
    tickLower:
      nearestUsableTick(
        configuredPool.tickCurrent,
        configuredPool.tickSpacing
      ) -
      configuredPool.tickSpacing * 2,
    tickUpper:
      nearestUsableTick(
        configuredPool.tickCurrent,
        configuredPool.tickSpacing
      ) +
      configuredPool.tickSpacing * 2,
    amount0: amount0.toString(),
    amount1: amount1.toString(),
    useFullPrecision: false,
  });

  const deployerAddress = await deployer.getAddress();

  const mintOptions = {
    recipient: deployerAddress,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  };

  const { calldata, value } = NonfungiblePositionManager.addCallParameters(
    position,
    mintOptions
  );

  const transaction = {
    data: calldata,
    to: npmca,
    value: value,
    from: deployerAddress,
    gasLimit: 10000000,
  };
  console.log("Transacting");
  const txRes = await deployer.sendTransaction(transaction);
  await txRes.wait();
  console.log("Added liquidity");
}

export async function checkBalances(
  token: IERC20 | IPET404,
  address: string,
  minAmount: bigint
) {
  if ((await token.balanceOf(address)) < minAmount) {
    throw "Not enought balance";
  }
}

/**
 * Try to approve the given amount for the given tokens checking the balance
 */
export async function approveTokens(
  token: IERC20 | IPET404,
  owner: Signer,
  amount: bigint,
  approver: string
) {
  const tx = await token.connect(owner).approve(approver, amount);
  await tx.wait();
}

// returns the sqrt price as a 64x96
export function encodePriceSqrt(
  reserve1: BigNumberish,
  reserve0: BigNumberish
) {
  return BigInt(
    encodeSqrtRatioX96(reserve1.toString(), reserve0.toString()).toString()
  );
}
