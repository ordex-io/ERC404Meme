import {
  ERC20Mock,
  IPET404Exposer,
  NonfungiblePositionManager,
  SwapRouter,
  V3SwapRouter,
  UniswapV3Factory,
  WETH,
} from "../typechain-types";
import { Signer, Contract } from "ethers";
import { ethers } from "hardhat";

export async function getUniswapFactory(
  address: string,
  signer: Signer
): Promise<UniswapV3Factory> {
  const source = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
  return new Contract(
    address,
    source.abi,
    signer
  ) as unknown as UniswapV3Factory;
}

export async function getWethContract(
  address: string,
  signer: Signer
): Promise<WETH> {
  return await ethers.getContractAt("WETH", address, signer);
}

export async function getNonfungiblePositionManager(
  address: string,
  signer: Signer
): Promise<NonfungiblePositionManager> {
  const source = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

  return new Contract(
    address,
    source.abi,
    signer
  ) as unknown as NonfungiblePositionManager;
}

export async function getSwapRouter(
  address: string,
  signer: Signer
): Promise<SwapRouter> {
  const source = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");

  return new Contract(address, source.abi, signer) as unknown as SwapRouter;
}

export async function getSwapRouter02(
  address: string,
  signer: Signer
): Promise<V3SwapRouter> {
  const source = require("@uniswap/swap-router-contracts/artifacts/contracts/V3SwapRouter.sol/V3SwapRouter.json");

  return new Contract(address, source.abi, signer) as unknown as V3SwapRouter;
}
export async function getERC20(
  address: string,
  signer: Signer
): Promise<ERC20Mock> {
  return await ethers.getContractAt("ERC20Mock", address, signer);
}

export async function getDiamondPET404(
  address: string,
  signer: Signer
): Promise<IPET404Exposer> {
  return await ethers.getContractAt("IPET404Exposer", address, signer);
  // return await ethers.getContractAt("IDiamondPET404", address, signer);
}
