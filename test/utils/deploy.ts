import { ethers } from "hardhat";
import {
  addLiquidityToPool,
  approveTokens,
  checkBalances,
  createPool,
  deployAutomationNonVrfFacet,
  deployDiamond,
  deployDNAFacet,
  deployERC20Token,
  deployMultiInit,
  deployNonfungiblePositionManager,
  deployPET404ExposerFacet,
  deployPET404Facet,
  deploySwapRouter,
  deployUniswapV3Factory,
  deployWeth,
  encodePriceSqrt,
  fulfillFacetCut,
  initializePool,
  setAddressAsSpecialExempt,
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
    initData: automationCalldata,
  } = await deployAutomationNonVrfFacet();

  // Deploy DNA Facet
  const {
    dnaContract,
    dnaContractAddress,
    deployArgs: dnaArgs,
    initData: dnaCalldata,
  } = await deployDNAFacet();

  // Deploy PET404NonVRF Facet
  const {
    pet404Contract,
    pet404ContractAddress,
    deployArgs: pet404Args,
    initData: pet404Calldata,
  } = await deployPET404Facet();

  // Deploy PET404NonVRF Facet (NOTE: only tests)
  const { pet404ExposerContract } = await deployPET404ExposerFacet();

  // FULFILL THE FACET CUTS
  // NOTE: This order is really important when initializing (PET404NonVRF, DNA, Automation)

  // Fulfill the PET404NonVRF Facet Cuts
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
  // Multi initializer diamond
  const targets = [
    pet404ContractAddress,
    dnaContractAddress,
    automationNonVrfAddress,
  ];
  const calldatas = [pet404Calldata, dnaCalldata, automationCalldata];

  const { diamondMultiInit, calldataMultiInit } = await deployMultiInit(
    targets,
    calldatas
  );

  // Deploy Diamond contract
  // Owner of the Diamond (have the ownership of the whole contract facets)
  const ownerSigner = (await ethers.getSigners())[9];

  const diamondContract = await deployDiamond(
    ownerSigner.address,
    [pet404FacetCuts, dnaFacetCuts, automationFacetCuts, exposer404FacetCuts],
    await diamondMultiInit.getAddress(), // Target address for initialization
    calldataMultiInit // Calldata that will be used for initialization
  );

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

  // PET404NonVRF Related contracts
  const PET404ContractsData = await deployFullPET404DiamondNonVrf();

  // Configuration for the pool
  const token1Address = await erc20Token.getAddress(); // token0
  const erc404Address = await PET404ContractsData.diamondContract.getAddress(); // token1
  // (0.05, 0.3, 1, 0.01)
  const fee = 0.3 * 10000;
  // The recipient signer is the same signer that we used when deploying the PET404NonVRF (initialMintRecipient)
  const [recipientSigner] = await ethers.getSigners();

  // Create the pool
  const poolAddress = await createPool(
    uniswapFactory,
    erc404Address,
    token1Address,
    fee
  );

  // Set Uniswap addresses as transfer exemptions and special exemption so they don't mint
  // NFTs for they own and behave correclty.
  // This is hihgly recommend to be used with pools
  await setAddressAsSpecialExempt(
    PET404ContractsData.diamondContract,
    PET404ContractsData.ownerSigner,
    [
      await positionManager.getAddress(),
      await swapRouter.getAddress(),
      poolAddress,
    ]
  );

  // Config for initialization of the pool
  const price = encodePriceSqrt(404000, 1);

  // Initilize the pool (the signer can be anyone who want to initialize the pool
  await initializePool(poolAddress, price, recipientSigner);

  // ADDING LIQUIDITY

  // Config for adding liquidity
  const mulLiquidity =
    PET404ContractsData.facetsArgs.pet404.maxTotalSupplyERC721_;
  const positMangAddr = await positionManager.getAddress();
  const chainId = (await recipientSigner.provider.getNetwork()).chainId;
  const token1Decimals = await erc20Token.decimals();
  const erc404Decimals = await PET404ContractsData.diamondContract.decimals();
  const amountErc404 =
    mulLiquidity * (await PET404ContractsData.diamondContract.units());
  const amountToken1 =
    ethers.parseUnits(mulLiquidity.toString(), 18) * mulLiquidity;

  const bal = await erc20Token.balanceOf(recipientSigner.address);
  if (amountToken1 > bal) {
    await erc20Token.connect(recipientSigner).mint(amountToken1 - bal);
  }

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
      fee,
      poolAddress,
    },
  };
}
