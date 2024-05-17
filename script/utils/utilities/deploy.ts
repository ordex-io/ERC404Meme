import { ethers } from "hardhat";
import { UniswapV3Factory } from "../../../typechain-types/node_modules/@uniswap/v3-core/artifacts/contracts";
import {
  NonfungiblePositionManager,
  SwapRouter,
} from "../../../typechain-types/node_modules/@uniswap/v3-periphery/artifacts/contracts";
import { BaseContract } from "ethers";
import { VRFParamsStruct } from "../../../typechain-types/artifacts/contracts/automation/vrf/AutomationVRF";
import { getEventArgs } from "./events";
import { SubscriptionCreatedEvent } from "../../../typechain-types/artifacts/contracts/test/mocks/VRFCoordinatorV2Mock.sol/CoordinatorV2Mock";
import { getInitData } from "./diamond";
import {
  IERC2535DiamondCutInternal,
  WETH,
  ERC20Mock,
  AutomationNonVRF,
  DNA,
  PET404,
  DiamondMultiInit,
  Diamond,
} from "../../../typechain-types";

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
    baseUri: "https://vercel-api-404.vercel.app/api/token/",
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

  const pet404Contract = factory.attach(
    "0xCbCC5582A9dF57067105b350757430a37E2479aa"
  ) as PET404;

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

  const dnaContract = factory.attach(
    "0xC6A8DA983f47E9c444Dac0b1881253bf8848a117"
  ) as DNA;

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
  const deployArgs: AutomationBaseArgs = {
    caller_: "0x3E402D2C04ed46c2E757E79144b787A49fAEf276",
    minPending_: 1n, // Minimum 1 NFT
    minWait_: 0n, // Wait atleast 10 secs
    maxWait_: 0n, // Max wait is 60 secs
  };

  const factory = await ethers.getContractFactory("AutomationNonVRF");
  const automationNonVrf = factory.attach(
    "0x535C0ae92B66F75aFF5B0125298E43B1CBc3fa63"
  ) as AutomationNonVRF;

  const initData = getInitData(automationNonVrf, "__AutomationNonVRF_init", [
    deployArgs.caller_,
    deployArgs.minPending_,
    deployArgs.maxWait_,
    deployArgs.maxWait_,
  ]);

  return {
    automationNonVrf,
    automationNonVrfAddress: await automationNonVrf.getAddress(),
    // automationRegistry,
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

export async function deployWeth(): Promise<WETH> {
  const factory = await ethers.getContractFactory("WETH");
  return factory.attach(
    "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
  ) as unknown as WETH;
}

export async function deployUniswapV3Factory(): Promise<UniswapV3Factory> {
  const signers = await ethers.getSigners();

  const uniswapV3FactorySource = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json");

  return new ethers.Contract(
    "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    uniswapV3FactorySource.abi,
    signers[0]
  ) as unknown as UniswapV3Factory;
}

export async function deployNonfungiblePositionManager(
  uniswapV3FactoryContract_: BaseContract,
  wethContract_: BaseContract
) {
  const signers = await ethers.getSigners();
  const uniswapV3NonfungiblePositionManagerSource = require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json");

  return new ethers.Contract(
    "0x1238536071E1c677A632429e3655c799b22cDA52",
    uniswapV3NonfungiblePositionManagerSource.abi,
    signers[0]
  ) as unknown as NonfungiblePositionManager;
}

export async function deploySwapRouter(
  uniswapV3FactoryContract_: BaseContract,
  wethContract_: BaseContract
) {
  const signers = await ethers.getSigners();

  // Deploy Uniswap v3 router.
  const uniswapV3Router = require("@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json");
  return new ethers.Contract(
    "0x54e9f478698Fca654048379E6880b794f828A824",
    uniswapV3Router.abi,
    signers[0]
  ) as unknown as SwapRouter;
}

export async function deployLinkToken() {
  const factory = await ethers.getContractFactory("MockLink");

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  return contract;
}

export async function deployERC20Token() {
  const factory = await ethers.getContractFactory("ERC20Mock");

  return factory.attach(
    "0x2b730c060FFA83Ce5D2B29016591874f31405A23"
  ) as ERC20Mock;
}

export async function deployMultiInit(
  targets_: string[],
  calldatas_: string[]
) {
  const factory = await ethers.getContractFactory("DiamondMultiInit");

  const contract = factory.attach(
    "0x8a28BD4F8F210e6BE7Ee83f06b310Fe89A72c142"
  ) as DiamondMultiInit;

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

  const diamondContract = factory.attach(
    "0xa6703bAC5A591fa7f59B1aF76060D4c34c7DaAaB"
  ) as Diamond;

  return diamondContract;
}
