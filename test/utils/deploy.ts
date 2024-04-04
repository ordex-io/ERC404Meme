import { ethers, upgrades } from "hardhat";
import { NFT404 } from "../../typechain-types";
import {
  ERC404InitParamsStruct,
  DNAInitParamsStruct,
} from "../../typechain-types/contracts/NFT404";

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

  const erc404Params: ERC404InitParamsStruct = {
    name: "CAT NFT 404",
    symbol: "CN404",
    decimals,
    units,
    maxTotalSupplyERC20,
    initialMintRecipient: signers[0].address,
  };

  const dnaParams: DNAInitParamsStruct = {
    schema_hash: ethers.randomBytes(32),
    variants_name: ["head", "hat", "background", "eyes"],
  };

  const automationRegistry = signers[9];
  const automationRegistryAddress = signers[9].address;

  const nft404 = (await upgrades.deployProxy(factory, [
    erc404Params,
    dnaParams,
    automationRegistryAddress,
  ])) as unknown as NFT404;

  await nft404.waitForDeployment();

  return {
    nft404,
    nft404Address: await nft404.getAddress(),
    automationRegistry,
    automationRegistryAddress,
    erc404Params,
    dnaParams,
  };
}
