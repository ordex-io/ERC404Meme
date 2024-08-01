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
import { Create2Factory, IERC2535DiamondCutInternal } from "../typechain-types";
import { findCreate2Address } from "./manipulation";
import { DeployEvent } from "../typechain-types/artifacts/contracts/create2/Create2Factory";
import create2factoriesData from "../create2factories.json"

interface Create2Factories {
  [key: string]: string; // Index signature to allow string indexing
}

type AutomationBaseArgs = {
  caller_: string;
  minPending_: bigint;
  minWait_: bigint;
  maxWait_: bigint;
};
type AutomationVRFArgs = AutomationBaseArgs & {
  randomParams_: VRFParamsStruct;
};

const create2factories: Create2Factories = create2factoriesData;

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

export async function deployPET404Facet(initialMintRecipient_?: string) {
  const [initialRecipient] = await ethers.getSigners();
  const decimals = 18n;

  const deployArgs = {
    name: "ERC404Meme",
    symbol: "E404M",
    decimals: decimals,
    units: 404000n * 10n ** decimals,
    baseUri: "https://www.example.com/token/",
    maxTotalSupplyERC721_: 100n, // 20 tokens
    initialMintRecipient_: await initialRecipient.getAddress(),
  };

  if (initialMintRecipient_) {
    deployArgs.initialMintRecipient_ = initialMintRecipient_;
  }

  const factory = await ethers.getContractFactory("PET404NonVRF");
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
    schemaHash: "QmaomExtuqecqqawaw3aSfJnx5Kd9ETEWZkkd49sdpj2iY",
    variantsName: ['background', 'body', 'clothes', 'hat', 'mouth', 'eye', 'whiskers'],
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
    minWait_: 0n, // Wait atleast 10 secs
    maxWait_: 0n, // Max wait is 60 secs
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

export async function deployCreate2Factory(): Promise<Create2Factory> {
  const factory = await ethers.getContractFactory("Create2Factory");
  // Get the current chain ID
  const { chainId } = await ethers.provider.getNetwork()
  const chainIdStr = chainId.toString();

  if (chainIdStr in create2factories && create2factories[chainIdStr]) {
    // Use a create2 factory already deployed
    return factory.attach(create2factories[chainIdStr]) as Create2Factory;
    } else {
    // Deploy otherwise
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return contract;
  }
}

export async function deployWithCreate2(
  create2Factory: Create2Factory,
  contractName: string,
  args: any[] = []
): Promise<string> {
  // Generating the init code with the args if have it
  const factory = await ethers.getContractFactory(contractName);
  const deployArgs  = factory.interface.encodeDeploy(args);
  const initCode = ethers.concat([factory.bytecode, deployArgs]);

  // Obtaining the salt that meet the condtion to get the address that start with "0x404"
  const { salt } = await findCreate2Address(await create2Factory.getAddress(), initCode);

  // Deploy the contract
  const tx = await create2Factory.deploy(initCode, salt);

  // Get the address from the event
  const { addr } = (await getEventArgs(
    tx,
    "Deploy",
    create2Factory
  )) as DeployEvent.OutputObject;

  return addr;
}