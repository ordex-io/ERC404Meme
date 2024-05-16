import { ethers } from "hardhat";
import {
  addLiquidityToPool,
  approveTokens,
  checkBalances,
  createPool,
  deployAutomationNonVrfFacet,
  deployDNAFacet,
  deployERC20Token,
  deployNonfungiblePositionManager,
  deployPET404ExposerFacet,
  deployPET404Facet,
  deploySwapRouter,
  deployUniswapV3Factory,
  deployWeth,
  encodePriceSqrt,
  fulfillFacetCut,
  getInitData,
  initializePool,
  setAddressesAsExempt,
} from "../../utils";

export async function deployFullPET404DiamondNonVrf() {
  // Factory Diamond
  const zeroDiamond = await ethers.getContractAt("Diamond", ethers.ZeroAddress);
  const zeroIDiamont404 = await ethers.getContractAt(
    "IDiamondPET404",
    ethers.ZeroAddress
  );

  // Deploy Automation Non VRF Facet
  const {
    automationNonVrf,
    automationRegistry,
    automationNonVrfAddress,
    deployArgs: automationArgs,
  } = await deployAutomationNonVrfFacet();

  // Deploy DNA Facet
  const {
    dnaContract,
    dnaContractAddress,
    deployArgs: dnaArgs,
  } = await deployDNAFacet();

  // Deploy PET404 Facet
  const {
    pet404Contract,
    pet404ContractAddress,
    deployArgs: pet404Args,
  } = await deployPET404Facet();

  // Deploy PET404 Facet (NOTE: only tests)
  const { pet404ExposerContract } = await deployPET404ExposerFacet();

  // FULFILL THE FACET CUTS
  // NOTE: This order is really important when initializing (PET404, DNA, Automation)

  // Fulfill the PET404 Facet Cuts
  const pet404FacetCuts = await fulfillFacetCut(pet404Contract, [zeroDiamond]);

  // Fulfill the DNA Facet Cuts
  const dnaFacetCuts = await fulfillFacetCut(dnaContract, [zeroDiamond]);

  // Fulfill the Automation Facet Cuts
  const automationFacetCuts = await fulfillFacetCut(automationNonVrf, [
    zeroDiamond,
  ]);

  const exposer404FacetCuts = await fulfillFacetCut(pet404ExposerContract, [
    zeroIDiamont404,
  ]);

  // Initializations calldata
  const pet404Calldata = getInitData(pet404Contract, "__PET404_init", [
    pet404Args.name,
    pet404Args.symbol,
    pet404Args.decimals,
    pet404Args.units,
    pet404Args.baseUri,
    pet404Args.maxTotalSupplyERC721_,
    pet404Args.initialMintRecipient_,
    pet404Args.uniswapFactory_,
  ]);

  const dnaCalldata = getInitData(dnaContract, "__DNA_init", [
    dnaArgs.schemaHash,
    dnaArgs.variantsName,
  ]);

  const automationCalldata = getInitData(
    automationNonVrf,
    "__AutomationNonVRF_init",
    [automationArgs.automationRegistryAddress]
  );

  // Multi initializer diamond
  const factoryDiamondMultiInit = await ethers.getContractFactory(
    "DiamondMultiInit"
  );
  const diamondMultiInit = await factoryDiamondMultiInit.deploy();

  const calldataMultiInit: string = getInitData(diamondMultiInit, "multiInit", [
    [pet404ContractAddress, dnaContractAddress, automationNonVrfAddress], // Targets
    [pet404Calldata, dnaCalldata, automationCalldata], // Calldata
  ]);

  // Deploy Diamond contract
  // Owner of the Diamond (have the ownership of the whole contract facets)
  const ownerSigner = (await ethers.getSigners())[9];

  const factoryDiamond = await ethers.getContractFactory("Diamond");
  const diamondContract = await factoryDiamond.deploy(
    ownerSigner.address, // owner
    [pet404FacetCuts, dnaFacetCuts, automationFacetCuts, exposer404FacetCuts], //  Faucets
    await diamondMultiInit.getAddress(), // Target address for initialization
    calldataMultiInit // Calldata that will be used for initialization
  );
  await diamondContract.waitForDeployment();

  const diamondAddress = await diamondContract.getAddress();

  const iDiamond = await ethers.getContractAt(
    "IPET404Exposer",
    diamondAddress,
    (
      await ethers.getSigners()
    )[0]
  );

  return {
    diamondContract: iDiamond,
    diamondContractAddress: diamondAddress,
    automationRegistry,
    dnaContractAddress,
    dnaFacet: dnaContract,
    automationAddress: automationNonVrfAddress,
    automationNonVrfFacet: automationNonVrf,
    pet404Address: pet404ContractAddress,
    pet404Facet: pet404Contract,
    ownerSigner,
    facetsArgs: {
      dna: dnaArgs,
      automation: automationArgs,
      pet404: pet404Args,
    },
    facetsCuts: {
      dna: dnaFacetCuts,
      automation: automationFacetCuts,
      pet404: pet404FacetCuts,
    },
  };
}

