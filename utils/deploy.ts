import { ethers } from "hardhat";
import { UniswapV3Factory } from "../typechain-types/node_modules/@uniswap/v3-core/artifacts/contracts";
import {
  NonfungiblePositionManager,
  SwapRouter,
} from "../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts";
import { BaseContract } from "ethers";
import { VRFParamsStruct } from "../typechain-types/artifacts/contracts/automation/vrf/AutomationVRF";
import { getEventArgs } from "./events";
import { SubscriptionCreatedEvent } from "../typechain-types/artifacts/contracts/test/mocks/VRFCoordinatorV2Mock.sol/CoordinatorV2Mock";
import { getInitData } from "./diamond";
import { IERC2535DiamondCutInternal } from "../typechain-types";

type AutomationBaseArgs = {
  caller_: string;
  minPending_: bigint;
  minWait_: bigint;
  maxWait_: bigint;
};
type AutomationVRFArgs = AutomationBaseArgs & {
  randomParams_: VRFParamsStruct;
};

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

export async function deployPET404Facet(
  uniswapFactory_?: string,
  initialMintRecipient_?: string
) {
  const [initialRecipient] = await ethers.getSigners();
  const decimals = 18n;

  const deployArgs = {
    name: "Pets 404",
    symbol: "P404",
    decimals: decimals,
    units: 404000n * 10n ** decimals,
    baseUri: "https://www.example.com/token/",
    maxTotalSupplyERC721_: 20n, // 20 tokens
    initialMintRecipient_: await initialRecipient.getAddress(),
    uniswapFactory_: ethers.ZeroAddress,
  };

  if (uniswapFactory_) {
    deployArgs.uniswapFactory_ = uniswapFactory_;
  }
  if (initialMintRecipient_) {
    deployArgs.initialMintRecipient_ = initialMintRecipient_;
  }

  const factory = await ethers.getContractFactory("PET404");

  const pet404Contract = await factory.deploy();
  await pet404Contract.waitForDeployment();

  const initData = getInitData(pet404Contract, "__PET404_init", [
    deployArgs.name,
    deployArgs.symbol,
    deployArgs.decimals,
    deployArgs.units,
    deployArgs.baseUri,
    deployArgs.maxTotalSupplyERC721_,
    deployArgs.initialMintRecipient_,
    deployArgs.uniswapFactory_,
  ]);

  return {
    pet404Contract,
    pet404ContractAddress: await pet404Contract.getAddress(),
    deployArgs,
    initData,
  };
}

export async function deployPET404ExposerFacet() {
  const factory = await ethers.getContractFactory("PET404Exposer");
  const pet404ExposerContract = await factory.deploy();
  await pet404ExposerContract.waitForDeployment();

  return {
    pet404ExposerContract: pet404ExposerContract,
    pet404ExposerContractAddress: await pet404ExposerContract.getAddress(),
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

  const initData = getInitData(dnaContract, "__DNA_init", [
    deployArgs.schemaHash,
    deployArgs.variantsName,
  ]);

  return {
    dnaContract,
    dnaContractAddress: await dnaContract.getAddress(),
    deployArgs,
    initData,
  };
}

export async function deployAutomationNonVrfFacet() {
  const automationRegistry = await deployAutomationRegistryMock();
  const automationRegistryAddress = await automationRegistry.getAddress();

  const deployArgs: AutomationBaseArgs = {
    caller_: automationRegistryAddress,
    minPending_: 1n, // Minimum 1 NFT
    minWait_: 10n, // Wait atleast 10 secs
    maxWait_: 60n, // Max wait is 60 secs
  };

  const factory = await ethers.getContractFactory("AutomationNonVRF");
  const automationNonVrf = await factory.deploy();

  await automationNonVrf.waitForDeployment();

  const initData = getInitData(automationNonVrf, "__AutomationNonVRF_init", [
    deployArgs.caller_,
    deployArgs.minPending_,
    deployArgs.maxWait_,
    deployArgs.maxWait_,
  ]);

  return {
    automationNonVrf,
    automationNonVrfAddress: await automationNonVrf.getAddress(),
    automationRegistry,
    deployArgs,
    initData,
  };
}

export async function deployAutomationNonVrfFacetMock() {
  const automationRegistry = await deployAutomationRegistryMock();
  const automationRegistryAddress = await automationRegistry.getAddress();

  const deployArgs = {
    automationRegistryAddress,
  };

  const factory = await ethers.getContractFactory("AutomationNonVRFMock");

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
  const automationRegistry = await deployAutomationRegistryMock();
  const automationRegistryAddress = await automationRegistry.getAddress();

  const coordinatorv2 = await deployVRFCoordinartorV2Mock();
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

export async function deployUniswapV3Factory(): Promise<UniswapV3Factory> {
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

export async function deployLinkToken() {
  const factory = await ethers.getContractFactory("MockLink");

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  return contract;
}

export async function deployERC20Token() {
  const factory = await ethers.getContractFactory("ERC20Mock");

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  return contract;
}

export async function deployMultiInit(
  targets_: string[],
  calldatas_: string[]
) {
  const factory = await ethers.getContractFactory("DiamondMultiInit");

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const calldataMultiInit: string = getInitData(contract, "multiInit", [
    targets_, // Targets
    calldatas_, // Calldata
  ]);

  return {
    diamondMultiInit: contract,
    calldataMultiInit,
  };
}

export async function deployDiamond(
  owner_: string,
  facetCuts_: IERC2535DiamondCutInternal.FacetCutStruct[],
  multiInit_: string,
  calldataMultiInit_: string
) {
  const factory = await ethers.getContractFactory("Diamond");

  const diamondContract = await factory.deploy(
    owner_,
    facetCuts_,
    multiInit_,
    calldataMultiInit_
  );
  await diamondContract.waitForDeployment();

  return diamondContract;
}
