import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { UniswapV3Factory } from "../../typechain-types/node_modules/@uniswap/v3-core/artifacts/contracts";
import {
  NonfungiblePositionManager,
  SwapRouter,
} from "../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts";
import { BaseContract } from "ethers";
import { VRFParamsStruct } from "../../typechain-types/artifacts/contracts/automation/vrf/AutomationVRF";
import { getEventArgs } from "./events";
import { SubscriptionCreatedEvent } from "../../typechain-types/artifacts/contracts/test/mocks/VRFCoordinatorV2Mock.sol/CoordinatorV2Mock";

export async function deployVRFCoordinartorV2Mock() {
  const factory = await ethers.getContractFactory("CoordinatorV2Mock");
  const contract = await factory.deploy(100, 100);
  return contract;
}

export async function deployAutomationRegistryMock() {
  const factory = await ethers.getContractFactory("AutomationRegistryMock");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  return contract;
}

export async function deployNFT404Facet() {
  const decimals = 18n;

  const deployArgs = {
    name: "Cats 404",
    symbol: "C404",
    decimals: decimals,
    units: 404000n * 10n ** decimals,
    baseUri: "https://www.example.com/token/",
  };

  const factory = await ethers.getContractFactory("NFT404");

  const nft404Contract = await factory.deploy();
  await nft404Contract.waitForDeployment();

  return {
    nft404Contract,
    nft404ContractAddress: await nft404Contract.getAddress(),
    deployArgs,
  };
}

export async function deployDNAFacet() {
  const deployArgs = {
    schemaHash: ethers.concat([ethers.randomBytes(32)]),
    variantsName: ["head", "hat", "background", "eyes"],
  };

  const factory = await ethers.getContractFactory("DNA");

  const dnaContract = await factory.deploy();
  await dnaContract.waitForDeployment();

  return {
    dnaContract,
    dnaContractAddress: await dnaContract.getAddress(),
    deployArgs,
  };
}

export async function deployAutomationNonVrfFacet() {
  const automationRegistry = await loadFixture(deployAutomationRegistryMock);
  const automationRegistryAddress = await automationRegistry.getAddress();

  const deployArgs = {
    automationRegistryAddress,
  };

  const factory = await ethers.getContractFactory("AutomationNonVRF");
  const automationNonVrf = await factory.deploy();

  await automationNonVrf.waitForDeployment();

  return {
    automationNonVrf,
    automationNonVrfAddress: await automationNonVrf.getAddress(),
    automationRegistry,
    deployArgs,
  };
}

export async function deployAutomationVrfFacet() {
  const automationRegistry = await loadFixture(deployAutomationRegistryMock);
  const automationRegistryAddress = await automationRegistry.getAddress();

  const coordinatorv2 = await loadFixture(deployVRFCoordinartorV2Mock);
  const coordinatorv2Address = await coordinatorv2.getAddress();

  // Create the subscription on the VRF coordinator
  const txCreateSubs = await coordinatorv2.createSubscription();
  const subscriptionCreatedEvent = (await getEventArgs(
    txCreateSubs,
    "SubscriptionCreated",
    coordinatorv2
  )) as SubscriptionCreatedEvent.OutputObject;

  // Params for the VRF Consumer
  const keyHash =
    "0xff8dedfbfa60af186cf3c830acbc32c05aae823045ae5ea7da1e45fbfaba4f92"; // Arbitrary Keyhash
  const subscriptionId = subscriptionCreatedEvent.subId; // SubID created
  const requestConfirmations = 0n;
  const callbackGasLimit = 10000000n; // 10M of gas for the limit on call back
  const numWords = 5n; // 5 random words

  const randomParams: VRFParamsStruct = {
    vrfCoordinator: coordinatorv2Address,
    keyHash,
    subscriptionId,
    requestConfirmations,
    callbackGasLimit,
    numWords,
  };

  const deployArgs = {
    automationRegistryAddress,
    randomParams,
  };

  const factory = await ethers.getContractFactory("AutomationVRF");
  const automationVrf = await factory.deploy();

  await automationVrf.waitForDeployment();

  return {
    automationVrf,
    automationVrfAddress: await automationVrf.getAddress(),
    automationRegistry,
    automationRegistryAddress,
    coordinatorv2,
    coordinatorv2Address,
    deployArgs,
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