export async function deployUniswapPool() {
  // Deploy Uniswap Factory
  const uniswapFactory = await deployUniswapV3Factory();

  // WETH token
  const weth = await deployWeth();

  // Position manager
  const positionManager = await deployNonfungiblePositionManager(
    uniswapFactory,
    weth
  );

  // Swap router
  const swapRouter = await deploySwapRouter(uniswapFactory, weth);

  // ERC20 token to use to create the pool
  const erc20Token = await deployERC20Token();

  // PET404 Related contracts
  const PET404ContractsData = await deployFullPET404DiamondNonVrf();

  // Configuration for the pool
  const token1Address = await erc20Token.getAddress(); // token0
  const erc404Address = await PET404ContractsData.diamondContract.getAddress(); // token1
  // (0.05, 0.3, 1, 0.01)
  const fee = 0.3 * 10000;
  // The recipient signer is the same signer that we used when deploying the PET404 (initialMintRecipient)
  const [recipientSigner] = await ethers.getSigners();

  // Create the pool
  const poolAddress = await createPool(
    uniswapFactory,
    erc404Address,
    token1Address,
    fee
  );

  // Set Uniswap addresses as transfer exemptions so they don't mint NFTs for they own
  await setAddressesAsExempt(
    PET404ContractsData.diamondContract,
    PET404ContractsData.ownerSigner,
    [
      await positionManager.getAddress(),
      await swapRouter.getAddress(),
      poolAddress,
    ]
  );

  // Config for initialization of the pool
  const price = encodePriceSqrt(404, 1);

  // Initilize the pool (the signer can be anyone who want to initialize the pool
  await initializePool(poolAddress, price, recipientSigner);

  // ADDING LIQUIDITY

  // Config for adding liquidity
  const positMangAddr = await positionManager.getAddress();
  const chainId = (await recipientSigner.provider.getNetwork()).chainId;
  const token1Decimals = await erc20Token.decimals();
  const erc404Decimals = await PET404ContractsData.diamondContract.decimals();
  const amountToken1 = await erc20Token.balanceOf(recipientSigner.address);
  const amountErc404 = await PET404ContractsData.diamondContract.erc20BalanceOf(
    recipientSigner.address
  );

  // Check balances of the signer for both tokens
  await checkBalances(erc20Token, recipientSigner.address, amountToken1);
  await checkBalances(
    PET404ContractsData.diamondContract,
    recipientSigner.address,
    amountErc404
  );

  // Approve the tokens to be used b the position manager
  await approveTokens(erc20Token, recipientSigner, amountToken1, positMangAddr);
  await approveTokens(
    PET404ContractsData.diamondContract,
    recipientSigner,
    amountErc404,
    positMangAddr
  );

  // Add liquidity to the pool
  await addLiquidityToPool(
    poolAddress,
    recipientSigner,
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

  return {
    PET404ContractsData,
    Uniswap: {
      uniswapFactory,
      weth,
      positionManager,
      swapRouter,
      erc20Token,
      fee
    },
  };
}
