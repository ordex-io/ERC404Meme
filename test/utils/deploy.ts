import { ethers, upgrades } from "hardhat";
import { NFT404 } from "../../typechain-types";
import {
  ERC404InitParamsStruct,
  DNAInitParamsStruct,
  ERC404ConfigInitParamsStruct,
} from "../../typechain-types/artifacts/contracts/NFT404";
import { UniswapV3Factory } from "../../typechain-types/node_modules/@uniswap/v3-core/artifacts/contracts";
import {
  NonfungiblePositionManager,
  SwapRouter,
} from "../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts";
import { BaseContract } from "ethers";

export async function deployVRFCoordinartorV2Mock() {
  const factory = await ethers.getContractFactory("CoordinatorV2Mock");
  const contract = await factory.deploy(100, 100);
  return contract;
}

export async function deployNFT404() {
  const factory = await ethers.getContractFactory("NFT404");
  const signers = await ethers.getSigners();

  const decimals = 18n;
  const units = 404000n * 10n ** decimals;
  const maxTotalSupplyERC20 = 10000n * units;
  const owner = signers[0];
  const initialMintRecipient = signers[0].address;
  const automationRegistry = signers[9];
  const automationRegistryAddress = signers[9].address;

  const erc404Params: ERC404InitParamsStruct = {
    name: "CAT NFT 404",
    symbol: "CN404",
    decimals,
    units,
  };

  const nft404Params: ERC404ConfigInitParamsStruct = {
    automationRegistry: automationRegistryAddress,
    initialOwner: owner.address,
    maxTotalSupplyERC20: maxTotalSupplyERC20,
    initialMintRecipient,
  };

  const dnaParams: DNAInitParamsStruct = {
    schema_hash: ethers.randomBytes(32),
    variants_name: ["head", "hat", "background", "eyes"],
  };

  const nft404 = (await upgrades.deployProxy(factory, [
    erc404Params,
    dnaParams,
    nft404Params,
  ])) as unknown as NFT404;

  await nft404.waitForDeployment();

  return {
    nft404,
    nft404Address: await nft404.getAddress(),
    owner,
    automationRegistry,
    erc404Params,
    dnaParams,
    nft404Params,
  };
}

export async function deployWeth() {
  const factory = await ethers.getContractFactory("WETH");
  const wethContract = await factory.deploy();
  await wethContract.waitForDeployment();

  return wethContract;
}

export async function deployUniswapV3Factory() {
  const signers = await ethers.getSigners();

  // Deploy Uniswap v3 factory.
  const uniswapV3FactorySource = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");
  const uniswapV3FactoryContract = (await new ethers.ContractFactory(
    uniswapV3FactorySource.abi,
    uniswapV3FactorySource.bytecode,
    signers[0]
  ).deploy()) as UniswapV3Factory;

  await uniswapV3FactoryContract.waitForDeployment();

  // Add the 100bps fee tier.
  await uniswapV3FactoryContract.connect(signers[0]).enableFeeAmount(100, 1);

  return uniswapV3FactoryContract;
}

export async function deployNonfungiblePositionManager(
  uniswapV3FactoryContract_: BaseContract,
  wethContract_: BaseContract
) {
  const signers = await ethers.getSigners();

  const uniswapV3NonfungiblePositionManagerSource = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");
  const uniswapV3NonfungiblePositionManagerContract =
    (await new ethers.ContractFactory(
      uniswapV3NonfungiblePositionManagerSource.abi,
      uniswapV3NonfungiblePositionManagerSource.bytecode,
      signers[0]
    ).deploy(
      await uniswapV3FactoryContract_.getAddress(),
      await wethContract_.getAddress(),
      // Skip the token descriptor address (we don't really need this for testing).
      ethers.ZeroAddress
    )) as NonfungiblePositionManager;
  await uniswapV3NonfungiblePositionManagerContract.waitForDeployment();

  return uniswapV3NonfungiblePositionManagerContract;
}

export async function deploySwapRouter(
  uniswapV3FactoryContract_: BaseContract,
  wethContract_: BaseContract
) {
  const signers = await ethers.getSigners();

  // Deploy Uniswap v3 router.
  const uniswapV3Router = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");
  const uniswapV3RouterContract = (await new ethers.ContractFactory(
    uniswapV3Router.abi,
    uniswapV3Router.bytecode,
    signers[0]
  ).deploy(
    await uniswapV3FactoryContract_.getAddress(),
    await wethContract_.getAddress()
  )) as SwapRouter;

  await uniswapV3RouterContract.waitForDeployment();

  return uniswapV3RouterContract;
}
