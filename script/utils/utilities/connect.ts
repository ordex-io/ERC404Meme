import { ethers } from "hardhat";
import { UniswapV3Pool } from "../../../typechain-types";

export async function connectUniswapV3Pool(address_: string) {
  const signers = await ethers.getSigners();

  const uniswapV3PoolSource = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json");

  return new ethers.Contract(
    address_,
    uniswapV3PoolSource.abi,
    signers[0]
  ) as unknown as UniswapV3Pool; // Forcing the typecast, we know that it's ok
}
